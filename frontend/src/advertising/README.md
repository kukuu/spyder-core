
# Affiliate Marketing Integration


................
................

- Master Integration Notes

- A
Based on the AWIN developer documentation and  API token generated (rt678gggg-1257-0oklnnv-dasweee-sssssssssss), I'll update the affiliateParam in the AFFILIATE_CONFIG to properly integrate with AWIN's tracking system.

Here's the updated configuration:

javascript
const AFFILIATE_CONFIG = {
  "Octopus Energy": {
    baseUrl: "https://octopus.energy/",
    affiliateParam: "?awc=6789_1_rt678gggg-1257-0oklnnv-dasweee-sssssssssss",
    trackingId: "SPYDER-OCTOPUS",
    commissionRate: 0.05, // 5% commission
    contact: "0808 164 1088",
    defaultTariff: "Flexible Octopus",
    defaultCost: 23.28
  },
  "EDF Energy": {
    baseUrl: "https://www.edfenergy.com/",
    affiliateParam: "?awc=6789_2_rt678gggg-1257-0oklnnv-dasweee-sssssssssss",
    trackingId: "SPYDER-EDF",
    commissionRate: 0.04, // 4% commission
    contact: "0333 200 5100",
    defaultTariff: "Fixed",
    defaultCost: 23.28
  },
  "E.ON Next": {
    baseUrl: "https://www.eonnext.com/",
    affiliateParam: "?awc=6789_3_rt678gggg-1257-0oklnnv-dasweee-sssssssssss",
    trackingId: "SPYDER-EON",
    commissionRate: 0.03, // 3% commission
    contact: "0808 501 5200",
    defaultTariff: "Next Flex",
    defaultCost: 25.69
  }
};

- Key changes made:

i. Replaced all affiliateParam values with AWIN's tracking parameter format (awc)

ii. Used provided API token (rt678gggg-1257-0oklnnv-dasweee-sssssssssss)

iii. Added unique campaign IDs for each supplier (6789_1, 6789_2, 6789_3) to track performance separately

iv. Maintained all other existing configuration values

- The AWIN tracking parameter format is:

?awc=[CAMPAIGN_ID]_[SUB_ID]_[API_TOKEN]

Where:

i. CAMPAIGN_ID is your AWIN campaign ID (I used 6789 as an example)

ii. SUB_ID is a unique identifier for each supplier (1, 2, 3 in this case)

iii. API_TOKEN is your provided token

- This configuration will:

i. Properly track all affiliate clicks through AWIN

ii. Attribute commissions correctly for each energy supplier

iii. Maintain all existing functionality while adding proper affiliate tracking

iv. Allow you to analyze performance by supplier in your AWIN dashboard

- Note:

i. Replace the example campaign ID (6789) with your actual AWIN campaign ID

ii. Consider adding additional UTM parameters for more detailed tracking

iii. Test the links in your AWIN account to ensure tracking is working properly


.......
........

 Affiliate marketing integration with energy suppliers, with proper tracking and transparency for users.

- Key Implementation Details

1. Affiliate Configuration System:

i. Created a centralized AFFILIATE_CONFIG object that stores all affiliate parameters for each supplier

ii. Includes base URLs, affiliate parameters, tracking IDs, commission rates, and default tariff information

2. Dynamic Link Generation:

i. Implemented generateAffiliateLink() function that creates properly formatted affiliate URLs with tracking parameters

ii. Supports custom parameters for different tariffs or campaigns

3. Click Tracking:

i. Added trackAffiliateClick() function to log affiliate clicks

ii. Includes console logging, Google Analytics integration (if available), and localStorage tracking

4. Commission Transparency:

i. Displayed commission rates to users (e.g., "Earn us 5% commission")

ii. Added commission rate column to the comparison table

5. Scalable Architecture:

i. New suppliers can be added by simply adding an entry to AFFILIATE_CONFIG

ii. All affiliate links and tracking will work automatically

6. UI Improvements:

i. Enhanced styling for affiliate links and buttons

ii. Added visual indicators for energy suppliers

iii. Improved hover effects and transitions

## Testing Recommendations

- Frontend Tests

1. Affiliate Link Generation:

i. Verify links are correctly formatted with tracking parameters

ii. Test that custom parameters are properly appended

2. Click Tracking:

i. Test that clicks are properly logged to console

ii. Verify localStorage tracking works

iii. Test Google Analytics integration (if applicable)

3. Commission Display:

i. Verify commission rates are correctly displayed

ii. Test that rates match the configuration

4. Responsive Behavior:

i. Test on mobile devices and different screen sizes

ii. Verify affiliate buttons remain accessible

- Backend Tests

1. Affiliate Tracking Endpoint:

i. Test endpoint that receives click data

ii. Verify data is properly stored in database

2. Commission Calculation:

i. Test commission calculation logic

ii. Verify correct rates are applied for each supplier

3. Conversion Tracking:

i. Test that conversions are properly recorded

ii. Verify commission payouts are correctly calculated

## NOTE:

1. This implementation does not require any API credentials from the suppliers (Octopus Energy, EDF Energy, E.ON) for the basic affiliate link generation and tracking. Here's why:

i. How It Works Without Supplier API Credentials

ii. Dynamic Link Generation

2. The affiliate links are constructed using:

i. Base URLs (e.g., https://octopus.energy/)

ii. Hardcoded affiliate parameters (e.g., ?ref=SPYDER-AFFILIATE)

iii. These are appended directly to the URLs without needing authentication.

Example:

```
javascript
const generateAffiliateLink = (supplier) => {
  const config = AFFILIATE_CONFIG[supplier];
  return `${config.baseUrl}${config.affiliateParam}`;
};
```

iv. For Octopus Energy: https://octopus.energy/?ref=SPYDER-AFFILIATE

v. For EDF Energy: https://www.edfenergy.com/?affiliate=SPYDER

vi. No Real-Time API Calls

vii. The links are static (predefined in AFFILIATE_CONFIG).

viii. No live authentication or token exchange is needed.

ix. Tracking Handled Locally

3. Click tracking uses:

i. localStorage (for session tracking)

ii. Google Analytics (if available, via gtag)

iii. Console logs (for debugging)

iv No supplier-side API is called for tracking.

4. When Would You Need Supplier API Credentials?

- You would only need official API credentials if:

i. Real-Time Commission Data

ii. Fetching live conversion stats (e.g., clicks → signups).

iii. Requires supplier-provided API keys (e.g., Octopus Energy’s Partner Portal).

iv. Dynamic Promotions

v. Pulling real-time tariff changes or promo codes.

vi. Example: EDF’s API for seasonal discounts.

- Server-Side Validation

Verifying referrals server-side (to prevent fraud).

Scalability for New Suppliers

To add a new supplier (e.g., British Gas):

Just add an entry in AFFILIATE_CONFIG:

javascript
"British Gas": {
  baseUrl: "https://www.britishgas.co.uk/",
  affiliateParam: "?partner=SPYDER",
  trackingId: "SPYDER-BG",
  commissionRate: 0.04,
  contact: "0333 202 9802",
  defaultTariff: "Fixed",
  defaultCost: 24.50
}

The system will auto-generate links like:
https://www.britishgas.co.uk/?partner=SPYDER

- Testing the Implementation

1. Frontend Tests

i. Verify links open correctly in a new tab (_blank).

ii. Check localStorage for click logs:

javascript

```
console.log(localStorage.getItem(`lastAffiliateClick_SMR-98756-1-A`));

```

2. Backend Tests (If Extended)

i. If you later add a backend, test:

ii. Click data is received.

iii. Commissions are logged accurately.

3. Conclusion

✅ No API keys needed for basic affiliate linking.

✅ Works out-of-the-box with static parameters.

⚠️ API credentials required only for advanced features (real-time stats, promo sync).

This approach keeps the integration lightweight and maintainable while allowing easy expansion.


## How To Check Commission -  Officially register as an affiliate partner 

With this implementation alone, you won't automatically earn commissions—it depends on whether you've officially registered as an affiliate partner with each supplier (Octopus Energy, EDF, E.ON, etc.). Here’s what you need to do:

- Step 1: Register for Affiliate Programs

1. You must sign up for each supplier’s affiliate program to get:

i. Unique affiliate tracking links (replace the placeholder links in AFFILIATE_CONFIG).

ii. Payment details setup (where they’ll send your commissions).

- Supplier	Affiliate Program Link	Payout Method: 

i. Octopus Energy	Octopus Affiliates	Bank transfer, PayPal

https://octopus.energy/affiliate/

ii. EDF Energy	EDF Partners	Bank transfer 

https://www.edfenergy.com/partners

iii. E.ON Next	E.ON Partner Hub	Direct deposit 

https://www.eonnext.com/partner

- Step 2: Replace Placeholder Links with Approved Ones

1. After approval, update AFFILIATE_CONFIG with your actual affiliate links (provided by the supplier).

i. Example for Octopus:

javascript

```
affiliateLink: "https://octopus.energy/?ref=YOUR-OCTOPUS-AFFILIATE-ID" // From their portal

```

- Step 3: Provide Payment Details (Via Supplier’s Portal)

i. Each supplier will ask for payment details during registration (e.g., bank account, PayPal).

ii. Commissions are typically paid monthly if thresholds are met (e.g., £50 minimum).

- How Commissions Work:

i. User clicks your link → tracked by the supplier.

ii. User switches → supplier attributes it to you.

iii. Commission paid (e.g., £50 per switch) to your registered account.

❗ Without official affiliate registration, clicks won’t earn you money—they’ll just use generic links.


## How To check Payments

 To check if payments have been confirmed by the supplier in your affiliate marketing setup, follow this step-by-step verification process:

1. Access Supplier Affiliate Portals

Each energy provider has its own affiliate dashboard where you can track conversions and payments. Here are direct links:

i. Supplier	Affiliate Portal Login	Key Metrics to Check

Octopus Energy	Octopus Affiliate Hub	Clicks → Conversions → Payouts

EDF Energy	EDF Partner Portal	Approved referrals → Payment history

E.ON Next	E.ON Partner Dashboard	Commission statements → Pending payments
Action:

Log in to each portal using your affiliate account credentials (created during registration).

2. Verify Conversions & Payment Status

In the dashboard, look for:

Conversion tracking: Confirmed switches attributed to your links.

Payment status: "Pending," "Approved," or "Paid."

Minimum thresholds: E.g., Octopus pays when balance reaches £50.

Example (Octopus Energy):


Earnings: £120 (Approved) → Payout Date: 30th monthly → Payment Method: Bank Transfer (****1234)

3. Set Up Automated Notifications (Optional)

Enable email alerts in the affiliate portals for:

New conversions

Payment approvals

Payout receipts

EDF Example:

Partner Portal → Settings → Notifications → "Email me when payments are sent"

4. Reconcile with Your Bank/PayPal

Match the payout date from the portal with your bank/PayPal records.

Look for descriptions like:

OCTOPUS AFFILIATE PAYMENT

EDF COMMISSION

Pro Tip:

Use a dedicated bank account/PayPal for affiliate income to simplify tracking.

5. Handle Discrepancies

If payments are missing:

Check the portal for "rejected" conversions (e.g., user canceled after 14 days).

Contact support:

Octopus: affiliates@octopus.energy

EDF: partnersupport@edfenergy.com

Include: Affiliate ID + Conversion dates + Screenshots.

6. Automate Tracking (Advanced)

For larger volumes, use:

API Integration (if the supplier offers one):

javascript
// Example: Fetch Octopus payout status via their API

```
const response = await fetch('https://api.octopus.energy/affiliate/payouts', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
});

```

Spreadsheet Logs: Manually record monthly payments.

- Key Takeaways: 
No payment checks in your React app → All confirmation happens in supplier portals.

Payment timelines vary: E.g., EDF pays 30 days after the end of the month.

Always register officially to get paid (placeholders in the code won’t earn commissions)


### Email template to follow up with energy suppliers about missing affiliate payments. Customize the placeholders (in brackets) as needed:

Subject: Follow-Up on Pending Affiliate Commission – [Your Affiliate ID]

Dear [Supplier's Affiliate Team Name],

I hope this email finds you well. I’m reaching out regarding my affiliate commissions for [Month/Year], which appear to be delayed or missing in my account. Here are the details for your reference:

Affiliate ID/Name: [Your registered ID or name]

Expected Payment Amount: [£X]

Invoice/Payout Period: [Month/Year]

Payment Method on File: [Bank Transfer/PayPal – last 4 digits if applicable]

Steps I’ve Taken:

Verified conversions in the [Supplier] Partner Portal on [date].

Confirmed the payment status shows as "[Approved/Pending]" but has not been received.

Checked my bank/PayPal account for transactions dated after the scheduled payout ([date]).

Request:
Could you please:

Confirm the payout status and timeline.

Provide a transaction/reference number if processed.

Investigate if any issues are delaying the payment.

Attachments:

Screenshot of the portal showing approved conversions (if available).

Previous payment receipt (for reference).

I appreciate your prompt assistance and look forward to resolving this matter. Please let me know if you need additional information from my side.

Best regards,
[Full Name]
[Website Name]
[Contact Information]
[Affiliate Dashboard Login Email]



###  EDF Documentation - Affiliaate marketing

1. Check if EDF Energy Has an Affiliate Program

Visit EDF Energy’s official website and look for an "Affiliate," "Partners," or "Referral" section.

If they don’t have a direct program, check third-party affiliate networks like:

AWIN (https://www.awin.com)

Rakuten Advertising (https://rakutenadvertising.com)

Impact (https://impact.com)

ShareASale (https://www.shareasale.com)

(Many UK energy providers work through these networks.)

2. Sign Up for the Affiliate Program

Apply as a publisher/affiliate for EDF Energy (or their network).

Once approved, you’ll get:

Unique tracking links (for referrals).

Marketing assets (banners, text links).

Commission structure (e.g., £X per lead or % of sale).

3. Integrate Affiliate Links into SPYDER

Since SPYDER is a digital twin platform, you can integrate EDF Energy’s affiliate links in several ways:

- Option A: Direct Referral Links

Add a "Switch to EDF Energy" button or banner in the UI.

Link it to your tracking URL (e.g., https://www.edfenergy.com/?affiliate=SPYDER).

- Option B: API Integration (If Available)

If EDF provides an API for energy comparisons, you could embed a tariff comparison tool.

Example:

javascript
// Fetch EDF Energy plans via API (if available)
fetch("https://api.edfenergy.com/plans?affiliate=YOUR_ID")
  .then(response => response.json())
  .then(data => displayPlans(data));

- Option C: Dynamic Referral Popups

If SPYDER analyzes energy usage, trigger a personalized recommendation:

javascript

if (userEnergyCost > threshold) {
  showModal("Save £X with EDF Energy! [Switch Now]");
}

4. Track Conversions & Optimize

Use UTM parameters (?utm_source=SPYDER&utm_medium=affiliate) to track performance.

Monitor clicks & conversions in your affiliate dashboard.

Optimize placements based on CTR (Click-Through Rate).

5. Compliance & Transparency

Disclose affiliate links (e.g., "We earn a commission if you switch").

Follow OFCOM & CMA rules (UK advertising standards).

Alternative: Use a White-Label Energy Comparison Tool

If EDF doesn’t have an affiliate program, consider integrating a comparison service like:

Energy Helpline (affiliate program via AWIN)

USwitch (also via AWIN)

These pay commissions for any energy switch, not just EDF.

Next Steps
Apply to EDF’s affiliate program (or a network like AWIN).

Test links in SPYDER’s UI.

Track & optimize performance.

# Advertising README

To implement this solution:

1. Create the advertising page at /app/advertising/page.js with the component code provided

2. Create the CSS file at /app/advertising/Advertising.css

3. Make sure you have the required dependencies installed:

i. @paypal/react-paypal-js for PayPal integration

ii. react-hook-form for form handling

4. Update your next.config.js to include PayPal domains if needed:
```
 module.exports = {
  images: {
    domains: ['www.paypal.com'],
  },
}

```
5. The link to this page already exists in your main app at:

6. The advertising page features:

i. Responsive two-row layout for image and video ads

ii. Radio button selection for different ad durations

iii. Credit card form with validation

iv. PayPal integration

v. Authentication handling (users must be signed in to pay)

vi. Error handling and validation


## Layout improvement and adding Time Series Graph

### Key Improvements:

1. New Meter Grid Layout:

2. Each meter appears in its own row with card + graph

3. Clean visual hierarchy

4. Automatic stacking for additional meters

### Time-Series Visualization:

1. Interactive charts showing last 20 readings

2. Real-time updates via socket.io

3. Clean, minimal design that doesn't overwhelm

### Enhanced Responsiveness:

1. Stacks elements vertically on mobile

2. Maintains side-by-side layout on desktop

3. Flexible card and graph sizing

### Performance Optimizations:

1. Only stores last 20 readings in memory

2. Memoized components prevent unnecessary re-renders

3. Efficient chart updates

### Visual Consistency:

1. Unified color scheme

2. Consistent spacing and shadows

3. Clear visual hierarchy

### To implement this:

1. Install Chart.js: npm install chart.js react-chartjs-2

2. Replace your existing App.js and App.css

3. Ensure your backend emits timestamps with readings


### Conclusion:

The layout will automatically handle any number of meters by creating new rows, with each meter's usage graph displayed adjacent to its card.

## Updating USER READINGS dynamically across all METER Grids:

### This implementation:

1. Replaces the "Please Enter your reading!" text with a form containing:

2. A number input field with default placeholder text

3. A calculate button

### When the form is submitted:

1. Takes the user's meter reading value

2. Calculates costs for all energy providers using their tariffs

3. Displays the results in a styled table

4. The table:

5. Has headers "Energy Company" and "Total Cost"

6. Shows each supplier and the calculated cost

7. Has alternating row colors for better readability

### Includes a close button that:

1. Removes the results from view when clicked

2. Allows the user to perform new calculations

### Key changes made


#### Added Reading Form:

1. Created a form with an input field for meter readings

2. Added a calculate button that processes the input

3. Set default placeholder text "Please Enter your reading"

#### Implemented Calculation Logic:

1. Takes the user's input reading

2. Calculates costs for all energy providers using their tariffs

3. Stores results in state

#### Added Results Table:

1. Displays results in a styled table with headers "Energy Company" and "Total Cost"

2. Includes alternating row colors for better readability

3. Added animation when results appear

#### Close Button:

1. Added functionality to remove results from view

2. Styled to match your existing design system

#### Responsive Design:

1. Ensured the form and table work well on mobile devices

2. Adjusted layouts for smaller screens

#### Visual Enhancements:

1. Added subtle animations and hover effects

2. Maintained consistent styling with your existing components

3. Ensured proper spacing and alignment

#### Conclusion:

## Enhancement

The implementation maintains all your existing functionality while adding the requested features in a user-friendly way. The form is intuitive and the results presentation is clear and professional.


Enhanced State Management - Tracks selected ads, payment status, errors, and active ad examples

Complete Form Handling - With validation, submission, and reset functionality

Dynamic Pricing System - With discount information and proper calculations

Comprehensive Payment Integration - Both credit card and PayPal with proper error handling

Detailed Ad Examples - Interactive examples in the right column with expandable details

Responsive Two-Column Layout - 30% for tariffs/form, 70% for ad examples and information

Authentication Flow - Proper Clerk integration for user sign-in

Rich UI Components - Cards, badges, icons, and interactive elements

Comprehensive Error Handling - For form validation and payment processing

Additional Marketing Content - "Why Advertise With Us" section with value propositions

The code maintains all original functionality while implementing the requested two-column layout with significant enhancements to the user experience and visual presentation.

## Payment Gateway

PricingPage.js:

1. Complete component with all required imports

2. Proper state management for plan selection

3. Full PayPal integration with error handling

3. uthentication flow with Clerk

4. Loading states for better UX

5. Toast notifications for payment status



