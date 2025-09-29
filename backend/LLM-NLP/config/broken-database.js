// backend/LLM-NLP/config/database.js
const supabase = require('./supabase');

const testConnection = async () => {
  try {
    // Test connection by querying the readings table
    const { data, error } = await supabase.from('readings').select('count');
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      throw error;
    }
    
    console.log('✅ Supabase connected successfully');
    console.log(`📊 Readings table contains ${data[0].count} records`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    throw error;
  }
};

module.exports = { testConnection, supabase };

