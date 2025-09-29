import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import AdvertisingPage from "./advertising/AdvertisingPage"; // Add this import
import NewsletterPage from "./newsletter/NewsletterPage"; // Add this import
import PricingPage from "./pricing/PricingPage"; // Add this import

import { ClerkProvider } from "@clerk/clerk-react";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Add Routes and Route

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key - Add it to .env file");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/advertising" element={<AdvertisingPage />} />
          <Route path="/newsletter" element={<NewsletterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Routes>
      </ClerkProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();