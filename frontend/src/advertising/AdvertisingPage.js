import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import "./Advertising.css";
import "../App.css";
import { ToastContainer, toast } from "react-toastify";

export default function AdvertisingPage() {
  // State management
  const [selectedImageAd, setSelectedImageAd] = useState("");
  const [selectedVideoAd, setSelectedVideoAd] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAdExample, setActiveAdExample] = useState(null);

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  // Ad content data
  const leftColumnAds = [
    {
      id: 1,
      title: "Premium Banner",
      type: "banner",
      description: "Top placement with maximum visibility for brand awareness campaigns (50 chars)"
    },
    {
      id: 2,
      title: "Sidebar Ad",
      type: "sidebar",
      description: "Persistent visibility on all pages for targeted promotions (50 chars)"
    },
    {
      id: 3,
      title: "In-Content Ad",
      type: "content",
      description: "Native-style ads within content for higher engagement (50 chars)"
    },
    {
      id: 4,
      title: "Sponsored Link",
      type: "link",
      description: "Text-based ads with direct click-through to your site (50 chars)"
    }
  ];

  const rightColumnAds = [
    {
      id: 1,
      title: "Featured Video",
      type: "video",
      description: "This premium placement offers maximum visibility with our featured video spot. Your content will be prominently displayed in our main content area, reaching thousands of engaged users daily. Perfect for product launches or high-impact campaigns."
    },
    {
      id: 2,
      title: "Product Showcase",
      type: "image",
      description: "Showcase your products with large, high-quality images. This format is perfect for e-commerce businesses looking to highlight product details and drive direct sales."
    },
    {
      id: 3,
      title: "Interactive Ad",
      type: "interactive",
      description: "Engage users with rich interactive content. These ads allow for user interaction directly within the ad unit, providing higher engagement and better conversion rates."
    },
    {
      id: 4,
      title: "Brand Story",
      type: "story",
      description: "Tell your brand story with our immersive full-width ad format. Combine images, text and video to create an engaging narrative about your company or products."
    }
  ];

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

      <div className="advertising-header">
        <h1>Advertising Opportunities</h1>
      </div>
      <div className="main-content">
        <p className="header-description">
          Promote your business on our platform to reach thousands of energy-conscious consumers.
          The <strong>SPYDER</strong> Digital Twin Smart Energy Meter Reader helps users find the
          best electricity meters at competitive prices.
        </p>
        
        <div className="AdvertisingContent">
          {/* Left Column (20%) */}
          <div className="left-column">
            <div className="media-grid">
              {leftColumnAds.map(ad => (
                <div key={ad.id} className="media-card">
                  <div className="media-header">
                    <span className="media-title">{ad.title}</span>
                  </div>
                  <div className="media-content">
                    <iframe
                      src=""
                      title={ad.title}
                      alt={ad.title}
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="media-footer">
                    <p className="ad-description">{ad.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Column (80%) */}
          <div className="right-column">
            <div className="featured-grid">
              {rightColumnAds.map(ad => (
                <div key={ad.id} className="featured-card">
                  <div className="featured-header">
                    <span className="featured-title">{ad.title}</span>
                  </div>
                  <div className="featured-content">
                    <iframe
                      src=""
                      title={ad.title}
                      alt={ad.title}
                      frameBorder="0"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="featured-footer">
                    <p className="featured-description">{ad.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}