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
              <div className="ad-space">
                <h4>Premium Newsletter Spot</h4>
                <p>Top placement in our newsletter with maximum visibility for your brand</p>
              </div>
              <div className="ad-space">
                <h4>Sponsored Content</h4>
                <p>Native-style sponsored articles within our newsletter</p>
              </div>
              <div className="ad-space">
                <h4>Featured Product</h4>
                <p>Showcase your product to our engaged audience</p>
              </div>
              <div className="ad-space">
                <h4>Exclusive Offer</h4>
                <p>Promote special deals to our subscribers</p>
              </div>
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
              
              <h4>1. It Creates an "Owned" Audience (The Biggest Value Add)</h4>
              <p>Before: 100% of your traffic is dependent on Google's algorithm. A core update can wipe out your business. This is a major risk a buyer factors in, lowering the multiple they are willing to pay (e.g., 30x-35x profit).</p>
              <p>After: A newsletter is a direct line to your audience. You own the list. This de-risks the business from search engine volatility. A de-risked asset commands a much higher multiple (e.g., 38x-45x+ profit).</p>
              
              <h4>2. It Unlocks New, High-Value Revenue Streams</h4>
              <p><strong>Direct Newsletter Advertising:</strong> You can sell dedicated sponsor spots in your newsletter. This is premium, high-conversion inventory because it's going to a warm, engaged audience. You can charge a significant premium over standard web ads, easily adding hundreds or thousands of pounds in MRR.</p>
              <p><strong>Promoting Your Own Advertisers:</strong> You can use the newsletter to actively promote the energy consultants on your pricing page, delivering even more value to them and justifying higher monthly fees or premium packages.</p>
              
              <h4>3. It Supercharges Traffic and Lead Generation</h4>
              <p><strong>Recirculation:</strong> Every time you publish a new article, you can email it to your list. This guarantees an immediate spike in traffic, helping new content get indexed and ranked faster. This creates a virtuous cycle: content brings email sign-ups → emails bring traffic → traffic creates more sign-ups.</p>
              <p><strong>Higher Conversion Rates:</strong> Newsletter subscribers are a warm, qualified audience. They trust you. Therefore, they are far more likely to click on your links and use your comparison services than a random visitor from Google. This increases the value of every advertiser spot on your site.</p>
              
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