"use client";

import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import io from "socket.io-client";
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import paperWhisky from './images/whisky-in-paper-bottle.png';
import woodenbike from './images/wooden-bicycle.jpg';
import heatpump from './images/heat-pump.png';
import hellofresh from './images/dt-1-hello-fresh-co-uk.png';
import lovejoint from './images/dt-2-love-joint.png';
import productShowcase from './images/product-showcase-2.png';
import VitaminD from './images/dt-6-VD.png';
import PrtableSolarFan from './images/edf-portable-solar-fan.png';
import ElectricGreenerBiker from './images/temu-electric-bike.png';
import BubbleGun from './images/bubble-gun.png';
import EnergyCertTrust from './images/energy-saving-certified.png';
import GreenBusinessCertified from './images/green-business-cert.png';
import EDFSmartMeter from './images/edf-smart-meter.png';
import { Link } from 'react-router-dom';
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

let meterData = {
  "SMR-98756-1-A": {
    supplier: "Octopus Energy",
    cost: 23.28,
    tariff: "Fixed",
    total: 0,
    contact: "0808 164 1088",
    target: "https://octopus.energy/",
    affiliateLink: "https://octopus.energy/"
  },
  "SMR-43563-2-A": {
    supplier: "EDF Energy",
    cost: 23.28,
    tariff: "Fixed",
    total: 0,
    contact: "0333 200 5100",
    target: "https://www.edfenergy.com/",
    affiliateLink: "https://www.edfenergy.com/?affiliate=SPYDER",
  },
  "SMR-65228-1-B": {
    supplier: "E.ON Next",
    cost: 25.69,
    tariff: "Standard",
    total: 0,
    contact: "0808 501 5200",
    target: "https://www.eonnext.com/",
    affiliateLink: "https://www.eonnext.com/"
  }
};

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
              onClick={() => window.open(meterInfo.affiliateLink, "_blank")}
            >
              Switch to {meterInfo.supplier}
            </button>
            <small>We earn a commission if you switch</small>

            <div className="detail-row">
              <div className="account-number-input">
                {/*<h3>Customer Account Number:</h3>*/}
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
                {isSending ? "Sending..." : "Send Meter Reading"}
              </button>
              <button
                className="paypal-payment-button"
                onClick={onPay}
                disabled={isSending}
              >
                Payment Gateway
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

export default function EnergyMeter() {
  const [readings, setReadings] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useUser();
  const [isSending, setIsSending] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [meterReadings, setMeterReadings] = useState([{ value: "", date: new Date().toISOString().split('T')[0] }]);
  const [calculatedResults, setCalculatedResults] = useState([]);
  const [userReading, setUserReading] = useState("");

  const updateReading = useCallback(({ meter_id, reading, timestamp }) => {
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
      affiliateLink: data.affiliateLink
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
      affiliateLink: result.affiliateLink
    };
    setModalData(meterSnapshot);
    setMeterReadings([{ value: userReading || "", date: new Date().toISOString().split('T')[0] }]);
    setShowModal(true);
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
              <div className="target-link" onClick={(e) => e.stopPropagation()}>
                <a href={data.target} target="_blank" rel="noopener noreferrer">
                  SWITCH!
                </a>
              </div>
            )}
          </div>
        </div>
        <br />
        <div className="meter-graph">
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
          <Link to="/advertising" className="crumbtrail"> <small>Advertising | </small></Link>
          <Link to="/pricing" className="crumbtrail"> <small>Pricing</small></Link>
        </div>
      </nav>

      <div className="main-content-container">
        <div className="sideBar">
          <div className="ad-card">
            <h4>Premium Ad Spot</h4>
            <p>Available for your brand</p>
            <div className="ad-placeholder"></div>
          </div>
          <div className="ad-card">
            <h4>Portable Solar Panelssssss</h4>
            <p>Special offer for users</p>
            <div className="ad-placeholder">
              <img src={PrtableSolarFan} alt="Portable Solar Fan" className="ad-image" />
            </div>
          </div>
          {/*<div className="ad-card">
            <h4>Energy Booster</h4>
            <p>The Power of Nature. 100% Organic Tree Bark.</p>
            <div className="ad-placeholder">
            <img src={lovejoint} alt="6 DRIVE" className="ad-image" />
            </div>
          </div>*/}
          <div className="ad-card">
            <h4>Eco-friendly</h4>
            <p>Electric Bike</p>
            <div className="ad-placeholder">
              <img src={ElectricGreenerBiker} alt="Electric Green Bike" className="ad-image" />
            </div>
          </div>
          <div className="ad-card">
            <h4>Gadget</h4>
            <p>Bubble Gun</p>
            <div className="ad-placeholder">
            <img src={BubbleGun} alt="Bubble Gun" className="ad-image" />
            </div>
          </div>
          <div className="ad-card">
            <h4>Smart Meter</h4>
            <p>The rise of smart tariffs</p>
            <div className="ad-placeholder">
              <img src={EDFSmartMeter} alt="EDF Smart Energy Meter" className="ad-image" />
            </div>
          </div>
          <div className="ad-card">
            <h4>Side bar</h4>
            <p>Featured Ads - Available</p>
            <div className="ad-placeholder"></div>
          </div>
          <div className="ad-card">
            <h4>Side bar</h4>
            <p>Featured Ads - Available</p>
            <div className="ad-placeholder"></div>
          </div> 
        </div>
        

        <div className="content-area">
          <div className="container">
            <h3 className="title">Price Comparison Smart Energy Meter Reader</h3>
            <p className="app-description">
              The <strong>SPYDER</strong> Digital Twin Smart Energy Meter Reader,
              helps you find the best electricity tariff at the most competitive
              price. Compare different meters, check prices and choose the right
              option to save on energy bills. The Reader also serves as a forecasting system, a settlement tool and a Net Zero initiative.
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
                        </tr>
                      </thead>
                      <tbody>
                        {calculatedResults.map((result, index) => (
                          <tr key={index} onClick={() => handleResultClick(result)} className="result-row">
                            <td><span className="switch-tariff-supplier">{result.supplier} <strong>(SWITCH!)</strong></span></td>
                            <td>£{result.cost}</td>
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
                    <p>To better serve your energy needs, we kindly request that you <br /><a href='/newsletter' className="subscribe-newsletter"><strong>Subscribe to our NEWSLETTER </strong></a> - $1.99 per month, <br />and share your past electricity meter readings with us. This data will enable us to make informed decisions through careful monitoring and analysis.
                    We have provided samples of how Meter Readings are modelled using AI and Machine Learning models to reflect peaks, load shedding and other anomalies including tampering.
                    Based on our assessment, we can provide you with a personalised account page with interactive Visualisation Dashboard, 
                    and recommend a more competitive energy provider with a tariff better suited to your consumption patterns.
                    Your cooperation will help ensure you receive the most cost-effective and efficient energy solution available.</p>
                  </div>
                )}
              </div>

              <MeterGrid isInteractive={true} />
              {renderModal()}

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
                <Link to="/advertising">Race to zero emission future - Partner with us!</Link>
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
                <div className="media-container video">
                  <span>Interactive Multimedia Premium Ad Placement - Available!</span>
                  <iframe
                    src=""
                    title="Dummy Video"
                    alt="Dummy Video"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="responsive-image-container">
                    <video 
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster="/images/green-energy-poster.jpg"
                      className="brand-video">
                      <source src=" https://goods-vod.kwcdn.com/goods-video/7c8b321c557108bd6103f8bbc13bb9c0ac06cfa9.f30.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    {/*<div className="video-overlay">
                      <h2>The Future of Clean Energy</h2>
                      <p>How we're powering tomorrow's world today</p>
                    </div>*/}
                  <img src={paperWhisky} alt="Whisky in Paper bottle" className="ad-image" />
                  <img src={woodenbike} alt="Wooden Bike" className="ad-image" />
                  <img src={heatpump} alt="Heat pump" className="ad-image" />

                  <div className="media-container video">
                    <span>In content Ad - Available!</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="media-container video">
                    <span>Available!</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="media-container video">
                    <span>Available!</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="media-container video">
                    <span>Available!</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="media-container video">
                    <span>Available!n</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>

                </div>
              </div>
            </div>

            <div className="ad-column">
              <div className="ad-label">
                <div className="media-grid">
                  <div className="media-container video">
                    <span>Premium Ad Placement - Available!</span>
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

                  <div className="media-container video">
                    <span>Product Showcase - Available</span>
                    <iframe
                      src=""
                      title="Dummy Video"
                      alt="Dummy Video"
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
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
                  {/*<img 
                    src="/images/founders-team.jpg" 
                    alt="GreenPower Solutions founding team" 
                    className="brand-story-image"
                  />*/}
                  <p className="image-caption"><i>Our founding team in 2012, working on the first prototypes</i></p>
                </div>
              </div>
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

            <div className="brand-cta">
              <h3>Join the Energy Revolution</h3>
              <p>Get a personalized quote and see how much you could save</p>
              <div className="cta-buttons">
                <button className="cta-primary">Calculate Savings</button>
                <button className="cta-secondary">Watch Our Story</button>
              </div>
              <div className="trust-badges">
                <img src={EnergyCertTrust} alt="Energy Trust Certified" />
                <img src={GreenBusinessCertified} alt="Green Business Certified" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="brand-story-column">
          <div className="media-container video">
            <span>Brand Story</span>
            <iframe
              src=""
              title="Brand Story Video Part 2"
              alt="Brand Story Video Part 2"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
