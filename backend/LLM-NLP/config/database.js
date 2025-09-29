require('dotenv').config(); // Add this line at the top
// backend/LLM-NLP/config/database.js
const { createClient } = require('@supabase/supabase-js');

// CHANGE FROM SUPABASE_KEY TO SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← THIS LINE CHANGED

// Validate that environment variables exist
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testConnection = async () => {
  try {
    // Test connection by querying the readings table
    const { data, error } = await supabase.from('readings').select('count');
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    console.log(`📊 Readings table contains ${data.length} records`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
};

module.exports = { testConnection, supabase };