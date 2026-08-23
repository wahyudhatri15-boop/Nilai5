// lib/supabaseStore.js — akses data via Supabase REST API (server-side)

const { createClient } = require('@supabase/supabase-js');
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
} = require('./supabaseConfig');

// Gunakan service role key jika tersedia (bypass RLS), fallback ke anon key
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, supabaseKey);

const TABLE = 'local_storage_sync';
const STATE_KEY = 'main';

/**
 * Membaca state utama aplikasi dari Supabase.
 * @returns {Promise<object>} state aplikasi
 */
async function readState() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('value')
    .eq('key', STATE_KEY)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Baris belum ada — kembalikan state kosong
      return {};
    }
    throw new Error(`Supabase read error: ${error.message}`);
  }

  if (!data || !data.value) return {};
  try {
    return JSON.parse(data.value);
  } catch (e) {
    console.error('Failed to parse state from Supabase:', e);
    return {};
  }
}

/**
 * Menyimpan state ke Supabase (upsert).
 * @param {object} state
 */
async function writeState(state) {
  const { error } = await supabase
    .from(TABLE)
    .upsert({ key: STATE_KEY, value: JSON.stringify(state) }, { onConflict: 'key' });

  if (error) {
    throw new Error(`Supabase write error: ${error.message}`);
  }
}

module.exports = { readState, writeState };
