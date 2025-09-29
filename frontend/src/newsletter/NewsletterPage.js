import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Card, 
  CardContent,
  useTheme,
  useMediaQuery 
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import "./Newsletter.css";
import "../App.css";
import { ToastContainer, toast } from "react-toastify";

export default function NewsletterPage() {
  const [selectedImageAd, setSelectedImageAd] = useState("");
  const [selectedVideoAd, setSelectedVideoAd] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState('');
  const [llmResponse, setLlmResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [meterData, setMeterData] = useState([]);
  const [maxRecords] = useState(20);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Configuration - change this email to receive submissions
  const RECIPIENT_EMAIL = "alex@azzotto.com";
  
  // Fetch meter data for visualization
  useEffect(() => {
    fetchMeterData();
    const interval = setInterval(fetchMeterData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Add this function for sample data
  const generateSampleData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 10; i++) {
      const time = new Date(now.getTime() - (10 - i) * 60000); // Last 10 minutes
      data.push({
        time: time.toLocaleTimeString(),
        meter_1: Math.random() * 100 + 50,
        meter_2: Math.random() * 100 + 60,
        meter_3: Math.random() * 100 + 70
      });
    }
    return data;
  };

  const fetchMeterData = async () => {
    try {
      const { data, error } = await supabase
        .from('readings')
        .select('*')
        .order('timestamp', { ascending: true }) // Changed to ascending for proper timeline
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        console.log('Fetched meter data:', data); // Debug log
        const processedData = processMeterData(data);
        setMeterData(processedData);
      } else {
        console.log('No meter data found');
        // Set some sample data for testing
        setMeterData(generateSampleData());
      }
    } catch (error) {
      console.error('Error fetching meter data:', error);
      // Set sample data on error for demonstration
      setMeterData(generateSampleData());
    }
  };

  const processMeterData = (data) => {
    // Group data by timestamp and meter
    const timeGroups = {};
    
    data.forEach(reading => {
      const timestamp = new Date(reading.timestamp).toLocaleTimeString();
      if (!timeGroups[timestamp]) {
        timeGroups[timestamp] = { time: timestamp };
      }
      timeGroups[timestamp][`meter_${reading.meter_id}`] = reading.reading;
    });

    return Object.values(timeGroups);
  };

  const onSubmit = (data) => {
    console.log("Form submitted:", data);
    console.log(`This would be sent to: ${RECIPIENT_EMAIL}`);
    
    // Show success toast
    toast.success("Thank you for subscribing to our newsletter!");
    
    // In a real implementation, you would send this data to your backend
    // which would then handle the email distribution
  };

  const handleAskJim = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setLlmResponse('');

    try {
      // First, check if backend is available - CHANGED TO PORT 3001
      try {
        const healthCheck = await fetch('http://localhost:3001/health', {
          method: 'GET',
        });
        
        if (!healthCheck.ok) {
          throw new Error('Backend server is not available');
        }
      } catch (healthError) {
        throw new Error('Backend server is not available. Please make sure the LLM service is running on port 3001.');
      }

      // Call LLM service - CHANGED TO PORT 3001
      const response = await fetch('http://localhost:3001/api/llm/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          maxRecords: maxRecords
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (response.ok) {
        setLlmResponse(result.answer);
        
        // Save to energy_analyses table
        await saveToEnergyAnalyses(question, result.answer);
      } else {
        setLlmResponse('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error calling LLM service:', error);
      // UPDATED ERROR MESSAGE TO PORT 3001
      setLlmResponse(`Failed to get response: ${error.message}. Please ensure the backend server is running on port 3001.`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToEnergyAnalyses = async (question, answer) => {
    try {
      // First, check if we need to delete old records
      const { count } = await supabase
        .from('energy_analyses')
        .select('*', { count: 'exact' });

      if (count >= maxRecords) {
        // Delete oldest records to maintain the limit
        const { data: oldRecords } = await supabase
          .from('energy_analyses')
          .select('id')
          .order('created_at', { ascending: true })
          .limit(count - maxRecords + 1);

        const idsToDelete = oldRecords.map(record => record.id);
        await supabase
          .from('energy_analyses')
          .delete()
          .in('id', idsToDelete);
      }

      // Get the most recent meter_id from readings
      const { data: recentReading } = await supabase
        .from('readings')
        .select('meter_id')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      const meterId = recentReading ? recentReading.meter_id : 1;

      // Insert new record
      const { error } = await supabase
        .from('energy_analyses')
        .insert([
          {
            meter_id: meterId,
            questions: question,
            response: answer,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving to energy_analyses:', error);
    }
  };

  // Ad content data
  const rightColumnAds = [
    {
      id: 1,
      title: "Home Battery Systems",
      type: "video",
      description: "Store excess energy with our compact, high-capacity home batteries and accessories.",
      media:"https://goods-vod-eu.kwcdn.com/local-goods-vod/f17793572598e526aef7d74d7b03f277a1e56ea6.f30.mp4"
    },
    {
      id: 2,
      title: "Next-Gen Solar Panels",
      type: "image",
      description: "40% more efficient than conventional panels with our patented nano-coating technology",
      media:"https://goods-vod.kwcdn.com/goods-video/991226355a5aed619dd7b4e8c443e418184d438b.f30.mp4"
    },
    {
      id: 3,
      title: "Interactive Ad Space Available",
      type: "interactive",
      description: "Engage users with rich interactive content. These ads allow for user interaction directly within the ad unit, providing higher engagement and better conversion rates.",
       media:""
    },
    {
      id: 4,
      title: "Brand Story Ad Space Available",
      type: "story",
      description: "Tell your brand story with our immersive full-width ad format. Combine images, text and video to create an engaging narrative about your company or products.",
       media:""
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
      
      {/* Meter Visualizations - Added above the newsletter content */}
      <Container maxWidth="lg" className="meters-container">
        <Box className="meters-section">
          <Typography variant="h4" gutterBottom className="section-title">
            Real-Time Energy Monitoring
          </Typography>
          
          <Grid container spacing={3} className="meters-grid">
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} className="meter-paper">
                <Typography variant="h6" gutterBottom className="meter-title">
                  Meter 1 Performance
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={meterData} className="meter-chart">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="meter_1" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} className="meter-paper">
                <Typography variant="h6" gutterBottom className="meter-title">
                  Meter 2 Performance
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={meterData} className="meter-chart">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="meter_2" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} className="meter-paper">
                <Typography variant="h6" gutterBottom className="meter-title">
                  Meter 3 Performance
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={meterData} className="meter-chart">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="meter_3" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* LLM Query Section */}
        <Card className="llm-section">
          <CardContent>
            <Typography variant="h5" gutterBottom className="llm-title">
              Ask <span className="ask-jim">Jim</span> - Energy Analytics AI
            </Typography>
            
            <Box className="key-features">
              <Typography variant="body2" color="text.secondary">
                Key Features Enabled:
              </Typography>
              <ul>
                <li>✅ Predictive Maintenance: LLM analyzes trends to flag anomalies</li>
                <li>✅ Natural Language Queries: Ask questions like "Show worst-performing meters this week"</li>
                <li>✅ Automated Reports: LangChain generates summaries from Supabase data</li>
                <li>✅ Simulation Scenarios: "What if meter load increases by 20%?"</li>
              </ul>
            </Box>

            <Grid container spacing={2} alignItems="flex-end" className="query-input">
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Ask a question about your energy data"
                  variant="outlined"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAskJim();
                  }}
                  disabled={isLoading}
                  className="question-field"
                  multiline
                  minRows={2}
                  maxRows={4}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1.1rem',
                      backgroundColor: 'white',
                      padding: '0 4px',
                      borderRadius: '4px',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#1976d2',
                    },
                    '& .MuiOutlinedInput-input': {
                      padding: '16px',
                      lineHeight: '1.5',
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  onClick={handleAskJim}
                  disabled={isLoading || !question.trim()}
                  fullWidth
                  className="ask-jim-btn"
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    height: '56px',
                    fontSize: '1.1rem',
                    fontWeight: '600'
                  }}
                >
                  {isLoading ? 'Thinking...' : 'Ask Jim'}
                </Button>
              </Grid>
            </Grid>

            {/* LLM Response Area */}
            {llmResponse && (
              <Box className="llm-response-container">
                <Typography variant="h6" className="response-title">Jim's Analysis:</Typography>
                <div 
                  id="llm-response"
                  className="llm-response"
                  dangerouslySetInnerHTML={{ __html: llmResponse }}
                />
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>

      <p className="join-campaign"><a href="/pricing">How do I join the campaign?</a></p>

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
                <h4>Sponsored Articles</h4>
                <ul>
                  <li><a href="#">Race to Net Zero</a></li>
                </ul>
              </div>
              
              <div className="ad-space">
                <h4>Sponsored Links</h4>
                <ul>
                  <li><a href="https://www.neso.energy/"><small>NESO</small></a></li>
                  <li><a href="https://www.lowcarboncontracts.uk/">Low Carbon Contracts</a></li>
                </ul>
              </div>

              <div className="ad-space">
                <br />
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
              
              <h4>Ads</h4> 
              <div className="ad-models">
                <div className="featured-grid">
                  {rightColumnAds.map(ad => (
                    <div key={ad.id} className="featured-card">
                      <div className="featured-header">
                        <span className="featured-title">{ad.title}</span>
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
                          <source src={ad.media} type="video/mp4" />
                         
                          </video>
                        </div>
                        <h4>Home Battery Systems</h4>
                        <p>Store excess energy with our compact, high-capacity home batteries</p>
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