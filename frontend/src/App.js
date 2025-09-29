import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import io from "socket.io-client";
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import heatpump from './images/heat-pump.png';
import hellofresh from './images/dt-1-hello-fresh-co-uk.png';
import EnergyCertTrust from './images/energy-saving-certified.png';
import GreenBusinessCertified from './images/green-business-cert.png';
import EDFSmartMeter from './images/edf-smart-meter.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useForm } from "react-hook-form";
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// Register Chart.js components
Chart.register(...registerables);

// Define socket connection based on environment
const socket = io(
  process.env.NODE_ENV === "production"
    ? process.env.REACT_APP_BACKEND_URL_PROD
    : process.env.REACT_APP_BACKEND_URL_DEV
);

// Apps Script URL from environment variable
const APPS_SCRIPT_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

// Affiliate configuration for energy suppliers
const AFFILIATE_CONFIG = {
  "Octopus Energy": {
    baseUrl: "https://octopus.energy/",
    affiliateParam: "?awc=2334297_1_5d541736-1257-4e1a-a984-37e189817459",
    trackingId: "SPYDER-OCTOPUS",
    commissionRate: 0.05, // 5% commission
    contact: "0808 164 1088",
    defaultTariff: "Flexible Octopus",
    defaultCost: 23.28
  },
  "EDF Energy": {
    baseUrl: "https://www.edfenergy.com/",
    affiliateParam: "?awc=2334297_2_5d541736-1257-4e1a-a984-37e189817459",
    trackingId: "SPYDER-EDF",
    commissionRate: 0.04, // 4% commission
    contact: "0333 200 5100",
    defaultTariff: "Fixed",
    defaultCost: 23.28
  },
  "E.ON Next": {
    baseUrl: "https://www.eonnext.com/",
    affiliateParam: "?awc=2334297_3_5d541736-1257-4e1a-a984-37e189817459",
    trackingId: "SPYDER-EON",
    commissionRate: 0.03, // 3% commission
    contact: "0808 501 5200",
    defaultTariff: "Next Flex",
    defaultCost: 25.69
  }
};

// Function to generate affiliate links
const generateAffiliateLink = (supplier, customParams = {}) => {
  const config = AFFILIATE_CONFIG[supplier];
  if (!config) return null;
  
  const url = new URL(config.baseUrl);
  url.searchParams.set('affiliate_id', config.trackingId);
  url.searchParams.set('utm_source', 'SPYDER');
  url.searchParams.set('utm_medium', 'affiliate');
  url.searchParams.set('utm_campaign', 'energy_switch');
  
  // Add custom parameters if provided
  Object.entries(customParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
};

// Meter data with dynamic affiliate links
let meterData = {
  "SMR-98756-1-A": {
    supplier: "Octopus Energy",
    cost: AFFILIATE_CONFIG["Octopus Energy"].defaultCost,
    tariff: AFFILIATE_CONFIG["Octopus Energy"].defaultTariff,
    total: 0,
    contact: AFFILIATE_CONFIG["Octopus Energy"].contact,
    target: AFFILIATE_CONFIG["Octopus Energy"].baseUrl,
    affiliateLink: generateAffiliateLink("Octopus Energy", { tariff: "flexible" }),
    commissionRate: AFFILIATE_CONFIG["Octopus Energy"].commissionRate
  },
  "SMR-43563-2-A": {
    supplier: "EDF Energy",
    cost: AFFILIATE_CONFIG["EDF Energy"].defaultCost,
    tariff: AFFILIATE_CONFIG["EDF Energy"].defaultTariff,
    total: 0,
    contact: AFFILIATE_CONFIG["EDF Energy"].contact,
    target: AFFILIATE_CONFIG["EDF Energy"].baseUrl,
    affiliateLink: generateAffiliateLink("EDF Energy", { plan: "fixed" }),
    commissionRate: AFFILIATE_CONFIG["EDF Energy"].commissionRate
  },
  "SMR-65228-1-B": {
    supplier: "E.ON Next",
    cost: AFFILIATE_CONFIG["E.ON Next"].defaultCost,
    tariff: AFFILIATE_CONFIG["E.ON Next"].defaultTariff,
    total: 0,
    contact: AFFILIATE_CONFIG["E.ON Next"].contact,
    target: AFFILIATE_CONFIG["E.ON Next"].baseUrl,
    affiliateLink: generateAffiliateLink("E.ON Next", { plan: "nextflex" }),
    commissionRate: AFFILIATE_CONFIG["E.ON Next"].commissionRate
  }
};

// Function to track affiliate clicks
const trackAffiliateClick = (supplier, meterId) => {
  console.log(`Affiliate click tracked for ${supplier} from meter ${meterId}`);
  
  if (window.gtag) {
    window.gtag('event', 'affiliate_click', {
      'event_category': 'affiliate',
      'event_label': supplier,
      'value': meterId
    });
  }
  
  const clickData = {
    supplier,
    meterId,
    timestamp: new Date().toISOString(),
    userId: localStorage.getItem('userId') || 'anonymous'
  };
  
  localStorage.setItem(`lastAffiliateClick_${meterId}`, JSON.stringify(clickData));
};

const Paypal = ({ amount, currency, onSuccess, onError }) => {
  return (
    <PayPalButtons
      style={{ layout: "vertical" }}
      createOrder={(data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount,
                currency_code: currency,
              },
              description: "Newsletter subscription",
            },
          ],
        });
      }}
      onApprove={(data, actions) => {
        return actions.order.capture().then((details) => {
          onSuccess(details);
        });
      }}
      onError={(err) => {
        onError(err);
      }}
    />
  );
};

const NewsletterModal = memo(({ onClose, onPaymentSuccess }) => {
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError('');

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Process payment based on selected method
      if (paymentMethod === 'paypal') {
        // PayPal processing will be handled by the PayPal button component
        return;
      } else {
        // Validate card details for credit card payment
        if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
          throw new Error('Please fill all card details');
        }
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // In a real app, you would call your payment gateway API here
        console.log('Processing card payment', { email, cardDetails });
      }

      // On successful payment
      handlePaymentSuccess();
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful:', paymentData);
    toast.success('Payment processed successfully!');
    setIsProcessing(false);
    onClose();
    navigate('/newsletter');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content newsletter-modal">
        <div className="modal-header">
          <h2>Subscribe to Newsletter</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="payment-method-select"
              >
                <option value="paypal">PayPal</option>
                <option value="credit">Credit Card</option>
              </select>
            </div>

            {paymentMethod === 'credit' && (
              <div className="card-details">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    placeholder="1234 5678 9012 3456"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value})}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="paypal-button-container">
                <PayPalScriptProvider options={{ 
                  "client-id": "test",
                  components: "buttons",
                  currency: "USD"
                }}>
                  <Paypal 
                    amount="0.99" 
                    currency="USD" 
                    onSuccess={handlePaymentSuccess}
                    onError={(err) => setError(err.message)}
                  />
                </PayPalScriptProvider>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {paymentMethod === 'credit' && (
              <div className="submit-button-container">
                <button 
                  type="submit" 
                  className="payment-button"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Subscribe for $0.99/month'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
});

NewsletterModal.displayName = "NewsletterModal";

const Modal = memo(
  ({
    readings,
    onReadingChange,
    onDateChange,
    onAddReading,
    onRemoveReading,
    onClose,
    onSend,
    onPay,
    isSending,
    meterInfo,
    onAccountNumberChange,
  }) => {
    const calculateTotal = () => {
      return readings.reduce((sum, reading) => {
        const value = parseFloat(reading.value) || 0;
        return sum + (value * (meterInfo.cost / 100));
      }, 0).toFixed(2);
    };

    const handleAffiliateClick = () => {
      trackAffiliateClick(meterInfo.supplier, meterInfo.id);
      window.open(meterInfo.affiliateLink, "_blank");
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h2>Meter Details - {meterInfo.id}</h2>
            </div>
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <button 
              className="switch-supplier-button"
              onClick={handleAffiliateClick}
            >
              <a href={meterInfo.affiliateLink} target="_blank" rel="noopener noreferrer">
                Switch to {meterInfo.supplier}
              </a>
            </button>
            <small>We earn a {meterInfo.commissionRate * 100}% commission if you switch</small>

            <div className="detail-row">
              <div className="account-number-input">
                <h3>Customer Email:</h3>
                <input
                  type="text"
                  id="accountNumber"
                  value={meterInfo.accountNumber}
                  onChange={onAccountNumberChange}
                  placeholder="Enter your email"
                  className="account-input"
                />
              </div>
              <h3><span className="updateReader">Send your reading(s)</span></h3>
              {readings.map((reading, index) => (
                <div key={index} className="reading-row">
                  <div className="reading-input-container">
                    <input
                      type="number"
                      value={reading.value}
                      onChange={(e) => onReadingChange(index, e.target.value)}
                      className="reading-input"
                      step="0.01"
                      min="0"
                      placeholder="Reading value"
                    />
                    <span className="reading-unit">kWh</span>
                  </div>
                  <div className="date-input-container">
                    <input
                      type="date"
                      value={reading.date}
                      onChange={(e) => onDateChange(index, e.target.value)}
                      className="date-input"
                    />
                  </div>
                  {index === readings.length - 1 ? (
                    <button 
                      type="button" 
                      className="add-reading-button"
                      onClick={onAddReading}
                    >
                      +
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="remove-reading-button"
                      onClick={() => onRemoveReading(index)}
                    >
                      -
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="detail-row">
              <h3>Supplier Information</h3>      
              <p>Supplier: <span className="energy-supplier">{meterInfo.supplier}</span></p>
              <p>Tariff Type: {meterInfo.tariff}</p>
            </div>
            <div className="detail-row">
              <h3>How much you will be paying</h3>
              <p>Rate per kWh: {meterInfo.cost}p</p>
              <p>Total Cost: £{calculateTotal()}</p>
            </div>
            <div className="detail-row">
              <button
                className="send-reading-button"
                onClick={onSend}
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send Meter Reading(s) to SPYDER"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

function AppWithPayPalProvider() {
  const [readings, setReadings] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [consumptionRates, setConsumptionRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const { user } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [meterReadings, setMeterReadings] = useState([{ value: "", date: new Date().toISOString().split('T')[0] }]);
  const [calculatedResults, setCalculatedResults] = useState([]);
  const [userReading, setUserReading] = useState("");

  const updateReading = useCallback(({ meter_id, reading, timestamp, consumption_rate }) => {
    setReadings((prevReadings) => {
      const currentReading = parseFloat(reading) || 0;
      const totalCost = (currentReading * (meterData[meter_id].cost / 100)).toFixed(2);
      
      const newReading = {
        ...meterData[meter_id],
        reading: reading.toFixed(2),
        total: totalCost,
      };
      
      setHistoricalData(prev => ({
        ...prev,
        [meter_id]: [
          ...(prev[meter_id] || []),
          { reading, timestamp }
        ].slice(-20)
      }));

      // Update consumption rate for this meter
      if (consumption_rate) {
        setConsumptionRates(prev => ({
          ...prev,
          [meter_id]: consumption_rate
        }));
      }
      
      return {
        ...prevReadings,
        [meter_id]: newReading
      };
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    socket.on("newReading", updateReading);
    return () => socket.off("newReading", updateReading);
  }, [updateReading]);

  const handleCalculate = (e) => {
    e.preventDefault();
    const reading = parseFloat(userReading);
    if (!isNaN(reading)) {
      const results = Object.entries(meterData).map(([id, data]) => {
        const calculatedCost = (reading * (data.cost / 100)).toFixed(2);
        return {
          id,
          supplier: data.supplier,
          cost: calculatedCost,
          tariff: data.tariff,
          contact: data.contact,
          target: data.target,
          affiliateLink: data.affiliateLink,
          commissionRate: data.commissionRate,
          total: calculatedCost
        };
      });
      setCalculatedResults(results);
    }
  };

  const handleCloseResults = () => {
    setCalculatedResults([]);
    setUserReading("");
  };

  const stopReading = () => {
    socket.emit("stopReading");
    setIsReadingActive(false);
  };

  const startReading = () => {
    socket.emit("startReading");
    setIsReadingActive(true);
  };

  const handleReadingChange = (index, value) => {
    const newReadings = [...meterReadings];
    newReadings[index].value = value;
    setMeterReadings(newReadings);
  };

  const handleDateChange = (index, date) => {
    const newReadings = [...meterReadings];
    newReadings[index].date = date;
    setMeterReadings(newReadings);
  };

  const handleAddReading = () => {
    setMeterReadings([...meterReadings, { value: "", date: new Date().toISOString().split('T')[0] }]);
  };

  const handleRemoveReading = (index) => {
    if (meterReadings.length > 1) {
      const newReadings = [...meterReadings];
      newReadings.splice(index, 1);
      setMeterReadings(newReadings);
    }
  };

  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setMeterReadings([{ value: "", date: new Date().toISOString().split('T')[0] }]);
    startReading();
  }, []);

  const handleNewsletterModalClose = useCallback(() => {
    setShowNewsletterModal(false);
  }, []);

  const handleNewsletterSubscribe = () => {
    setShowNewsletterModal(true);
  };

  const handleSendReading = useCallback(async () => {
    if (modalData && user) {
      setIsSending(true);
      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          redirect: "follow",
          headers: {
            "Content-Type": "text/plain;charset=utf-8",
          },
          body: JSON.stringify({
            userEmail: user.primaryEmailAddress.emailAddress,
            meterData: {
              id: modalData.id,
              readings: meterReadings,
              supplier: modalData.supplier,
              tariff: modalData.tariff,
              cost: modalData.cost,
              total: meterReadings.reduce((sum, reading) => {
                const value = parseFloat(reading.value) || 0;
                return sum + (value * (modalData.cost / 100));
              }, 0).toFixed(2),
              accountNumber: modalData.accountNumber,
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success("Meter reading details sent!");
          setShowModal(false);
          setMeterReadings([{ value: "", date: new Date().toISOString().split('T')[0] }]);
          startReading();
        } else {
          throw new Error(data.error || "Failed to send email");
        }
      } catch (error) {
        console.error("Email error:", error);
        toast.error("Failed to send email: " + error.message);
      } finally {
        setIsSending(false);
      }
    }
  }, [modalData, user, meterReadings]);

  const handlePay = useCallback(() => {
    const total = meterReadings.reduce((sum, reading) => {
      const value = parseFloat(reading.value) || 0;
      return sum + (value * (modalData.cost / 100));
    }, 0).toFixed(2);
    console.log("Paying £" + total);
  }, [modalData, meterReadings]);

  const handleAccountNumberChange = useCallback((e) => {
    setModalData((prev) => ({
      ...prev,
      accountNumber: e.target.value,
    }));
  }, []);

  const handleMeterSelect = useCallback((meterId, data, e) => {
    if (e.target.closest('.target-link')) {
      return;
    }
    
    stopReading();
    const meterSnapshot = {
      id: meterId,
      reading: data.reading,
      supplier: data.supplier,
      tariff: data.tariff,
      cost: data.cost,
      total: data.total,
      emailAddress: "",
      accountNumber: "",
      affiliateLink: data.affiliateLink,
      commissionRate: data.commissionRate
    };
    setModalData(meterSnapshot);
    setMeterReadings([{ value: data.reading || "", date: new Date().toISOString().split('T')[0] }]);
    setShowModal(true);
  }, []);

  const handleResultClick = (result) => {
    stopReading();
    const currentReading = parseFloat(userReading) || 0;
    const totalCost = (currentReading * (result.cost / 100)).toFixed(2);
    
    const meterSnapshot = {
      id: result.id,
      reading: userReading || "0",
      supplier: result.supplier,
      tariff: result.tariff,
      cost: result.cost,
      total: totalCost,
      emailAddress: "",
      accountNumber: "",
      affiliateLink: result.affiliateLink,
      commissionRate: result.commissionRate
    };
    setModalData(meterSnapshot);
    setMeterReadings([{ value: userReading || "", date: new Date().toISOString().split('T')[0] }]);
    setShowModal(true);
  };

  const handleAffiliateLinkClick = (supplier, meterId, e) => {
    e.stopPropagation();
    trackAffiliateClick(supplier, meterId);
  };

  const renderModal = () => {
    if (!modalData || !showModal) return null;

    return (
      <Modal
        readings={meterReadings}
        onReadingChange={handleReadingChange}
        onDateChange={handleDateChange}
        onAddReading={handleAddReading}
        onRemoveReading={handleRemoveReading}
        onClose={handleModalClose}
        onSend={handleSendReading}
        onPay={handlePay}
        isSending={isSending}
        meterInfo={modalData}
        onAccountNumberChange={handleAccountNumberChange}
      />
    );
  };

  const renderNewsletterModal = () => {
    if (!showNewsletterModal) return null;

    return (
      <NewsletterModal 
        onClose={handleNewsletterModalClose}
        onPaymentSuccess={() => {
          handleNewsletterModalClose();
          toast.success("Thank you for subscribing to our newsletter!");
        }}
      />
    );
  };

  const MeterRow = ({ meterId, data, isInteractive }) => {
    const chartData = {
      labels: historicalData[meterId]?.map((_, i) => i) || [],
      datasets: [{
        label: 'Energy Usage (kWh)',
        data: historicalData[meterId]?.map(d => d.reading) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    };

    const currentReading = parseFloat(data.reading) || 0;
    const totalCost = (currentReading * (data.cost / 100)).toFixed(2);
    const consumptionRate = consumptionRates[meterId] || "Normal";

    return (
      <div className="meter-row">
        <div
          className={`card ${isInteractive ? "card-interactive" : "card-disabled"}`}
          onClick={isInteractive ? (e) => handleMeterSelect(meterId, data, e) : undefined}
        >
          <div className="card-header">
            <div className="card-title">
              {`Meter ${meterId}`}
              <span className="status-indicator">
                <span className={`ping ${isReadingActive ? "active" : "stopped"}`}></span>
                <span className={`dot ${isReadingActive ? "active" : "stopped"}`}></span>
              </span>
            </div>
          </div>
          <div className="card-content">
            <div className="reading-display">
              <span>{data.reading}</span>
              <span className="unit">kWh</span>
              <p className="changeReading">Send your reading(s).</p>
            </div>
            <div className="other-display">
              <span className="unit2">Supplier:</span>
              <span>{data.supplier}</span>
            </div>
            <div className="other-display">
              <span className="unit2">Tariff:</span>
              <span>{data.tariff}</span>
            </div>
            <div className="other-display">
              <span className="unit2">Cost per kWh:</span>
              <span>{data.cost}p</span>
            </div>
            <div className="other-display">
              <span className="unit2">Total Cost:</span>
              <span>£{totalCost}</span>
            </div>
            <div>Contact: {data.contact}</div>
            {data.target && (
              <div className="target-link" onClick={(e) => handleAffiliateLinkClick(data.supplier, meterId, e)}>
                <a href={data.affiliateLink} target="_blank" rel="noopener noreferrer">
                  SWITCH to {data.supplier} ! (Earn us {data.commissionRate * 100}%)
                </a>
              </div>
            )}
          </div>
        </div>
        <br />
        <div className="meter-graph">
          <div className="consumption-rate-label" style={{
            textAlign: 'center',
            padding: '5px',
            backgroundColor: consumptionRate.includes('High') ? '#ffebee' : 
                             consumptionRate.includes('Low') ? '#e8f5e8' : '#fff3e0',
            color: consumptionRate.includes('High') ? '#c62828' : 
                   consumptionRate.includes('Low') ? '#2e7d32' : '#ef6c00',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            borderRadius: '4px 4px 0 0'
          }}>
            Current Consumption: {consumptionRate}
          </div>
          <Line 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: false
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  const MeterGrid = ({ isInteractive = true }) => (
    <div className="meter-grid">
      {Object.entries(readings).map(([meterId, data]) => (
        <MeterRow 
          key={meterId}
          meterId={meterId}
          data={data}
          isInteractive={isInteractive}
        />
      ))}
    </div>
  );

  return (
    <PayPalScriptProvider options={{ 
      "client-id": "YOUR_PAYPAL_CLIENT_ID",
      components: "buttons",
      currency: "USD"
    }}>
      <div className="app-container">
        <ToastContainer position="top-right" autoClose={3000} />
        <nav className="navbar">
          <div className="navbar-brand">
            <h2 style={{ fontWeight: "bold", color: "green" }}><a href="/">SPYDER</a></h2>
          </div>
          <div className="navbar-auth">
            <SignedOut>
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
          <div>
            <Link to="/newsletter" className="crumbtrail"><small>Newsletter</small></Link> 
          </div>
        </nav>

        <div className="main-content-container">
          <div className="content-area">
            <div className="container">
              <h3 className="title">Price Comparison Smart Energy Meter Reader</h3>
              <p className="app-description">
              The <strong>SPYDER</strong> Digital Twin Smart Energy Meter Reader, helps you find the best electricity 
              tariff at the most competitive price. Compare different tariffs, check prices and choose the right option 
              to save on energy bills. The Reader also serves as a forecasting system, a settlement tool and a Net Zero
              initiative. We aim to make great saving decisions making a breeze for everyone, and that purpose drives us 
              every day! It's why we have accomplished our mission by creating an artificial intelligence run-time quoting
              engine for finding the best energy tariffs, with the simplest of experiences, wrapped in a brand everyone loves!
              We change lives by making it simple to switch and save money! Please login to experience the interactivity of the comparison Meters and Graphs.
              </p>
              <SignedOut>
                <p className="auth-prompt">
                  Start comparing now and make smarter choices for your electricity
                  usage. Please &nbsp;
                  <SignInButton mode="modal" className="login-button">
                    Sign in &nbsp;
                  </SignInButton>
                  &nbsp;&nbsp; and select a Smart Meter!
                </p>
              </SignedOut>
              <SignedIn>
                <div className="reading-form-container">
                  <form onSubmit={handleCalculate}>
                    <input
                      type="number"
                      value={userReading}
                      onChange={(e) => setUserReading(e.target.value)}
                      className="reading-input"
                      placeholder="Please Enter your reading"
                      step="0.01"
                      min="0"
                      required
                    />
                    <button type="submit" className="calculate-button">
                      Calculate
                    </button>
                  </form>

                  {calculatedResults.length > 0 && (
                    <div className="results-container">
                      <table className="cost-table">
                        <thead>
                          <tr>
                            <th>Energy Company</th>
                            <th>Total Cost (£)</th>
                            <th>Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calculatedResults.map((result, index) => (
                            <tr key={index} onClick={() => handleResultClick(result)} className="result-row">
                              <td>
                                <span className="switch-tariff-supplier">
                                  {result.supplier} 
                                  <a href={result.affiliateLink} target="_blank" rel="noopener noreferrer">
                                    <strong>(SWITCH!)</strong>
                                  </a>
                                </span>
                              </td>
                              <td>£{result.cost}</td>
                              <td>{result.commissionRate * 100}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button 
                        onClick={handleCloseResults} 
                        className="close-results-button"
                      >
                        Close Results
                      </button>
                      <p>To help you optimise your energy costs, we invite you to subscribe to
                         <strong> Jim </strong> 
                      our AI quoting engine in our Newsletter.

For $0.99 per month, you will gain access to our real-time chat engine, which provides:<br />

<strong>Live Market Analysis:</strong> Get instant quotes based on real-time pricing and predictive trend forecasts.<br />

<strong>Personalised AI Modelling:</strong> Receive custom responses that analyse your consumption patterns, 
including peaks, load-shedding, and anomalies.<br />

<strong>Tailored Recommendations: </strong>We will identify a competitive energy provider and tariff better 
suited to your needs.<br />

<strong>Interactive Dashboard:</strong> Monitor your usage and savings through a personalised visualisation dashboard.<br />

This service ensures you receive the most cost-effective and efficient energy solution available.
Please note: Advertisers are exempt from this charge.</p>
                    </div>
                  )}
                </div>

                <MeterGrid isInteractive={true} />
                {renderModal()}
                {renderNewsletterModal()}

                <div className="button-container">
                  {isReadingActive ? (
                    <button onClick={() => stopReading()} className="stop-button">
                      Stop
                    </button>
                  ) : (
                    <button onClick={() => startReading()} className="start-button">
                      Start
                    </button>
                  )}
                </div>
                <div className="race-to-zero">
                  <Link to="/pricing">Race to zero emission future - Partner with us!</Link>
                </div>
              </SignedIn>
            </div>

            <div className="ad-container">
              <div className="ad-column">
                <div className="ad-label">
                  <div className="responsive-iframe-container">
                    <iframe
                      src="https://www.youtube.com/embed/O7ACNMj8NW0"
                      title="Evolution of Tesla (Animation)"
                      alt="Evolution of Tesla"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>
                
                  <div className="responsive-image-container">
                    <img src={heatpump} alt="Heat pump" className="ad-image" />
                  </div>
                </div>
              </div>

              <div className="ad-column">
                <div className="ad-label">
                  <div className="media-grid">
                    <div className="media-container video">
                      <span><a href="/pricing">Premium Ad Placement - Available!</a></span>
                      <iframe
                        src=""
                        title="Dummy Video"
                        alt="Dummy Video"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  
                    <div className="media-container image">
                      <span>100% Organic</span>
                      <iframe
                        src={hellofresh}
                        title="100% Organic"
                        alt="100% Organic"
                        frameBorder="0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="brand-story-container">
              <div className="brand-story-column">
                <div className="immersive-brand-ad">
                  <div className="brand-hero-video">
                    <video 
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/images/green-energy-poster.jpg"
                      className="brand-video"
                    >
                      <source src="https://goods-vod.kwcdn.com/goods-video/2e893b7d49267bbcf912d457f659eede65dad719.f30.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="video-overlay">
                      <h2>The Future of Clean Energy</h2>
                      <p>How we're powering tomorrow's world today</p>
                    </div>
                  </div>

                  <div className="brand-narrative">
                    <div className="narrative-content">
                      <div className="narrative-text">
                        <h3>Our Journey to Sustainability</h3>
                        <p>
                          Founded in 2010, GreenPower Solutions began with a simple mission: to make renewable energy 
                          accessible to everyone. What started as a small team of engineers in a garage has grown into 
                          a global movement powering over 1 million homes with clean energy.
                        </p>
                        <div className="brand-stats">
                          <div className="stat-item">
                            <span className="stat-number">1M+</span>
                            <span className="stat-label">Homes Powered</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">85%</span>
                            <span className="stat-label">Carbon Reduction</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-number">24/7</span>
                            <span className="stat-label">Clean Energy</span>
                          </div>
                        </div>
                      </div>
                      <div className="narrative-image">
                        <p className="image-caption"><i>Our founding team in 2012, working on the first prototypes</i></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="brand-story-column">
                <div className="media-container video">
                  <span><a href="/pricing">Ad placement: Brand Story - Available</a></span>
                  <iframe
                    src=""
                    title="Brand Story Video Part 2"
                    alt="Brand Story Video Part 2"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="product-showcase">
                    <h3>Innovation That Powers Life</h3>
                    <div className="product-features">
                      <div className="feature">
                        <div className="feature-video-container">
                          <video 
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="feature-video"
                          >
                            <source src="https://goods-vod.kwcdn.com/goods-video/991226355a5aed619dd7b4e8c443e418184d438b.f30.mp4" type="video/mp4" />
                          </video>
                        </div>
                        <h4>Next-Gen Solar Panels</h4>
                        <p>40% more efficient than conventional panels with our patented nano-coating technology</p>
                      </div>
                      <div className="feature">
                        <div className="feature-video-container">
                          <video 
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="feature-video"
                          >
                            <source src="https://goods-vod-eu.kwcdn.com/local-goods-vod/f17793572598e526aef7d74d7b03f277a1e56ea6.f30.mp4" type="video/mp4" />
                          </video>
                        </div>
                        <h4>Home Battery Systems</h4>
                        <p>Store excess energy with our compact, high-capacity home batteries</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="brand-cta">
                  <h3>Join the Energy Revolution</h3>
                  <p>Get a personalized quote and see how much you could save</p>
                  <div className="cta-buttons">
                    <button className="cta-primary">How We Achieved 100% Uptime!</button>
                    <button className="cta-secondary">Watch Our Story</button>
                  </div>
                  <div className="trust-badges">
                    <img src={EnergyCertTrust} alt="Energy Trust Certified" />
                    <img src={GreenBusinessCertified} alt="Green Business Certified" />
                  </div>
              </div>
          
          </div>    
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

export default function EnergyMeter() {
  return (
    <PayPalScriptProvider options={{ 
      "client-id": "YOUR_PAYPAL_CLIENT_ID",
      components: "buttons",
      currency: "USD"
    }}>
      <AppWithPayPalProvider />
    </PayPalScriptProvider>
  );
}