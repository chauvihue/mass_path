// frontend/src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://zyuztgytwxvcefawswlq.supabase.co";
const supabaseAnonKey = "sb_secret_DztoYgj98hQZPHyCV3XneA_zrZE23l0";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;