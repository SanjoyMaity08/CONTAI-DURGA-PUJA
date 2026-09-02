const API = '/api';
let CONTENT = null;
let LIKES = {};
let PASSPORT = loadPassport();

document.addEventListener('DOMContentLoaded', async () => {
  wireNav();
  wireContactDrawer();
  wireThemeAudio();
  wireBusBooking();
  wirePassportControls();
  wireMobileBottomNav();
  try {
    await loadContent();
    await Promise.all([loadVoices(), loadGallery(), loadLikes()]);
    wireScrollReveal();
    wireActiveNav();
    wireLightbox();
    wirePandalSearch();
    wireBackToTop();
    wirePujaMode();
    wireParallaxHero();
    wireSmartPlanner();
    wireAwards();
    wireWelcomeExperience();
    setupToast();
  } catch (err) {
    showStartupError();
  }
  wireShareForm();
  wireUploadForm();
});

function showStartupError(){
  const banner = document.createElement('div');
  banner.className = 'startup-error';
  banner.innerHTML = `
    <p>⚠️ সাইটের ডেটা লোড করতে সমস্যা হচ্ছে। সার্ভার একটু ঘুম থেকে জেগে উঠছে হতে পারে (ফ্রি হোস্টিং হলে এটা স্বাভাবিক) — কয়েক সেকেন্ড পর আবার চেষ্টা করুন।</p>
    <button id="retryLoad" class="btn btn-ghost">আবার চেষ্টা করুন</button>
  `;
  document.body.prepend(banner);
  document.getElementById('retryLoad').addEventListener('click', () => window.location.reload());
}

/* ================= UX polish: scroll reveal + active nav ================= */
function wireScrollReveal(){
  const targets = document.querySelectorAll('.section, .hero-inner');
  if (!('IntersectionObserver' in window)){
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(t => io.observe(t));
}

function wireActiveNav(){
  const links = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = links.find(a => a.getAttribute('href') === `#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(a => a.classList.remove('is-current'));
        link.classList.add('is-current');
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => io.observe(s));
}

function wireLightbox(){
  const overlay=document.getElementById('lightboxOverlay'), img=document.getElementById('lightboxImg'), caption=document.getElementById('lightboxCaption'), closeBtn=document.getElementById('lightboxClose'), prev=document.getElementById('lightboxPrev'), next=document.getElementById('lightboxNext');
  const gallery=document.getElementById('galleryGrid'); if(!overlay||!img||!gallery) return;
  let photos=[], current=0;
  function collect(){photos=[...gallery.querySelectorAll('.gallery-item img')];}
  function show(i){collect();if(!photos.length)return;current=(i+photos.length)%photos.length;const photo=photos[current];img.src=photo.src;img.alt=photo.alt||'পুজোর ছবি';caption.textContent=photo.closest('.gallery-item')?.querySelector('.gallery-caption')?.textContent||'';prev.disabled=photos.length<2;next.disabled=photos.length<2;}
  function open(photo){collect();show(photos.indexOf(photo));overlay.classList.add('is-open');document.body.style.overflow='hidden';}
  function close(){overlay.classList.remove('is-open');document.body.style.overflow='';img.src='';}
  gallery.addEventListener('click',e=>{const photo=e.target.closest('.gallery-item img');if(photo)open(photo);});
  closeBtn?.addEventListener('click',close); prev?.addEventListener('click',()=>show(current-1)); next?.addEventListener('click',()=>show(current+1));
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  document.addEventListener('keydown',e=>{if(!overlay.classList.contains('is-open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(current-1);if(e.key==='ArrowRight')show(current+1);});
}

function wireNav(){
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('is-open')));
}

/* ================= Static content (zones, pandals, loops, timeline, logistics, poem, songs) ================= */
async function loadContent(){
  const res = await fetch(`${API}/content`);
  CONTENT = await res.json();

  renderStats();
  renderZoneTabs();
  renderInteractiveMap();
  renderLoopTabs();
  renderTimeline();
  renderLogistics();
  renderPoem();
  renderSongs();
}

function toBengaliDigits(n){
  const map = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
  return String(n).split('').map(ch => map[ch] ?? ch).join('');
}

function renderStats(){
  const pandalCount = CONTENT.pandals.length;
  const zoneCount = CONTENT.zones.length;
  const loopCount = Object.keys(CONTENT.loops).length;

  document.getElementById('statPandals').textContent = toBengaliDigits(pandalCount);
  document.getElementById('statZones').textContent = toBengaliDigits(zoneCount);
  document.getElementById('statLoops').textContent = toBengaliDigits(loopCount);
  document.getElementById('pandalCountHeading').textContent =
    `কন্টাইয়ের ${toBengaliDigits(pandalCount)}টি প্যান্ডেল, ${toBengaliDigits(zoneCount)}টি জোনে`;
}

function renderZoneTabs(){
  const zoneTabs = document.getElementById('zoneTabs');
  zoneTabs.innerHTML = CONTENT.zones.map((z, i) =>
    `<button class="zone-tab ${i === 0 ? 'is-active' : ''}" data-zone="${z.id}" role="tab" aria-selected="${i === 0}">${z.label}</button>`
  ).join('');

  zoneTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.zone-tab');
    if (!btn) return;
    zoneTabs.querySelectorAll('.zone-tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    renderPandals(btn.dataset.zone);
  });

  renderPandals(CONTENT.zones[0].id);
}

function mapUrlFor(p){
  const q = encodeURIComponent(`${p.landmark}, Contai, West Bengal`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function renderPandals(zoneId){
  const grid = document.getElementById('pandalGrid');
  grid.innerHTML = CONTENT.pandals.filter(p => p.zone === zoneId && matchesPandalSearch(p)).map((p, cardIndex) => {
    const cardOpen = p.image
      ? `<article class="pandal-card pandal-card--with-image" style="--card-i:${cardIndex}">
           <div class="pandal-photo" style="background-image:url('${p.image}')"></div>
           <div class="pandal-body">`
      : `<article class="pandal-card">`;
    const cardClose = p.image ? `</div></article>` : `</article>`;

    return `${cardOpen}
      <div class="pandal-card-head">
        <h3>${p.name}</h3>
        <div class="pandal-actions">
          <button class="like-btn" data-pandal="${p.id}">❤ <span class="like-count">${LIKES[p.id] || 0}</span></button>
          <button class="passport-btn ${PASSPORT.favourites.includes(p.id) ? 'is-saved' : ''}" data-passport-fav="${p.id}" type="button">${PASSPORT.favourites.includes(p.id) ? '★' : '☆'} ফেভারিট</button>
        </div>
      </div>
      <p class="pandal-landmark">${p.landmark}</p>
      ${p.theme ? `<p><span class="label">থিম:</span> ${p.theme}</p>` : ''}
      ${p.history ? `<p><span class="label">ইতিহাস:</span> ${p.history}</p>` : ''}
      ${p.route ? `<p><span class="label">রুট:</span> ${p.route}</p>` : ''}
      <a class="map-link" href="${mapUrlFor(p)}" target="_blank" rel="noopener">📍 গুগল ম্যাপে দেখুন</a>
    ${cardClose}`;
  }).join('');

  const visibleCount = grid.querySelectorAll('.pandal-card').length;
  const countEl = document.getElementById('searchResultCount');
  if (countEl) countEl.textContent = searchQuery ? `${toBengaliDigits(visibleCount)}টি ফলাফল` : '';
  if (!visibleCount) grid.innerHTML = `<div class="no-search-results"><strong>কিছু পাওয়া যায়নি</strong><p style="margin-top:6px">অন্য প্যান্ডেল, এলাকা বা থিম দিয়ে আবার খুঁজুন।</p></div>`;

  grid.querySelectorAll('.like-btn').forEach(btn => btn.addEventListener('click', onLike));
  grid.querySelectorAll('[data-passport-fav]').forEach(btn => btn.addEventListener('click', onPassportFavourite));
  updatePassportUI();
}

async function loadLikes(){
  const res = await fetch(`${API}/likes`);
  LIKES = await res.json();
  // re-render whichever zone is currently active so counts show up
  const activeZone = document.querySelector('.zone-tab.is-active');
  if (activeZone) renderPandals(activeZone.dataset.zone);
}

async function onLike(e){
  const btn = e.currentTarget;
  btn.disabled = true;
  const pandalId = btn.dataset.pandal;
  try{
    const res = await fetch(`${API}/likes/${pandalId}`, { method: 'POST' });
    const data = await res.json();
    LIKES[pandalId] = data.likes;
    btn.querySelector('.like-count').textContent = data.likes;
    btn.classList.add('is-liked');
    showToast('❤️ ভোট রেকর্ড হয়েছে');
  } finally {
    btn.disabled = false;
  }
}

function loadPassport(){
  try{
    const saved = JSON.parse(localStorage.getItem('contaiPujaPassport') || '{}');
    return { favourites: Array.isArray(saved.favourites) ? saved.favourites : [], visited: Array.isArray(saved.visited) ? saved.visited : [] };
  } catch { return { favourites: [], visited: [] }; }
}
function savePassport(){ localStorage.setItem('contaiPujaPassport', JSON.stringify(PASSPORT)); updatePassportUI(); }
function onPassportFavourite(e){
  const id=e.currentTarget.dataset.passportFav;
  const saved = PASSPORT.favourites.includes(id);
  PASSPORT.favourites = saved ? PASSPORT.favourites.filter(x=>x!==id) : [...PASSPORT.favourites,id];
  savePassport();
  showToast(saved ? '☆ ফেভারিট থেকে সরানো হয়েছে' : '★ ফেভারিটে যোগ হয়েছে');
  const zone=document.querySelector('.zone-tab.is-active'); if(zone) renderPandals(zone.dataset.zone);
}
function markVisited(id){
  if(!PASSPORT.visited.includes(id)){ PASSPORT.visited.push(id); showToast('🎟️ পুজো পাসপোর্টে নতুন স্ট্যাম্প!'); }
  savePassport();
}
function updatePassportUI(){
  const total=CONTENT?.pandals?.length || 0;
  const fav=PASSPORT.favourites.length;
  const visited=PASSPORT.visited.length;
  const pct=total ? Math.round((visited/total)*100) : 0;
  const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=typeof val==='number'?toBengaliDigits(val):val;};
  set('passportFavCount',fav); set('passportVisitedCount',visited); set('passportTotalCount',total);
  const bar=document.getElementById('passportProgressBar'); if(bar) bar.style.width=`${pct}%`;
  set('passportProgressText',`${toBengaliDigits(pct)}% সম্পূর্ণ`);
  updateSmartPassport();
  renderPlanner();
}
function wirePassportControls(){
  const clear=document.getElementById('clearPassportBtn');
  if(clear) clear.addEventListener('click',()=>{ PASSPORT={favourites:[],visited:[]}; savePassport(); const zone=document.querySelector('.zone-tab.is-active'); if(zone) renderPandals(zone.dataset.zone); });
}
function renderInteractiveMap(){
  const list=document.getElementById('mapPandalList');
  if(!list || !CONTENT?.pandals) return;
  list.innerHTML=CONTENT.pandals.map(p=>`<button type="button" class="map-pandal-chip" data-map-pandal="${p.id}"><span>${p.name}</span><small>${p.landmark}</small></button>`).join('');
  list.querySelectorAll('[data-map-pandal]').forEach(btn=>btn.addEventListener('click',()=>selectMapPandal(btn.dataset.mapPandal)));
  selectMapPandal(CONTENT.pandals[0]?.id);
}
function selectMapPandal(id){
  const p=CONTENT.pandals.find(x=>x.id===id); if(!p) return;
  const frame=document.getElementById('pandalMapFrame');
  const name=document.getElementById('mapPandalName');
  const meta=document.getElementById('mapPandalMeta');
  if(frame) frame.src=`https://www.google.com/maps?q=${encodeURIComponent(p.landmark+', Contai, West Bengal')}&output=embed`;
  if(name) name.textContent=p.name;
  if(meta) meta.innerHTML=`${p.landmark}${p.theme ? ` · ${escapeHTML(p.theme.slice(0,85))}…` : ''}<br><span class="map-action-row"><a href="${mapUrlFor(p)}" target="_blank" rel="noopener" class="map-link">📍 গুগল ম্যাপ</a><button type="button" class="passport-visit-btn" data-visit-map="${p.id}">${PASSPORT.visited.includes(p.id)?'✓ দেখা হয়েছে':'✅ পাসপোর্টে ভিজিটেড'}</button></span>`;
  document.querySelectorAll('.map-pandal-chip').forEach(b=>b.classList.toggle('is-active',b.dataset.mapPandal===id));
  const visit=document.querySelector('[data-visit-map]'); if(visit) visit.addEventListener('click',()=>{markVisited(id); selectMapPandal(id);});
}
function wireMobileBottomNav(){
  document.querySelectorAll('.mobile-bottom-nav a').forEach(a=>a.addEventListener('click',()=>document.getElementById('navLinks')?.classList.remove('is-open')));
}
function renderTodayPuja(){
  const title=document.getElementById('todayPujaTitle'); const text=document.getElementById('todayPujaText'); const count=document.getElementById('todayPujaCount');
  if(!title||!text||!count) return;
  const now=Date.now();
  const targets=timelineTargets;
  const events=CONTENT.timeline || [];
  let idx=-1;
  for(let i=0;i<targets.length;i++){ if(new Date(targets[i]).getTime()<=now) idx=i; else break; }
  if(idx<0){
    const next=countdownParts(targets[0]);
    title.textContent='মহালয়া এখনও আসেনি'; text.textContent='আজ প্রস্তুতির দিন — কাশফুল, শিউলি আর পুজোর অপেক্ষা।'; count.textContent=next?`মহালয়া পর্যন্ত ${toBengaliDigits(next.days)} দিন`:'শুভ আগমন';
  } else if(idx<events.length){
    title.textContent=events[idx].event;
    text.textContent=events[idx].note || 'আজ প্যান্ডেল ঘোরা, অঞ্জলি ও পুজোর আবহ উপভোগের দিন।';
    const nextIdx=idx+1;
    if(nextIdx<targets.length){ const next=countdownParts(targets[nextIdx]); count.textContent=next?`পরের দিন পর্যন্ত ${toBengaliDigits(next.days)} দিন`:'পরের দিন শুরু'; }
    else count.textContent='আজ বিজয়ার দিন';
  } else { title.textContent='পুজো শেষ, স্মৃতি রয়ে যায়'; text.textContent='আসছে বছর আবার হবে — আজ স্মৃতি জমিয়ে রাখুন।'; count.textContent='শুভ বিজয়া'; }
}

function renderLoopTabs(){
  const loopTabs = document.getElementById('loopTabs');
  const ids = Object.keys(CONTENT.loops);
  loopTabs.innerHTML = ids.map((id, i) => {
    const loop = CONTENT.loops[id];
    return `<button class="loop-tab ${i === 0 ? 'is-active' : ''}" data-loop="${id}" role="tab" aria-selected="${i === 0}">
      <span class="loop-tab-title">${loop.title}</span><span class="loop-tab-sub">${loop.note}</span>
    </button>`;
  }).join('');

  loopTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.loop-tab');
    if (!btn) return;
    loopTabs.querySelectorAll('.loop-tab').forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    btn.classList.add('is-active');
    btn.setAttribute('aria-selected', 'true');
    renderLoop(btn.dataset.loop);
  });

  renderLoop(ids[0]);
}

function renderLoop(loopId){
  const loop = CONTENT.loops[loopId];
  document.getElementById('loopPath').innerHTML = loop.stops.map((stop, i) => `
    <div class="loop-node"><div class="loop-node-dot">${i + 1}</div><div class="loop-node-label">${stop}</div></div>
    ${i < loop.stops.length - 1 ? '<span class="loop-arrow">➜</span>' : ''}
  `).join('');

  // Real, working multi-stop Google Maps directions — Google resolves each
  // name via search, so this routes correctly without needing stored GPS data.
  const waypoints = loop.stops.map(s => encodeURIComponent(`${s}, Contai, West Bengal`));
  const directionsUrl = `https://www.google.com/maps/dir/${waypoints.join('/')}`;
  const btn = document.getElementById('loopDirectionsBtn');
  if (btn) btn.href = directionsUrl;
}

function renderTimeline(){
  const list = document.getElementById('timelineList');
  list.innerHTML = CONTENT.timeline.map((t, i) => `
    <li data-timeline-index="${i}">
      <div class="t-date">${t.date} &middot; ${t.day}</div>
      <div class="t-event">${t.event}</div>
      ${t.note ? `<div class="t-note">${t.note}</div>` : ''}
      <div class="t-countdown" id="tCountdown-${i}" aria-live="polite">কাউন্টডাউন লোড হচ্ছে…</div>
    </li>`).join('');
  startCountdowns();
}

const PUJA_TIMEZONE_OFFSET = '+05:30';
const timelineTargets = [
  '2026-10-10T00:00:00+05:30',
  '2026-10-16T00:00:00+05:30',
  '2026-10-17T00:00:00+05:30',
  '2026-10-18T00:00:00+05:30',
  '2026-10-19T00:00:00+05:30',
  '2026-10-20T00:00:00+05:30',
  '2026-10-21T00:00:00+05:30'
];

function countdownParts(targetISO){
  const now = Date.now();
  const target = new Date(targetISO).getTime();
  const diff = target - now;
  if (diff <= 0) return null;
  const sec = Math.floor(diff / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60
  };
}

function pad2(n){ return String(n).padStart(2, '0'); }

function startCountdowns(){
  const update = () => {
    const main = countdownParts(timelineTargets[1]);
    const ids = ['mainDays','mainHours','mainMinutes','mainSeconds'];

    const istClock = document.getElementById('istClock');
    if (istClock){
      const ist = new Intl.DateTimeFormat('en-GB', {
        timeZone:'Asia/Kolkata', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
      }).format(new Date());
      istClock.textContent = `IST ${ist}`;
    }
    if (main){
      document.getElementById('mainDays').textContent = toBengaliDigits(main.days);
      document.getElementById('mainHours').textContent = toBengaliDigits(pad2(main.hours));
      document.getElementById('mainMinutes').textContent = toBengaliDigits(pad2(main.minutes));
      document.getElementById('mainSeconds').textContent = toBengaliDigits(pad2(main.seconds));
    } else {
      ids.forEach(id => { const el=document.getElementById(id); if (el) el.textContent='০'; });
      const target=document.getElementById('mainCountdownTarget');
      if(target) target.textContent='পুজো শুরু হয়ে গেছে — শুভ পঞ্চমী!';
    }

    let nextIndex = timelineTargets.findIndex(targetISO => countdownParts(targetISO));
    document.querySelectorAll('#timelineList li').forEach(li => li.classList.remove('is-next'));
    if (nextIndex >= 0){
      const nextLi = document.querySelector(`#timelineList li[data-timeline-index="${nextIndex}"]`);
      if (nextLi) nextLi.classList.add('is-next');
    }

    renderTodayPuja();
    timelineTargets.forEach((targetISO, i) => {
      const el=document.getElementById(`tCountdown-${i}`);
      if(!el) return;
      const part=countdownParts(targetISO);
      if(!part){
        el.className='t-countdown t-countdown--done';
        el.textContent='✓ দিনটি শুরু হয়ে গেছে';
      } else {
        el.className='t-countdown';
        el.innerHTML=`বাকি <strong>${toBengaliDigits(part.days)}</strong> দিন <strong>${toBengaliDigits(pad2(part.hours))}</strong> ঘন্টা <strong>${toBengaliDigits(pad2(part.minutes))}</strong> মিনিট <strong>${toBengaliDigits(pad2(part.seconds))}</strong> সেকেন্ড`;
      }
    });
  };
  update();
  if(window.__countdownTimer) clearInterval(window.__countdownTimer);
  window.__countdownTimer=setInterval(update,1000);
}

function wireThemeAudio(){
  const audio=document.getElementById('pujaTheme');
  const btn=document.getElementById('soundToggle');
  if(!audio || !btn) return;

  const setState=(on)=>{
    audio.muted=!on;
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML=on ? '🔊 <span>আবৃত্তি চালু</span>' : '🔇 <span>আবৃত্তি বন্ধ</span>';
  };

  // Autoplay is intentionally muted initially because modern browsers often block audible autoplay.
  audio.play().catch(()=>{});
  const startOnGesture=()=>{
    if(!audio.paused){ audio.muted=false; setState(true); }
    else { audio.muted=false; audio.play().then(()=>setState(true)).catch(()=>{}); }
    window.removeEventListener('pointerdown',startOnGesture);
    window.removeEventListener('keydown',startOnGesture);
  };
  window.addEventListener('pointerdown',startOnGesture,{once:true});
  window.addEventListener('keydown',startOnGesture,{once:true});
  btn.addEventListener('click',(e)=>{
    e.stopPropagation();
    const on=audio.muted;
    if(on){ audio.muted=false; audio.play().then(()=>setState(true)).catch(()=>{}); }
    else setState(false);
  });
  setState(false);
}

function wireBusBooking(){
  const date=document.getElementById('busDate');
  const btn=document.getElementById('busBookingBtn');
  if(!date || !btn) return;
  const today=new Date();
  const localISO=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
  date.min=localISO;
  date.value=localISO;
  function update(){
    const val=date.value;
    if(!val) return;
    const [y,m,d]=val.split('-');
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    btn.href=`https://www.redbus.in/bus-tickets/contai-kanthi-to-digha?onward=${d}-${months[Number(m)-1]}-${y}`;
  }
  date.addEventListener('change',update);
  update();
}

function renderLogistics(){
  document.getElementById('busStops').innerHTML = CONTENT.logistics.bus.map(b => `<li>${b}</li>`).join('');
  document.getElementById('parkingAreas').innerHTML = CONTENT.logistics.parking.map(p => `<li>${p}</li>`).join('');
  document.getElementById('helplines').innerHTML = CONTENT.logistics.helplines.map(h => `<li><span>${h.label}</span><span>${h.value}</span></li>`).join('');
}

function renderPoem(){
  document.getElementById('poemText').innerHTML = CONTENT.poem.lines.map(l => `<p>${l}</p>`).join('');
  document.getElementById('poemAuthor').textContent = `— ${CONTENT.poem.author}`;
}

function renderSongs(){
  document.getElementById('songList').innerHTML = CONTENT.songs.map(s => {
    const q = encodeURIComponent(`${s.title} ${s.artist}`);
    return `<li><div class="song-info"><span class="song-title">${s.title}</span><span class="song-meta">${s.artist} &middot; ${s.mood}</span></div>
      <a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">শুনুন ↗</a></li>`;
  }).join('');
}

/* ================= Dynamic: voices (memories/stories) via DB ================= */
async function loadVoices(){
  const res = await fetch(`${API}/voices`);
  const voices = await res.json();
  renderVoices(voices);
}

function renderVoices(voices){
  const wall = document.getElementById('voiceWall');
  const stories = voices.filter(v => v.type !== 'কবিতা');
  if (!stories.length){
    wall.innerHTML = `<p class="gallery-empty">এখনো কোনো গল্প নেই — প্রথম গল্পটা আপনিই লিখুন!</p>`;
  } else {
    wall.innerHTML = stories.map(v => `
      <article class="voice-card">
        <p class="voice-tag">${v.type}</p>
        <p class="voice-text">${escapeHTML(v.text)}</p>
        <p class="voice-name">— ${escapeHTML(v.name)}</p>
        <p class="voice-time">${formatDate(v.created_at)}</p>
      </article>
    `).join('');
  }

  // User-submitted poems get their own home in the poem section, not buried
  // in the general memories wall.
  const poems = voices.filter(v => v.type === 'কবিতা');
  const poemBox = document.getElementById('poemSubmissions');
  if (poemBox){
    poemBox.innerHTML = poems.length
      ? `<p class="eyebrow" style="text-align:center; margin-top:40px;">পাঠকদের পাঠানো কবিতা</p>` +
        poems.map(v => `
          <figure class="poem-card poem-card--reader">
            <blockquote>${escapeHTML(v.text).split('\n').map(l => `<p>${l}</p>`).join('')}</blockquote>
            <figcaption>— ${escapeHTML(v.name)}</figcaption>
          </figure>
        `).join('')
      : '';
  }
}

function wireShareForm(){
  const form = document.getElementById('shareForm');
  const note = document.getElementById('formNote');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = { type: fd.get('type'), name: fd.get('name'), text: fd.get('text') };
    note.textContent = 'পাঠানো হচ্ছে...';
    try{
      const res = await fetch(`${API}/voices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'কিছু ভুল হয়েছে।');
      note.textContent = 'ধন্যবাদ! আপনার গল্প ডেটাবেসে জমা হয়েছে।';
      showToast('✓ আপনার গল্প জমা হয়েছে');
      form.reset();
      await loadVoices();
      document.getElementById('voices').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch(err){
      note.textContent = `⚠️ ${err.message}`;
    }
  });
}

/* ================= Dynamic: gallery uploads via DB + disk ================= */
async function loadGallery(){
  const res = await fetch(`${API}/gallery`);
  const items = await res.json();
  renderGallery(items);
}

function renderGallery(items){
  const grid = document.getElementById('galleryGrid');
  const placeholders = [
    'সেন্ট্রাল বাস স্ট্যান্ডের রাতের আলোয় প্যান্ডেল',
    'কন্টাই শহরের ম্যাপ ও ক্রাউড ইনডিকেটর',
    'কড়কাই মৈত্রী সংসদ — হ্যান্ডিক্রাফট থিম',
  ];

  const uploaded = items.map(i => `
    <div class="gallery-item">
      <img src="${i.image_url}" alt="${escapeHTML(i.caption || 'পুজোর ছবি')}" loading="lazy">
      <div class="gallery-caption"><strong>${escapeHTML(i.submitted_by)}</strong>${escapeHTML(i.caption || '')}</div>
    </div>
  `).join('');

  const placeholderCards = placeholders.map(label => `<div class="gallery-item"><div class="gallery-caption" style="aspect-ratio:4/3; display:flex; align-items:center; justify-content:center; text-align:center;">${label}</div></div>`).join('');

  grid.innerHTML = uploaded + placeholderCards;
}

function wireUploadForm(){
  const form = document.getElementById('uploadForm');
  const note = document.getElementById('uploadNote');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    note.textContent = 'আপলোড হচ্ছে...';
    try{
      const res = await fetch(`${API}/gallery`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'আপলোড ব্যর্থ হয়েছে।');
      note.textContent = 'ছবি যোগ হয়েছে!';
      showToast('📸 ছবি গ্যালারিতে যোগ হয়েছে');
      form.reset();
      await loadGallery();
    } catch(err){
      note.textContent = `⚠️ ${err.message}`;
    }
  });
}

/* ================= Search & micro-interactions ================= */
let searchQuery = '';
function matchesPandalSearch(p){
  if(!searchQuery) return true;
  const haystack = [p.name,p.landmark,p.theme,p.history,p.route].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(searchQuery.toLowerCase());
}
function wirePandalSearch(){
  const input=document.getElementById('pandalSearch');
  const clear=document.getElementById('clearPandalSearch');
  if(!input) return;
  const run=()=>{ searchQuery=input.value.trim(); const active=document.querySelector('.zone-tab.is-active'); if(active) renderPandals(active.dataset.zone); };
  input.addEventListener('input',run);
  clear?.addEventListener('click',()=>{input.value='';run();input.focus();});
}
function wireBackToTop(){
  const btn=document.getElementById('backToTop'); if(!btn) return;
  const toggle=()=>btn.classList.toggle('is-visible',window.scrollY>520);
  window.addEventListener('scroll',toggle,{passive:true}); toggle();
  btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
}
function wirePujaMode(){
  const btn=document.getElementById('pujaModeBtn'); if(!btn) return;
  const saved=localStorage.getItem('contaiPujaMode')==='1';
  const set=(on)=>{document.body.classList.toggle('puja-mode',on);btn.classList.toggle('is-on',on);btn.setAttribute('aria-pressed',String(on));btn.innerHTML=on?'🪔 <span>পুজো মোড অন</span>':'🪔 <span>পুজো মোড</span>';localStorage.setItem('contaiPujaMode',on?'1':'0');};
  set(saved); btn.addEventListener('click',()=>set(!document.body.classList.contains('puja-mode')));
}


/* ================= Toast + hero parallax ================= */
function setupToast(){
  if(document.getElementById('pujaToast')) return;
  const el=document.createElement('div'); el.id='pujaToast'; el.className='puja-toast'; el.setAttribute('role','status'); el.setAttribute('aria-live','polite'); document.body.appendChild(el);
}
let toastTimer;
function showToast(message){
  const el=document.getElementById('pujaToast'); if(!el) return;
  el.textContent=message; el.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('is-visible'),2400);
}
function wireParallaxHero(){
  const hero=document.querySelector('.hero'); const figure=document.querySelector('.hero-figure'); if(!hero||!figure||window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ticking=false;
  const update=()=>{const r=hero.getBoundingClientRect();const shift=Math.max(-28,Math.min(28,-r.top*.045));figure.style.setProperty('--hero-shift',`${shift}px`);ticking=false;};
  window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(update);ticking=true;}},{passive:true}); update();
}


/* ================= Smart planner + passport + awards ================= */
function renderPlanner(){
  const list=document.getElementById('plannerList');
  const title=document.getElementById('plannerTitle');
  const summary=document.getElementById('plannerSummary');
  if(!list || !CONTENT?.pandals) return;
  const ids=[...new Set(PASSPORT.favourites)];
  const items=ids.map(id=>CONTENT.pandals.find(p=>p.id===id)).filter(Boolean);
  if(!items.length){
    list.innerHTML='<li class="planner-empty">এখনও কোনো ফেভারিট প্যান্ডেল নেই। ★ ফেভারিট চাপলে আপনার প্ল্যান এখানে দেখা যাবে।</li>';
    if(title) title.textContent='পুজো প্ল্যান তৈরি করুন';
    if(summary) summary.textContent='প্যান্ডেল সেকশনে ★ ফেভারিট চাপুন। আপনার পছন্দের প্যান্ডেলগুলো এখানে সাজানো হবে।';
    return;
  }
  if(title) title.textContent=`আপনার ${toBengaliDigits(items.length)}টি প্যান্ডেল প্রস্তুত`;
  if(summary) summary.textContent='ফেভারিটের ক্রমেই আপনার ব্যক্তিগত ভিজিট লিস্ট তৈরি হয়েছে।';
  list.innerHTML=items.map((p,i)=>`<li><span class="planner-number">${toBengaliDigits(i+1)}</span><div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.landmark)}</small></div><a href="${mapUrlFor(p)}" target="_blank" rel="noopener" aria-label="${escapeHTML(p.name)} গুগল ম্যাপে খুলুন">↗</a></li>`).join('');
}

function wireSmartPlanner(){
  renderPlanner();
  const near=document.getElementById('nearMeBtn');
  const directions=document.getElementById('planDirectionsBtn');
  const status=document.getElementById('plannerStatus');
  near?.addEventListener('click',()=>{
    if(!navigator.geolocation){ status.textContent='⚠️ এই ব্রাউজারে লোকেশন সুবিধা নেই।'; return; }
    status.textContent='📍 আপনার লোকেশন নেওয়া হচ্ছে…';
    navigator.geolocation.getCurrentPosition(pos=>{
      const firstId=PASSPORT.favourites[0] || CONTENT?.pandals?.[0]?.id;
      const p=CONTENT?.pandals?.find(x=>x.id===firstId);
      if(!p){status.textContent='একটি প্যান্ডেল বেছে নিন।';return;}
      const origin=`${pos.coords.latitude},${pos.coords.longitude}`;
      const url=`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(p.landmark+', Contai, West Bengal')}&travelmode=driving`;
      status.innerHTML=`<a href="${url}" target="_blank" rel="noopener">📍 লোকেশন পাওয়া গেছে — ${escapeHTML(p.name)}-এর দিকে ডিরেকশন খুলুন ↗</a>`;
      showToast('📍 লোকেশন প্রস্তুত');
    },()=>{status.textContent='⚠️ লোকেশন অনুমতি দেওয়া হয়নি। ব্রাউজারের address bar থেকে Location Allow করে আবার চেষ্টা করুন।';},{enableHighAccuracy:true,timeout:9000,maximumAge:60000});
  });
  directions?.addEventListener('click',()=>{
    const items=PASSPORT.favourites.map(id=>CONTENT?.pandals?.find(p=>p.id===id)).filter(Boolean);
    const stops=(items.length?items:CONTENT?.pandals?.slice(0,3) || []);
    if(!stops.length){showToast('একটি প্যান্ডেল বেছে নিন');return;}
    const destination=stops[stops.length-1];
    const waypoints=stops.slice(0,-1).map(p=>p.landmark+', Contai, West Bengal').join('|');
    const url=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.landmark+', Contai, West Bengal')}&waypoints=${encodeURIComponent(waypoints)}&travelmode=walking`;
    window.open(url,'_blank','noopener');
    showToast('🗺️ আপনার ভিজিট প্ল্যান খুলছে');
  });
}

function updateSmartPassport(){
  const grid=document.getElementById('passportStampGrid');
  const level=document.getElementById('passportLevel');
  const text=document.getElementById('passportLevelText');
  const bar=document.getElementById('smartLevelBar');
  const hint=document.getElementById('smartLevelHint');
  if(!grid||!CONTENT?.pandals) return;
  const total=CONTENT.pandals.length, visited=PASSPORT.visited.length;
  const levels=[{n:1,name:'Puja Explorer',need:1,badge:'🪔'},{n:2,name:'Pandal Seeker',need:3,badge:'🛕'},{n:3,name:'Sharod Explorer',need:6,badge:'✨'},{n:4,name:'Puja Pro',need:10,badge:'🏆'},{n:5,name:'Contai Legend',need:15,badge:'👑'}];
  let current=levels[0]; for(const l of levels) if(visited>=l.need) current=l;
  const next=levels.find(l=>visited<l.need);
  if(level) level.textContent=`${current.name} · Level ${current.n}`;
  if(text) text.textContent=`${toBengaliDigits(visited)} / ${toBengaliDigits(total)} প্যান্ডেল ভিজিট রেকর্ড হয়েছে।`;
  if(bar){ const target=next?.need || total || 1; const prev=current.need-1; const pct=Math.min(100,Math.max(0,((visited-prev)/(target-prev))*100)); bar.style.width=`${pct}%`; }
  if(hint) hint.textContent=next?`${toBengaliDigits(Math.max(0,next.need-visited))}টি ভিজিটে ${next.badge} ${next.name} ব্যাজ আনলক হবে।`:'🎉 সব ব্যাজ আনলক হয়েছে — আপনি Contai Legend!';
  const stamps=CONTENT.pandals.slice(0,Math.min(12,total));
  grid.innerHTML=stamps.map((p,i)=>`<span class="passport-stamp ${PASSPORT.visited.includes(p.id)?'is-earned':''}" title="${escapeHTML(p.name)}">${PASSPORT.visited.includes(p.id)?'✓':'🔒'}</span>`).join('');
}

const AWARD_CATEGORIES=[
  {id:'theme',title:'সেরা থিম',icon:'🎨'},
  {id:'decoration',title:'সেরা সাজসজ্জা',icon:'✨'},
  {id:'lighting',title:'সেরা আলো',icon:'💡'},
  {id:'people',title:'People’s Choice',icon:'❤️'}
];
function getAwardVotes(){try{return JSON.parse(localStorage.getItem('contaiAwardVotes')||'{}')}catch{return {}}}
function saveAwardVotes(v){localStorage.setItem('contaiAwardVotes',JSON.stringify(v));}
function wireAwards(){
  const grid=document.getElementById('awardsGrid'); if(!grid||!CONTENT?.pandals)return;
  const votes=getAwardVotes();
  grid.innerHTML=AWARD_CATEGORIES.map(cat=>{
    const ranked=CONTENT.pandals.map((p,i)=>({p,v:(votes[cat.id]?.[p.id]||0)+((LIKES[p.id]||0)*(cat.id==='people'?1:0))})).sort((a,b)=>b.v-a.v);
    const max=Math.max(1,...ranked.map(x=>x.v));
    return `<article class="award-card"><div class="award-head"><span>${cat.icon}</span><div><p class="eyebrow">CATEGORY</p><h3>${cat.title}</h3><small class="award-scroll-hint">← পাশে স্ক্রল করে সব প্যান্ডেল দেখুন →</small></div></div><div class="award-options" aria-label="${cat.title} প্যান্ডেল তালিকা">${ranked.map((x,i)=>`<button type="button" class="award-option ${votes[cat.id]?.[x.p.id]?'is-voted':''}" data-award="${cat.id}" data-award-pandal="${x.p.id}"><span class="award-thumb">${x.p.image?`<img src="${escapeHTML(x.p.image)}" alt="" loading="lazy">`:'🛕'}</span><span class="award-rank">${toBengaliDigits(i+1)}</span><span class="award-copy"><span class="award-name">${escapeHTML(x.p.name)}</span><span class="award-landmark">${escapeHTML(x.p.landmark||'কন্টাই')}</span><span class="award-meter"><i style="width:${Math.max(8,(x.v/max)*100)}%"></i></span></span><b class="award-votes">${toBengaliDigits(x.v)}</b></button>`).join('')}</div></article>`;
  }).join('');
  grid.querySelectorAll('[data-award]').forEach(btn=>btn.addEventListener('click',()=>{
    const cat=btn.dataset.award,id=btn.dataset.awardPandal; const v=getAwardVotes(); v[cat]??={};
    if(v[cat][id]){showToast('✓ এই ক্যাটেগরিতে আপনার ভোট আগেই আছে');return;}
    v[cat][id]=1; saveAwardVotes(v); renderAwards(); showToast('🏆 আপনার ভোট রেকর্ড হয়েছে');
  }));
}
function renderAwards(){wireAwards()}

function wireWelcomeExperience(){
  const overlay=document.getElementById('welcomeOverlay');
  const btn=document.getElementById('enterPujaBtn');
  const petals=document.getElementById('welcomePetals');
  if(!overlay||!btn)return;

  // Always show the welcome experience on every page visit/reload.
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden','false');

  // Create a light, elegant shower of shiuli/flower petals without images.
  if(petals && !petals.children.length){
    const symbols=['✿','❀','❁','✾','✽','•'];
    const count=window.matchMedia('(max-width:700px)').matches ? 18 : 28;
    for(let i=0;i<count;i++){
      const petal=document.createElement('span');
      petal.className='welcome-petal';
      petal.textContent=symbols[Math.floor(Math.random()*symbols.length)];
      petal.style.left=(Math.random()*100)+'%';
      petal.style.animationDelay=(Math.random()*3.8)+'s';
      petal.style.animationDuration=(5.5+Math.random()*5)+'s';
      petal.style.setProperty('--drift',(-70+Math.random()*140)+'px');
      petal.style.setProperty('--spin',(240+Math.random()*420)+'deg');
      petal.style.fontSize=(10+Math.random()*13)+'px';
      petals.appendChild(petal);
    }
  }

  const closeWelcome=()=>{
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden','true');
    setTimeout(()=>{ if(overlay.isConnected) overlay.remove(); },650);
    document.getElementById('pujaTheme')?.play().catch(()=>{});
  };
  btn.addEventListener('click',closeWelcome);
}

/* ================= Utils ================= */
function escapeHTML(str){
  return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleString('bn-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}


/* ================= Contact drawer ================= */
function wireContactDrawer(){
  const drawer=document.getElementById('contactDrawer');
  const tab=document.getElementById('contactTab');
  if(!drawer || !tab) return;
  tab.addEventListener('click',()=>{
    const open=drawer.classList.toggle('is-open');
    tab.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click',(e)=>{
    if(!drawer.contains(e.target)){
      drawer.classList.remove('is-open');
      tab.setAttribute('aria-expanded','false');
    }
  });
}
