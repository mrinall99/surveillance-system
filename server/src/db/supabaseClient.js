/**
 * Supabase Cloud PostgreSQL Client Adapter.
 * Initializes Supabase client if SUPABASE_URL and SUPABASE_KEY are provided in server/.env.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE') {
    try {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('⚡ Connected to Supabase Cloud PostgreSQL Database:', supabaseUrl);
    } catch (err) {
        console.warn('⚠️ Failed to initialize Supabase client:', err.message);
    }
} else {
    console.log('ℹ️ Supabase environment variables not set. System running in Local JSON mode (surveillance.json).');
}

module.exports = {
    supabase,
    isSupabaseActive: () => !!supabase
};
