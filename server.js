const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Needed on Render/Railway/etc — without this, express-rate-limit and any
// IP-based logic would see the proxy's IP instead of the real visitor's.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);

// Unmatched /api/* routes get a clean JSON 404 instead of an HTML error page
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'এই এন্ডপয়েন্ট পাওয়া যায়নি।' });
});

// Any other unmatched route: this is a single-page site, so send people
// back to the homepage rather than showing Express's default error page.
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  const isClientError = err.name === 'MulterError' || err.status === 400 || /আপলোড|ছবি|আবশ্যক/.test(err.message || '');
  res.status(isClientError ? 400 : 500).json({ error: err.message || 'সার্ভার এরর হয়েছে।' });
});

app.listen(PORT, () => {
  console.log(`কন্টাই দুর্গোৎসব সার্ভার চলছে: http://localhost:${PORT}`);
});
