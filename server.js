require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';

const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const { isSupabaseConfigured, isServerSyncConfigured } = require('./lib/supabaseConfig');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

if (isDev) {
  const livereload = require('livereload');
  const connectLivereload = require('connect-livereload');

  const liveReloadServer = livereload.createServer({
    exts: ['html', 'css', 'js'],
    delay: 200,
  });

  liveReloadServer.watch([
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'app_core.js'),
    path.join(__dirname, 'style.css'),
    path.join(__dirname, 'auth.js'),
    path.join(__dirname, 'apiClient.js'),
  ]);

  app.use(connectLivereload());

  app.use((req, res, next) => {
    if (/\.(html|js|css)$/.test(req.path)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
    next();
  });

  console.log('  Dev mode   : live reload aktif (simpan file → browser refresh otomatis)');
}

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'sigrade-v5',
    storage: 'supabase',
  });
});

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`SiGrade server running on http://localhost:${PORT}`);
    console.log(`  Public API : /api/public/*  (murid, tanpa login)`);
    console.log(`  Teacher API: /api/teacher/* (guru, butuh kunci)`);
    console.log(`  Admin API  : /api/admin/*   (superadmin, butuh token)`);
    console.log(`  Storage    : Supabase (tanpa SQLite)`);
    console.log(`  Supabase   : ${isSupabaseConfigured() ? 'configured' : 'not configured'}`);
    console.log(`  Service key: ${isServerSyncConfigured() ? 'ready' : 'MISSING — isi di lib/supabaseConfig.js'}`);
    console.log('\n  Tekan Ctrl+C untuk menghentikan server.\n');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} sudah dipakai — server lain masih berjalan.`);
      console.error(`   Buka http://localhost:${PORT} di browser (mungkin sudah aktif).`);
      console.error('   Untuk stop proses lama di PowerShell:');
      console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`);
    } else {
      console.error('\n❌ Gagal start server:', err.message);
    }
    process.exit(1);
  });
}

module.exports = app;
