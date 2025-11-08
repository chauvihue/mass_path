// frontend/src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://zyuztgytwxvcefawswlq.supabase.co";
// IMPORTANT: Use the ANON/PUBLIC key, NOT the service_role/secret key
// The anon key starts with "eyJ..." and is safe to use in the browser
// Find it in Supabase Dashboard > Settings > API > Project API keys > anon public
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXp0Z3l0d3h2Y2VmYXdzd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTYwOTIsImV4cCI6MjA3ODE5MjA5Mn0.gdlyHnsULbjPmVShlJ96quU4BwnkHvTVJdNpTfqR2Q8";

if (!supabaseAnonKey || supabaseAnonKey === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXp0Z3l0d3h2Y2VmYXdzd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTYwOTIsImV4cCI6MjA3ODE5MjA5Mn0.gdlyHnsULbjPmVShlJ96quU4BwnkHvTVJdNpTfqR2Q8" || supabaseAnonKey.includes("secret")) {
  console.error(
    "❌ ERROR: You're using a secret key or haven't set your anon key!\n" +
    "Please get your ANON key from:\n" +
    "1. Go to https://supabase.com/dashboard\n" +
    "2. Select your project\n" +
    "3. Go to Settings > API\n" +
    "4. Copy the 'anon public' key (starts with 'eyJ...')\n" +
    "5. Replace YOUR_ANON_KEY_HERE above or set REACT_APP_SUPABASE_ANON_KEY in .env file"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;