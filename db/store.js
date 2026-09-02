// A tiny file-backed JSON "database". No native compilation required —
// this replaces better-sqlite3 so the app installs cleanly everywhere,
// including Windows machines without Visual Studio Build Tools.
//
// Data lives in db/data.json and is rewritten atomically on every write.
// Fine for this app's scale (a local/small-deployment memories+gallery site).

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  voices: [
    {
      id: 1,
      type: 'প্রেমের গল্প',
      name: 'নমুনা গল্প',
      text: 'গত বছরের অষ্টমীর অঞ্জলি দিতে গিয়ে কুঞ্জপুরের প্যান্ডেলে ওর সাথে প্রথম চোখাচোখি। কন্টাইয়ের চেনা গলির কোলাহলের মাঝেও আইসক্রিম হাতে সেই প্রথম কথা বলাটা আজীবন মনে থাকবে।',
      created_at: new Date().toISOString(),
    },
  ],
  gallery: [],
  likes: {},
  _nextVoiceId: 2,
  _nextGalleryId: 1,
};

function load() {
  if (!fs.existsSync(DB_FILE)) {
    save(DEFAULT_DATA);
    return structuredClone(DEFAULT_DATA);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('db/data.json পড়তে সমস্যা হয়েছে, ডিফল্ট ডেটা দিয়ে শুরু করা হচ্ছে:', err.message);
    save(DEFAULT_DATA);
    return structuredClone(DEFAULT_DATA);
  }
}

function save(data) {
  // write to a temp file then rename, so a crash mid-write can't corrupt data.json
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_FILE);
}

// ---------------- Voices ----------------
function getVoices() {
  const data = load();
  return [...data.voices].sort((a, b) => b.id - a.id);
}

function addVoice({ type, name, text }) {
  const data = load();
  const row = {
    id: data._nextVoiceId,
    type,
    name,
    text,
    created_at: new Date().toISOString(),
  };
  data.voices.push(row);
  data._nextVoiceId += 1;
  save(data);
  return row;
}

// ---------------- Gallery ----------------
function getGallery() {
  const data = load();
  return [...data.gallery].sort((a, b) => b.id - a.id);
}

function addGalleryItem({ caption, submitted_by, image_url }) {
  const data = load();
  const row = {
    id: data._nextGalleryId,
    caption,
    submitted_by,
    image_url,
    created_at: new Date().toISOString(),
  };
  data.gallery.push(row);
  data._nextGalleryId += 1;
  save(data);
  return row;
}

// ---------------- Likes ----------------
function getLikes() {
  const data = load();
  return { ...data.likes };
}

function incrementLike(pandalId) {
  const data = load();
  data.likes[pandalId] = (data.likes[pandalId] || 0) + 1;
  save(data);
  return data.likes[pandalId];
}

module.exports = {
  getVoices,
  addVoice,
  getGallery,
  addGalleryItem,
  getLikes,
  incrementLike,
};
