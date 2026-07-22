// supabaseClient.js — kredensial hardcoded (proyek belajar)

const SUPABASE_URL = 'https://yefdvryfptkudarccuwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmR2cnlmcHRrdWRhcmNjdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDgyMjIsImV4cCI6MjA5OTk4NDIyMn0.BmmYFqJN2hw9bT8TQIPDLRdTtUqrmX3Sy6_-E9VTy90';

let mySupabase = null;

try {
  if (SUPABASE_URL.startsWith('http')) {
    mySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.error('Gagal menginisialisasi Supabase:', e);
}

window.supabaseClient = mySupabase;
window.SUPABASE_IS_CONFIGURED = mySupabase !== null;
