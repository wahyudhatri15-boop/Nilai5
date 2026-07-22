-- ============================================================
-- SiGrade — Setup Supabase (storage utama server, tanpa SQLite)
-- Dashboard: https://supabase.com/dashboard/project/yefdvryfptkudarccuwv/sql/new
-- ============================================================

-- 1. Tabel sync (mirror localStorage app)
CREATE TABLE IF NOT EXISTS local_storage_sync (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Row Level Security
ALTER TABLE local_storage_sync ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika re-run
DROP POLICY IF EXISTS "Allow authenticated full access on local_storage_sync" ON local_storage_sync;

-- Guru yang sudah login boleh baca/tulis semua data sekolah
CREATE POLICY "Allow authenticated full access on local_storage_sync"
ON local_storage_sync
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. (Opsional) Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_local_storage_sync_updated
ON local_storage_sync (updated_at DESC);

-- ============================================================
-- Setelah SQL di atas, buat akun guru di:
-- Authentication → Users → Add user → Create new user
-- Email + password → centang "Auto Confirm User"
-- ============================================================
