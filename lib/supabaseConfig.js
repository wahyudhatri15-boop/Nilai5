// lib/supabaseConfig.js — konfigurasi Supabase server-side

const SUPABASE_URL = 'https://yefdvryfptkudarccuwv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmR2cnlmcHRrdWRhcmNjdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0MDgyMjIsImV4cCI6MjA5OTk4NDIyMn0.BmmYFqJN2hw9bT8TQIPDLRdTtUqrmX3Sy6_-E9VTy90';

// Isi dengan service_role key dari Supabase Dashboard → Settings → API
// agar server bisa baca/tulis data tanpa RLS
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function isServerSyncConfigured() {
  return Boolean(SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  isSupabaseConfigured,
  isServerSyncConfigured,
};
