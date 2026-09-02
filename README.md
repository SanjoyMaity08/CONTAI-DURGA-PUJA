# কন্টাই দুর্গোৎসব — Contai Durga Puja (Full-Stack)

A full client + server web app for Contai's Durga Puja: zone-based pandal directory,
smart route loops, timeline, travel/safety info, a live memories & love-story wall,
a real photo-upload gallery, and a themed song list — all backed by a real, persistent store.

## Stack
- **Backend:** Node.js, Express, Multer (file uploads)
- **Frontend:** Plain HTML/CSS/JS (no build step), talks to the backend over `fetch`
- **Storage:** a plain JSON file at `db/data.json` — created automatically on first run.
  No database server, no native compilation, no build tools required on any OS.

## What's actually server-side here
- `GET /api/content` — pandals, zones, loops, timeline, logistics, poem, songs (static reference data)
- `GET/POST /api/voices` — memories & love-story submissions, persisted to disk
- `GET/POST /api/gallery` — real photo uploads, saved to `public/uploads/` + an entry in `db/data.json`
- `GET/POST /api/likes/:pandalId` — a live per-pandal like counter, persisted server-side

Submissions and uploads survive a page refresh and a server restart — verified by killing
and restarting the server mid-test and confirming the data was still there.

## Run it locally

```bash
npm install
npm start
```

Then open **http://localhost:3000**

The server serves both the frontend (`/public`) and the API (`/api/*`) from the same port —
no separate frontend server or CORS setup needed for local use.

## Before you publish

⚠️ **Verify the emergency helpline numbers, police/hospital contacts, and addresses** in
`data/content.json` against the actual Contai Police Station / SDO office before this goes
live anywhere — those were provided as draft content and should be confirmed.

## Deploying

This needs an actual Node host (not a static host like Netlify/GitHub Pages), because of the
Express backend. Easy free-tier options: **Render**, **Railway**, or **Fly.io**.

One thing to know: on most free hosting tiers the filesystem resets on redeploy, so
`db/data.json` and `public/uploads/` won't persist across deploys unless you attach a
persistent disk/volume (Render and Railway both offer this on paid tiers; free tiers vary).
For a portfolio/demo deployment this usually isn't a problem — for something you want to
keep collecting real submissions on long-term, attach persistent storage or move to a
proper database later.

## Project structure

```
contai-app/
├── server.js              # Express entry point
├── routes/api.js          # All API endpoints
├── db/store.js            # JSON file storage layer (read/write db/data.json)
├── data/content.json      # Static reference content (edit this to update pandals/timeline/etc.)
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js               # Frontend — fetches everything from /api
│   ├── assets/durga-mukh.png
│   └── uploads/              # User-uploaded gallery photos land here
└── package.json
```


## Newly added
- Live 2026 Puja countdown on the hero and per-day countdowns in the timeline.
- Looping original ambient Puja theme tone with a mute/unmute control; browser autoplay restrictions are respected.
- Travel Hub with official Ola/Uber rider links, Contai (Kanthi) → Digha live bus booking, date-aware redBus link, and Google Maps route.
- Current route data shown in the Travel Hub is a provider snapshot and should be rechecked at booking time.


## Latest UX update
- People's Choice Awards now show **all 15 pandals** in horizontally scrollable cards for every category.
- Updated first-visit welcome overlay uses a fresh v2 localStorage key so the entrance experience appears once for this release.
- Smart Puja Assistant and Awards remain in the main navigation.
