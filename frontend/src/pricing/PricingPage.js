import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import "./Pricing.css";
import "../App.css";
import { ToastContainer, toast } from "react-toastify";

export default function PricingPage() {
  // State management
  const [selectedAds, setSelectedAds] = useState({});
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdExample, setActiveAdExample] = useState(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState(false);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  // Constants for ad options
  const adGroups = {
    premiumBanner: {
      name: "Premium Banner",
      description: "Top-of-page placement with maximum visibility. Perfect for brand awareness campaigns.",
      options: [
        { id: "premiumBanner-6months", duration: "6 months", price: 595, discount: "" },
        { id: "premiumBanner-12months", duration: "12 months", price: 952, discount: "20% off" }
      ]
    },
    premiumImage: {
      name: "Premium Image",
      description: "Static image advertisements displayed throughout our platform.",
      options: [
        { id: "premiumImage-6months", duration: "6 months", price: 480, discount: "" },
        { id: "premiumImage-12months", duration: "12 months", price: 768, discount: "20% off" }
      ]
    },
    premiumVideo: {
      name: "Premium Video",
      description: "Video advertisements displayed throughout our platform.",
      options: [
        { id: "premiumVideo-6months", duration: "6 months", price: 560, discount: "" },
        { id: "premiumVideo-12months", duration: "12 months", price: 896, discount: "20% off" }
      ]
    },
    inContentImage: {
      name: "In-Content Image",
      description: "Static image advertisements displayed within content.",
      options: [
        { id: "inContentImage-6months", duration: "6 months", price: 380, discount: "" },
        { id: "inContentImage-12months", duration: "12 months", price: 608, discount: "20% off" }
      ]
    },
    inContentVideo: {
      name: "In-Content Video",
      description: "Dynamic video content in premium placements.",
      options: [
        { id: "inContentVideo-6months", duration: "6 months", price: 320, discount: "" },
        { id: "inContentVideo-12months", duration: "12 months", price: 512, discount: "20% off" }
      ]
    },
    sidebarPremiumImage: {
      name: "Sidebar Premium Image",
      description: "Image content in premium sidebar placements.",
      options: [
        { id: "sidebarPremiumImage-6months", duration: "6 months", price: 144, discount: "" },
        { id: "sidebarPremiumImage-12months", duration: "12 months", price: 230, discount: "20% off" }
      ]
    },
    sidebarPremiumVideo: {
      name: "Sidebar Premium Video",
      description: "Video in premium sidebar placements.",
      options: [
        { id: "sidebarPremiumVideo-6months", duration: "6 months", price: 144, discount: "" },
        { id: "sidebarPremiumVideo-12months", duration: "12 months", price: 230, discount: "20% off" }
      ]
    },
    sidebarStandardImage: {
      name: "Sidebar Standard Image",
      description: "Image content in standard sidebar placements.",
      options: [
        { id: "sidebarStandardImage-6months", duration: "6 months", price: 112, discount: "" },
        { id: "sidebarStandardImage-12months", duration: "12 months", price: 179, discount: "20% off" }
      ]
    },
    sidebarStandardVideo: {
      name: "Sidebar Standard Video",
      description: "Video in standard sidebar placements.",
      options: [
        { id: "sidebarStandardVideo-6months", duration: "6 months", price: 132, discount: "" },
        { id: "sidebarStandardVideo-12months", duration: "12 months", price: 211, discount: "20% off" }
      ]
    },
    productShowcaseImage: {
      name: "Premium Showcase Image",
      description: "Image content in premium placements.",
      options: [
        { id: "productShowcaseImage-6months", duration: "6 months", price: 536, discount: "" },
        { id: "productShowcaseImage-12months", duration: "12 months", price: 857, discount: "20% off" }
      ]
    },
    productShowcaseVideo: {
      name: "Premium Showcase Video",
      description: "Dynamic video content in premium placements.",
      options: [
        { id: "productShowcaseVideo-6months", duration: "6 months", price: 552, discount: "" },
        { id: "productShowcaseVideo-12months", duration: "12 months", price: 883, discount: "20% off" }
      ]
    },
    brandStory: {
      name: "Premium Brand Story",
      description: "Dynamic video content in premium placements.",
      options: [
        { id: "brandStory-6months", duration: "6 months", price: 680, discount: "" },
        { id: "brandStory-12months", duration: "12 months", price: 1088, discount: "20% off" }
      ]
    }
  };

  const adExamples = [
    {
      id: "banner-ad",
      title: "Premium Banner",
      description: "Top-of-page placement with maximum visibility. Perfect for brand awareness campaigns.",
      dimensions: "1200x200px",
      impressions: "50,000+ monthly",
      type: "banner"
    },
    {
      id: "sidebar-ad-premium-image",
      title: "Sidebar Image",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "150x150px",
      impressions: "30,000+ monthly",
      type: "sidebar"
    },
    {
      id: "sidebar-ad-premium-video",
      title: "Sidebar Video",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "150x150px",
      impressions: "30,000+ monthly",
      type: "sidebar"
    },
    {
      id: "inContent-ad-image",
      title: "In Content Image",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "400x400",
      impressions: "30,000+ monthly",
      type: "inContent"
    },
    {
      id: "inContent-ad-video",
      title: "In Content Video",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "400x400",
      impressions: "30,000+ monthly",
      type: "inContent"
    },
    {
      id: "premium-ad-image",
      title: "Premium Image",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "500x500px",
      impressions: "30,000+ monthly",
      type: "premiumImage"
    },
    {
      id: "premium-ad-video",
      title: "Premium Video",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "500x500px",
      impressions: "30,000+ monthly",
      type: "premiumVideo"
    },
    {
      id: "product-showcase-ad-image",
      title: "Premium Showcase Image",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "800x400px",
      impressions: "30,000+ monthly",
      type: "iinContent"
    },
    {
      id: "product-showcase-ad-video",
      title: "Premium Showcase Video",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "800x400px",
      impressions: "30,000+ monthly",
      type: "iinContent"
    },
    {
      id: "brand-story-ad",
      title: "Premium Brand Story",
      description: "Persistent visibility on all pages. Great for targeted promotions.",
      dimensions: "800x800px",
      impressions: "30,000+ monthly",
      type: "iinContent"
    }
  ];

  //ToDo
  //Add to above id: "brand-story2-ad", title: "Brand Story" and  id: "product-showcase2-ad-video",title: "Showcase Video"
  //for exposing to  newsleter ads. Update the Pricing indexing as well for both
  //Note:There are no sidebar advertising in HP

  // Load PayPal script
  useEffect(() => {
    const loadPayPalScript = () => {
      if (typeof window !== 'undefined' && window.paypal) {
        setPaypalLoaded(true);
        return;
      }
      
      const timer = setTimeout(() => {
        if (window.paypal) {
          setPaypalLoaded(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    };

    loadPayPalScript();
  }, []);

  // Form submission handler
  const onSubmit = async (data) => {
    setIsProcessing(true);
    try {
      console.log("Form submitted:", data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Payment successful! Total: $${calculateTotal()}`);
      resetForm();
    } catch (error) {
      setPaymentError("Payment processing failed. Please try again.");
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // PayPal integration
  const createOrder = (data, actions) => {
    if (Object.keys(selectedAds).length === 0) {
      setPaymentError("Please select at least one ad option");
      return actions.reject();
    }
    
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: calculateTotal().toString(),
            currency_code: "USD",
            breakdown: {
              item_total: {
                value: calculateTotal().toString(),
                currency_code: "USD"
              }
            }
          },
          items: getSelectedItems()
        }
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING"
      }
    });
  };

  const onApprove = (data, actions) => {
    return actions.order.capture().then((details) => {
      toast.success(`Transaction completed by ${details.payer.name.given_name}`);
      resetForm();
    });
  };

  const onError = (err) => {
    console.error("PayPal error:", err);
    setPaymentError("Payment failed. Please try another method.");
    toast.error("Payment failed. Please try another method.");
  };

  const onCancel = (data) => {
    console.log("Payment cancelled:", data);
    setPaymentError("Payment was cancelled");
    toast.warning("Payment was cancelled");
  };

  // Helper functions
  const calculateTotal = () => {
    return Object.values(selectedAds).reduce((total, ad) => total + ad.price, 0);
  };

  const getSelectedItems = () => {
    return Object.entries(selectedAds).map(([groupId, ad]) => ({
      name: `${adGroups[groupId].name} (${ad.duration})`,
      unit_amount: {
        value: ad.price.toString(),
        currency_code: "USD"
      },
      quantity: "1"
    }));
  };

  const resetForm = () => {
    setSelectedAds({});
    setPaymentError("");
    reset();
  };

  const handleAdExampleClick = (adId) => {
    setActiveAdExample(adId === activeAdExample ? null : adId);
  };

  const handleAdSelection = (groupId, option) => {
    setSelectedAds(prev => ({
      ...prev,
      [groupId]: option
    }));
  };

  const isAdSelected = (groupId, duration) => {
    return selectedAds[groupId]?.duration === duration;
  };

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
            <Link to="/newsletter" className="crumbtrail"><small>Newsletter</small></Link> 
         </div>
      </nav>

      <div className="advertising-header">
        <h1>Pricing Plans</h1>
        <p>
          Promote your business on our platform to reach thousands of energy-conscious consumers.
          The <strong>SPYDER</strong> Digital Twin Smart Energy Meter Reader helps users find the
          best electricity unit charges at competitive prices.
        </p>
      </div>

      <div className="advertising-columns">
        <div className="form-section">
          <form onSubmit={handleSubmit(onSubmit)} className="advertising-form">
            {Object.entries(adGroups).map(([groupId, group]) => (
              <div className="form-group" key={groupId}>
                <h2><i className={`icon-${groupId.includes('Video') ? 'video' : 'image'}`}></i> {group.name}</h2>
                <p className="section-description">{group.description}</p>
                <div className="options-grid">
                  {group.options.map((option) => (
                    <div 
                      className={`option-card ${isAdSelected(groupId, option.duration) ? 'selected' : ''}`}
                      key={option.id}
                      onClick={() => handleAdSelection(groupId, option)}
                    >
                      <input
                        type="radio"
                        id={option.id}
                        name={groupId}
                        checked={isAdSelected(groupId, option.duration)}
                        onChange={() => {}}
                        hidden
                      />
                      <label htmlFor={option.id}>
                        <span className="duration">{option.duration} </span>
                        {option.discount && <span className="discount-badge">{option.discount} </span>}
                        <span className="price"> &nbsp;&nbsp;${option.price}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="payment-section">
              <h2><i className="icon-payment"></i> Payment</h2>
              
              <SignedOut>
                <div className="auth-prompt">
                  <p>Please <SignInButton mode="modal" className="login-button">sign in</SignInButton> to complete your purchase.</p>
                </div>
              </SignedOut>

              <SignedIn>
                <div className="order-summary">
                  <h3>Order Summary</h3>
                  <div className="order-items">
                    {Object.entries(selectedAds).map(([groupId, ad]) => (
                      <div className="order-item" key={groupId}>
                        <span>{adGroups[groupId].name} ({ad.duration})</span>
                        <span>${ad.price}</span>
                      </div>
                    ))}
                    <div className="order-total">
                      <span>Total</span>
                      <span>${calculateTotal()}</span>
                    </div>
                  </div>
                </div>

                <div className="paypal-container">
                  <h4>Pay with PayPal</h4>
                  <p className="paypal-description">Safe and secure payments</p>
                  
                  <PayPalScriptProvider 
                    options={{ 
                      "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
                      "currency": "USD",
                      "intent": "capture",
                      "components": "buttons",
                      "disable-funding": "credit,card"
                    }}
                    onError={() => setPaypalError(true)}
                    onLoad={() => setPaypalLoaded(true)}
                  >
                    {paypalError ? (
                      <div className="paypal-error">
                        Failed to load PayPal. Please refresh the page or try another payment method.
                      </div>
                    ) : paypalLoaded ? (
                      <PayPalButtons
                        style={{ 
                          layout: "vertical",
                          color: "blue",
                          shape: "rect",
                          label: "paypal",
                          height: 48,
                          tagline: false
                        }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                        onCancel={onCancel}
                        disabled={Object.keys(selectedAds).length === 0}
                        forceReRender={[selectedAds]}
                      />
                    ) : (
                      <div className="paypal-loading">
                        Loading PayPal...
                      </div>
                    )}
                  </PayPalScriptProvider>
                  
                  <div className="payment-divider">
                    <span>OR</span>
                  </div>
                </div>

                <div className="credit-card-section">
                  <h4>Pay with Credit/Debit Card</h4>
                  <div className="form-control">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      {...register("cardNumber", { 
                        required: "Card number is required",
                        pattern: {
                          value: /^[0-9]{16}$/,
                          message: "Invalid card number"
                        }
                      })}
                      placeholder="1234 5678 9012 3456"
                    />
                    {errors.cardNumber && <span className="error">{errors.cardNumber.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-control">
                      <label htmlFor="expiry">Expiry Date</label>
                      <input
                        type="text"
                        id="expiry"
                        {...register("expiry", { 
                          required: "Expiry date is required",
                          pattern: {
                            value: /^(0[1-9]|1[0-2])\/?([0-9]{2})$/,
                            message: "MM/YY format required"
                          }
                        })}
                        placeholder="MM/YY"
                      />
                      {errors.expiry && <span className="error">{errors.expiry.message}</span>}
                    </div>

                    <div className="form-control">
                      <label htmlFor="cvc">CVC</label>
                      <input
                        type="text"
                        id="cvc"
                        {...register("cvc", { 
                          required: "CVC is required",
                          pattern: {
                            value: /^[0-9]{3,4}$/,
                            message: "Invalid CVC"
                          }
                        })}
                        placeholder="123"
                      />
                      {errors.cvc && <span className="error">{errors.cvc.message}</span>}
                    </div>
                  </div>

                  <div className="form-control">
                    <label htmlFor="name">Name on Card</label>
                    <input
                      type="text"
                      id="name"
                      {...register("name", { 
                        required: "Name is required",
                        minLength: {
                          value: 2,
                          message: "Name must be at least 2 characters"
                        }
                      })}
                      placeholder="John Smith"
                    />
                    {errors.name && <span className="error">{errors.name.message}</span>}
                  </div>
                </div>

                <div className="submit-section">
                  <button
                    type="submit"
                    className="payment-button"
                    disabled={isProcessing || Object.keys(selectedAds).length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <span className="spinner"></span> Processing...
                      </>
                    ) : (
                      "Complete Payment"
                    )}
                  </button>
                  {paymentError && (
                    <div className="payment-error">
                      <i className="icon-error"></i> {paymentError}
                    </div>
                  )}
                </div>
              </SignedIn>
            </div>
          </form>
        </div>

        <div className="ads-column">
          <h2 className="examples-title">Advertising Placement Examples</h2>
          <p className="examples-description">
            See how your ads could appear on our platform. Click on each example to view details.
          </p>

          <div className="ad-examples-grid">
            {adExamples.map((ad) => (
              <div 
                className={`ad-example-card ${ad.type} ${activeAdExample === ad.id ? 'expanded' : ''}`}
                key={ad.id}
                onClick={() => handleAdExampleClick(ad.id)}
              >
                <div className="ad-example-header">
                  <h3>{ad.title}</h3>
                  <i className={`icon-${ad.type}`}></i>
                </div>
                <div className="ad-example-preview">
                  {ad.title} Preview Area
                </div>
                <div className="ad-example-details">
                  <p>{ad.description}</p>
                  <div className="ad-specs">
                    <div className="spec">
                      <span className="spec-label">Dimensions:</span>
                      <span className="spec-value">{ad.dimensions}</span>
                    </div>
                    <div className="spec">
                      <span className="spec-label">Impressions:</span>
                      <span className="spec-value">{ad.impressions}</span>
                    </div>
                  </div>
                  {activeAdExample === ad.id && (
                    <div className="ad-benefits">
                      <h4>Benefits:</h4>
                      <ul>
                        <li>Premium visibility on all devices</li>
                        <li>Detailed performance analytics</li>
                        <li>Dedicated account manager</li>
                        {ad.type === 'featured' && <li>Exclusive placement</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="advertising-info">
            <h3>Why Advertise With Us?</h3>
            <div className="info-cards">
              <div className="info-card">
                <i className="icon-audience"></i>
                <h4>Targeted Audience</h4>
                <p>Reach energy-conscious consumers actively looking for solutions</p>
              </div>
              <div className="info-card">
                <i className="icon-analytics"></i>
                <h4>Detailed Analytics</h4>
                <p>Comprehensive reporting on impressions, clicks, and conversions</p>
              </div>
              <div className="info-card">
                <i className="icon-support"></i>
                <h4>Dedicated Support</h4>
                <p>Our team will help optimize your campaigns for best results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}