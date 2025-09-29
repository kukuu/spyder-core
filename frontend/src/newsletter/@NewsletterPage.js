import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import "./Newsletter.css";
import "../App.css";
import { ToastContainer, toast } from "react-toastify";

export default function NewsletterPage() {
  const [selectedImageAd, setSelectedImageAd] = useState("");
  const [selectedVideoAd, setSelectedVideoAd] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Configuration - change this email to receive submissions
  const RECIPIENT_EMAIL = "alex@azzotto.com";
  
  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    console.log(`This would be sent to: ${RECIPIENT_EMAIL}`);
    
    // Show success toast
    toast.success("Thank you for subscribing to our newsletter!");
    
    // In a real implementation, you would send this data to your backend
    // which would then handle the email distribution
  };

  // Ad content data
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
      {/* Navigation */}
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
        <h1>Newsletter</h1>
      </div>
      <div className="main-content">
        <div className="newsletter-hero">
          <h2>Stay Informed on Energy Tariffs</h2>
          <p>Join our newsletter to receive the latest updates on energy prices, market trends, and money-saving tips directly to your inbox.</p>
        </div>
        
        <div className="newsletter-content">
          <div className="editorial-content">
            <div className="editorial-left">
              <h3>Ads</h3>
              <p className="join-campaign"><a href="/pricing">How do I join the campaign?</a></p>


              <div className="ad-space">
                <h4>Sponsored Articles</h4>
                <ul>
                <li><a href="#">Race to Net Zero</a> </li>
                {/*<li><a href="#">aaaaa</a> </li>
                <li><a href="#">bbbbb</a></li>*/}
                </ul>
              </div>
              
              
              <div className="ad-space">
                <h4>Sponsored Links</h4>
                <ul>
                <li><a href="https://www.neso.energy/"><small>NESO</small></a> </li>
                <li><a href="https://www.lowcarboncontracts.uk/">Low Carbon Contracts</a> </li>
               {/* <li><a href="https://wersel.io/">Wersel CoMind</a> </li>
                <li><a href="https://www.lovejoint.store/">Love Joint</a></li>
                  <li>Link 3</li>
                  <li>Link 4</li>*/}
                </ul>
              </div>

              

              <div className="ad-space"><br />
                {/*<h4>Premium Newsletter Spot</h4>*/}
                <h4>Clean Energy</h4>
                <div>
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
                      <p>How we're powering tomorrow's world today</p>
                </div>

              </div>
              <div className="ad-space">
                <h4>Sponsored Content</h4>
                <p>Native-style sponsored articles within our newsletter</p>
              </div>
              <div className="ad-space">
                <h5 className="available-space">SPACE AVAILABLE</h5>
                {/*<h4>Featured Product</h4>
                <p>Available:Showcase your product to our engaged audience</p>*/}
              </div>
              
             {/* <div className="ad-space"><br />
                <h4>Clean Energy</h4>
                <div>
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
                      <p>How we're powering tomorrow's world today</p>
                </div>

              </div>
              
              <div className="ad-space">
                <h5 className="available-space">SPACE AVAILABLE</h5>
                {/*<h4>Featured Product</h4>
                <p>Available:Showcase your product to our engaged audience</p>
              </div>*/}

              
            </div>
            
            <div className="editorial-right">
              <h3>Why Subscribe to Our Newsletter?</h3>
              <p>Our newsletter transforms how you engage with the energy market, providing exclusive insights and opportunities not available to regular visitors.</p>
              
              <div className="inline-signup-form">
                <h4>Subscribe to Our Newsletter</h4>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        {...register("name", { required: "Name is required" })}
                      />
                      {errors.name && <span className="error">{errors.name.message}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input 
                        type="email" 
                        id="email" 
                        {...register("email", { 
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                      />
                      {errors.email && <span className="error">{errors.email.message}</span>}
                    </div>
                  </div>
                  
                  <div className="consent-checkbox">
                    <input 
                      type="checkbox" 
                      id="consent" 
                      {...register("consent", { 
                        required: "You must agree to receive emails" 
                      })}
                    />
                    <label htmlFor="consent">
                      I agree to receive newsletter emails containing news, updates, and promotional offers. 
                      I understand I can unsubscribe at any time.
                    </label>
                    {errors.consent && <span className="error">{errors.consent.message}</span>}
                  </div>
                  
                  <button type="submit" className="submit-btn">Subscribe Now</button>
                </form>
                
                <div className="privacy-note">
                  <p>We respect your privacy and will never share your information with third parties. You can unsubscribe at any time.</p>
                </div>
              </div>
              
              <h4>Ads</h4> 
              <p className="join-campaign"><a href="/pricing">How do I join the campaign?</a></p>
              <div className="ad-models">
                <div className="featured-grid">
                  {rightColumnAds.map(ad => (
                    <div key={ad.id} className="featured-card">
                      <div className="featured-header">
                        <span className="featured-title">{ad.title}</span>
                      </div>
                      <div className="featured-content">
                        <div className="ad-placeholder">
                          <span>Available</span>
                        </div>
                      </div>
                      <div className="featured-footer">
                        <p className="featured-description">{ad.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="newsletter-ad">
                <h4>Special Offer for Newsletter Subscribers</h4>
                <p>Subscribe today and get our exclusive guide "5 Energy Saving Secrets That Could Cut Your Bills by 20%" absolutely free!</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="newsletter-features">
          <h3>What You'll Receive</h3>
          <div className="features-grid">
            <div className="feature">
              <h4>Weekly Market Updates</h4>
              <p>Stay informed about the latest energy price fluctuations and market trends.</p>
            </div>
            <div className="feature">
              <h4>Exclusive Deals</h4>
              <p>Get access to special offers and promotions not available to the general public.</p>
            </div>
            <div className="feature">
              <h4>Energy Saving Tips</h4>
              <p>Learn practical ways to reduce your energy consumption and save money.</p>
            </div>
            <div className="feature">
              <h4>Industry Insights</h4>
              <p>Gain valuable knowledge about the energy sector and future developments.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}