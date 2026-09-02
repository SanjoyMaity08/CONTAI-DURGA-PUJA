const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const store = require('../db/store');

const router = express.Router();
const content = require('../data/content.json');

// Applies to POST /voices, /gallery, /likes/:id — a normal visitor never
// hits these limits; it's there to stop spam once the link is public.
const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'একটু বেশি অনুরোধ হয়ে যাচ্ছে — কিছুক্ষণ পর আবার চেষ্টা করুন।' },
});

// ---------- Static content ----------
router.get('/content', (req, res) => {
  res.json(content);
});

// ---------- Voices: memories / love stories / poems submitted by users ----------
router.get('/voices', (req, res) => {
  res.json(store.getVoices());
});

router.post('/voices', writeLimiter, (req, res) => {
  const { type, name, text } = req.body || {};
  if (!type || !name || !text) {
    return res.status(400).json({ error: 'type, name ও text আবশ্যক।' });
  }
  const clean = (s) => String(s).trim().slice(0, 2000);
  const row = store.addVoice({ type: clean(type), name: clean(name), text: clean(text) });
  res.status(201).json(row);
});

// ---------- Gallery: real photo uploads ----------
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `img_${Date.now()}_${Math.round(Math.random() * 1e6)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('শুধুমাত্র ছবি (jpg/png/webp/gif) আপলোড করা যাবে।'), ok);
  },
});

router.get('/gallery', (req, res) => {
  res.json(store.getGallery());
});

router.post('/gallery', writeLimiter, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ছবি পাওয়া যায়নি।' });
  const caption = (req.body.caption || '').trim().slice(0, 300);
  const submittedBy = (req.body.submitted_by || 'নাম দেওয়া হয়নি').trim().slice(0, 120);
  const imageUrl = `/uploads/${req.file.filename}`;

  const row = store.addGalleryItem({ caption, submitted_by: submittedBy, image_url: imageUrl });
  res.status(201).json(row);
});

// ---------- Pandal likes: a small live server-side counter ----------
router.get('/likes', (req, res) => {
  res.json(store.getLikes());
});

const likeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'একটু ধীরে — কিছুক্ষণ পর আবার চেষ্টা করুন।' },
});

router.post('/likes/:pandalId', likeLimiter, (req, res) => {
  const { pandalId } = req.params;
  const likes = store.incrementLike(pandalId);
  res.json({ pandalId, likes });
});

module.exports = router;
