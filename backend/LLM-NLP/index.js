
// index.js - AT THE VERY TOP
require('dotenv').config();
const { testConnection, supabase } = require('./config/database');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection on startup
testConnection().then(() => {
  console.log('✅ Supabase connection established');
}).catch(error => {
  console.error('❌ Database connection failed:', error.message);
});

// Routes - FIXED PATHS
app.use('/api/readings', require('./routes/readings')); // This is correct
app.use('/api/llm', require('./routes/llm')); // CHANGED from ./src/routes/llm to ./routes/llm

// Health check with database test
app.get('/health', async (req, res) => {
  try {
    const { supabase } = require('./config/database');
    const { data, error } = await supabase.from('readings').select('count');
    
    if (error) {
      return res.status(500).json({ 
        status: 'ERROR', 
        database: 'Connection failed', 
        error: error.message 
      });
    }

    res.json({ 
      status: 'OK', 
      database: 'Connected', 
      timestamp: new Date().toISOString(),
      readings_count: data[0]?.count || 0
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Connection failed', 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`📊 Readings API: http://localhost:${PORT}/api/readings`);
  console.log(`🤖 LLM API: http://localhost:${PORT}/api/llm`);
});


