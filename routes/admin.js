// routes/admin.js — endpoint superadmin (butuh token)

const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const { loadFullAppState, updateAppState } = require('../lib/stateManager');

const router = express.Router();

// Semua route di sini dilindungi adminAuth
router.use(adminAuth);

// ── Baca state lengkap ────────────────────────────────────────────────────────
router.get('/state', async (_req, res) => {
  try {
    const state = await loadFullAppState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Tulis state penuh (replace) ───────────────────────────────────────────────
router.put('/state', async (req, res) => {
  try {
    const newState = req.body;
    if (!newState || typeof newState !== 'object') {
      return res.status(400).json({ error: 'Body harus berupa JSON object' });
    }
    const result = await updateAppState((state) => {
      Object.assign(state, newState);
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Merge / patch state ───────────────────────────────────────────────────────
router.patch('/state', async (req, res) => {
  try {
    const patch = req.body;
    if (!patch || typeof patch !== 'object') {
      return res.status(400).json({ error: 'Body harus berupa JSON object' });
    }
    const result = await updateAppState((state) => {
      deepMerge(state, patch);
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Reset state ke kosong ─────────────────────────────────────────────────────
router.delete('/state', async (_req, res) => {
  try {
    const result = await updateAppState((state) => {
      Object.keys(state).forEach((k) => delete state[k]);
      return { success: true };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Publish / unpublish nilai ─────────────────────────────────────────────────
router.post('/publish-grades', async (req, res) => {
  try {
    const { publish } = req.body;
    const result = await updateAppState((state) => {
      state.publishGrades = Boolean(publish);
      return { success: true, publishGrades: state.publishGrades };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Utilitas: deep merge ──────────────────────────────────────────────────────
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof target[key] === 'object' &&
      target[key] !== null &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

module.exports = router;
