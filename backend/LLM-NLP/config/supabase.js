// backend/LLM-NLP/config/supabase.js
const { createClient } = require('@supabase/supabase-js');

// CHANGE FROM SUPABASE_KEY TO SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // ← THIS LINE CHANGED

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;