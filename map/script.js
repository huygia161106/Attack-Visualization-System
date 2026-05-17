/**
 * ============================================================
 * CYBER THREAT MAP — script.js
 * Globe.gl · v4.1 (Integrated RAM Protection & Queue Batching)
 * ============================================================
 */

// ==============================================================
// CẤU HÌNH KẾT NỐI ONLINE (CLOUDFLARE TUNNEL)
// ==============================================================
const CF_URL = 'ultram-short-repository-gradually.trycloudflare.com';

const API_BASE_URL  = `https://${CF_URL}/api/events`;
const WS_URL        = `wss://${CF_URL}/ws/live`;
const WS_RETRY_MS   = 3000;
const MAX_FEED_ROWS = 8;

const HONEYPOT_LOOKUP = {
  "14.225.192.112": { lat: 10.8701, lng: 106.8031, label: "Vietnam" },
  "104.16.12.3":    { lat: 38.9072, lng: -77.0369, label: "United States" },
  "3.120.54.2":     { lat: 50.1109, lng: 8.6821, label: "Germany" },
  "13.230.12.4":    { lat: 35.6762, lng: 139.6503, label: "Japan" },
  "52.74.12.5":     { lat: 1.3521, lng: 103.8198, label: "Singapore" }
};

const ATTACK_COLORS = {
  'Port Scan':           { arc: '#00d4ff', hex: 0x00d4ff, badge: '#00d4ff' },
  'Zero-Day Attack':     { arc: '#ff2442', hex: 0xff2442, badge: '#ff2442' },
  'Ransomware':          { arc: '#ffaa00', hex: 0xffaa00, badge: '#ffaa00' },
  'SSH Brute-force':     { arc: '#a855f7', hex: 0xa855f7, badge: '#a855f7' },
  'SQL Injection':       { arc: '#00ff88', hex: 0x00ff88, badge: '#00ff88' },
  'Credential Stuffing': { arc: '#ff6432', hex: 0xff6432, badge: '#ff6432' },
  'XSS Exploit':         { arc: '#3b82f6', hex: 0x3b82f6, badge: '#3b82f6' },
  'DDoS':                { arc: '#ec4899', hex: 0xec4899, badge: '#ec4899' },
  'Malware Infection':   { arc: '#14b8a6', hex: 0x14b8a6, badge: '#14b8a6' },
  'Unknown':             { arc: '#a0a0b0', hex: 0xa0a0b0, badge: '#a0a0b0' },
};

function resolveType(raw) {
  if (!raw) return 'Unknown';
  const rawStr = String(raw).trim().toLowerCase();
  const foundKey = Object.keys(ATTACK_COLORS).find(k => rawStr.includes(k.toLowerCase()));
  return foundKey || 'Unknown';
}

function normalizeEvent(raw) {
  const isArrayFrom = Array.isArray(raw.from) && raw.from.length >= 2;
  const pick = (...keys) => keys.map(k => raw[k]).find(v => v !== undefined && v !== null);
  return {
    srcIp:      pick('ip', 'srcIp', 'sourceIp'),
    dstIp:      pick('dstIp', 'targetIp'),
    attackType: pick('type', 'attackType'),
    srcLat:     isArrayFrom ? raw.from[1] : pick('srcLat', 'lat'),
    srcLng:     isArrayFrom ? raw.from[0] : pick('srcLng', 'lng', 'lon'),
    country:    pick('fromCountry', 'country', 'srcCountry'),
    city:       pick('fromCity', 'city', 'srcCity'),
  };
}

let arcs = [];
const typeCounts = {};
let totalAttacks = 0;

/* 🔥 TÍCH HỢP LOGIC: Hàng đợi đạn (Event Buffer) */
let eventBuffer = [];

/* ────────────────────────────────────────────────────────────
   STARFIELD NỀN
──────────────────────────────────────────────────────────── */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const stars = [];
  let W, H;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize); resize();
  for (let i = 0; i < 280; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, a: Math.random(), da: (Math.random() - 0.5) * 0.004 });
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.a = Math.max(0.05, Math.min(0.95, s.a + s.da));
      if (s.a <= 0.05 || s.a >= 0.95) s.da *= -1;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(160,230,255,${s.a})`; ctx.fill();
    });
    requestAnimationFrame(tick);
  };
  tick();
}
initStarfield();

/* ────────────────────────────────────────────────────────────
   GLOBE KHỞI TẠO
──────────────────────────────────────────────────────────── */
const globeContainer = document.getElementById('globe-container');
const globe = Globe()(globeContainer)
  .backgroundColor('rgba(0,0,0,0)')
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
  .showGraticules(false)
  .atmosphereColor('#1b1b24') 
  .atmosphereAltitude(0.1)
  .arcsData([])
  .arcStartLat(d => d.srcLat).arcStartLng(d => d.srcLng)
  .arcEndLat(d => d.dstLat).arcEndLng(d => d.dstLng)
  .arcColor(d => d.color).arcAltitude(d => d.altitude)
  .arcStroke(d => d.stroke).arcDashLength(0.8).arcDashGap(2).arcDashAnimateTime(d => d.animTime);

fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(res => res.json())
  .then(countries => {
    globe.polygonsData(countries.features)
      .polygonCapColor(() => '#1f2025').polygonSideColor(() => '#0a0a0c')
      .polygonStrokeColor(() => '#2b2c33').polygonAltitude(0.012); 

    const labels = countries.features.map(f => {
      let pts = [];
      if (f.geometry.type === 'Polygon') pts = f.geometry.coordinates[0];
      else if (f.geometry.type === 'MultiPolygon') pts = f.geometry.coordinates[0][0];
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
      if (pts) pts.forEach(p => {
          if (p[0] < minLng) minLng = p[0]; if (p[0] > maxLng) maxLng = p[0];
          if (p[1] < minLat) minLat = p[1]; if (p[1] > maxLat) maxLat = p[1];
      });
      return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2, text: f.properties.NAME, pop: f.properties.POP_EST || 0 };
    }).sort((a, b) => b.pop - a.pop).slice(0, 80); 
    
    globe.labelsData(labels)
      .labelLat(d => d.lat).labelLng(d => d.lng).labelText(d => d.text)
      .labelSize(0.8).labelDotRadius(0).labelColor(() => 'rgba(255, 255, 255, 0.4)').labelAltitude(0.016);
  });

globe.pointOfView({ altitude: 2.5 });
const controls = globe.controls();
controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
controls.enableDamping = true; controls.dampingFactor = 0.08;

globeContainer.addEventListener('mousedown',  () => { controls.autoRotate = false; });
globeContainer.addEventListener('touchstart', () => { controls.autoRotate = false; }, { passive: true });
document.addEventListener('mouseup',  () => { controls.autoRotate = true; });
document.addEventListener('touchend', () => { controls.autoRotate = true; });
window.addEventListener('resize', () => globe.width(window.innerWidth).height(window.innerHeight));

/* ────────────────────────────────────────────────────────────
   ENGINE LỤC GIÁC 
──────────────────────────────────────────────────────────── */
const activeHexagons = [];
const geoCache = {}; 
function getHexGeometry(r, tube) {
  const key = `${r}_${tube}`;
  if (!geoCache[key]) geoCache[key] = new THREE.TorusGeometry(r, tube, 2, 6);
  return geoCache[key];
}

function _spawnOneHex(lat, lng, colorHex, cfg) {
  if (typeof THREE === 'undefined') return;
  const geo = getHexGeometry(cfg.r, cfg.tube); 
  const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 1 });
  const mesh = new THREE.Mesh(geo, mat);
  globe.scene().add(mesh);
  activeHexagons.push({ mesh, lat: lat + cfg.dLat, lng: lng + cfg.dLng, t0: Date.now() + (cfg.delay || 0), dur: cfg.dur, altStart: cfg.altStart, altEnd: cfg.altEnd, scaleEnd: cfg.scaleEnd, fadeFrom: cfg.fadeFrom, spin: cfg.spin });
}

function spawnHexBurst(lat, lng, colorHex) {
  if (typeof THREE === 'undefined') return;
  _spawnOneHex(lat, lng, colorHex, { r: 0.8, tube: 0.03, delay: 0, dLat: 0, dLng: 0, dur: 700, altStart: 0.013, altEnd: 0.018, scaleEnd: 8.0, fadeFrom: 0.2, spin: 0 });

  const SIZES = [ { r: 0.4, tube: 0.025 }, { r: 0.8, tube: 0.045 }, { r: 1.5, tube: 0.070 } ];
  const WEIGHTS = [0.50, 0.35, 0.15]; 
  const TOTAL = 12 + Math.floor(Math.random() * 8); 

  for (let i = 0; i < TOTAL; i++) {
    const roll = Math.random(); let si = 0; let cumul = 0;
    for (let s = 0; s < WEIGHTS.length; s++) { cumul += WEIGHTS[s]; if (roll < cumul) { si = s; break; } }
    const sz = SIZES[si];
    const delay = i * 45 + Math.random() * 25;    
    const spread = 0.35 + si * 0.15;              
    const dLat = (Math.random() - 0.5) * spread;
    const dLng = (Math.random() - 0.5) * spread;
    const altMax = 0.15 + si * 0.15 + Math.random() * 0.3; 

    _spawnOneHex(lat, lng, colorHex, { r: sz.r, tube: sz.tube, delay, dLat, dLng, dur: 1000 + Math.random() * 800, altStart: 0.013, altEnd: altMax, scaleEnd: 1.5 + si * 0.5, fadeFrom: 0.45 + Math.random() * 0.15, spin: (Math.random() - 0.5) * 0.018 });
  }
}

function animateHexagons() {
  const now = Date.now();
  for (let i = activeHexagons.length - 1; i >= 0; i--) {
    const h = activeHexagons[i];
    if (now < h.t0) { h.mesh.visible = false; continue; }
    h.mesh.visible = true;
    const elapsed = now - h.t0;
    const t = Math.min(elapsed / h.dur, 1);

    if (t >= 1) { globe.scene().remove(h.mesh); h.mesh.material.dispose(); activeHexagons.splice(i, 1); continue; }

    const e = 1 - Math.pow(1 - t, 4);
    const alt = h.altStart + e * (h.altEnd - h.altStart);
    const pos = globe.getCoords(h.lat, h.lng, alt);
    h.mesh.position.set(pos.x, pos.y, pos.z);
    h.mesh.lookAt(new THREE.Vector3(0, 0, 0));
    if (h.spin !== 0) h.mesh.rotateZ(h.spin);

    const sc = 1 + e * (h.scaleEnd - 1);
    h.mesh.scale.set(sc, sc, sc);
    h.mesh.material.opacity = Math.max(0, t >= h.fadeFrom ? 1 - Math.pow((t - h.fadeFrom) / (1 - h.fadeFrom), 1.6) : 1);
  }
  requestAnimationFrame(animateHexagons);
}
animateHexagons();

/* ────────────────────────────────────────────────────────────
   XÓA ĐẠN RÁC & CƠ CHẾ XỬ LÝ HÀNG ĐỢI
──────────────────────────────────────────────────────────── */
const lastBurstTime = {}; 

setInterval(() => {
  const now = Date.now();
  const prevA = arcs.length;
  arcs = arcs.filter(a => now < a.expireAt);
  if (arcs.length !== prevA) globe.arcsData([...arcs]);
  updateActiveThreats();
  
  // 🔥 Lấy đạn từ Buffer ra bắn từ từ để không lag GPU
  if (eventBuffer.length > 0) {
      const batch = eventBuffer.splice(0, 5); // Xả 5 viên đạn mỗi 100ms
      batch.forEach(rawEvt => processAttackEvent(rawEvt));
  }
}, 100); 

function processAttackEvent(rawEvt) {
  const evt = normalizeEvent(rawEvt);
  const srcLat = parseFloat(evt.srcLat);
  const srcLng = parseFloat(evt.srcLng);
  if (isNaN(srcLat) || isNaN(srcLng)) return;

  let dstIp = String(evt.dstIp || '').trim();
  let dst = HONEYPOT_LOOKUP[dstIp] || HONEYPOT_LOOKUP[Object.keys(HONEYPOT_LOOKUP)[Math.floor(Math.random() * 5)]];
  
  const type = resolveType(evt.attackType);
  const colors = ATTACK_COLORS[type];
  const now = Date.now();
  
  const animTime = 700 + Math.random() * 400; 
  const impactTime = animTime * 0.8; 

  arcs.push({ srcLat, srcLng, dstLat: dst.lat, dstLng: dst.lng, color: colors.arc, altitude: 0.3 + Math.random() * 0.1, stroke: 0.4 + Math.random() * 0.2, animTime: animTime, expireAt: now + animTime });

  setTimeout(() => {
    const burstNow = Date.now();
    if (!lastBurstTime[dstIp] || burstNow - lastBurstTime[dstIp] > 800) {
      spawnHexBurst(dst.lat, dst.lng, colors.hex);
      lastBurstTime[dstIp] = burstNow;
    }
  }, impactTime); 

  globe.arcsData([...arcs]);
  totalAttacks++; typeCounts[type] = (typeCounts[type] || 0) + 1;
  updateStatCounters(); updateLegendCounts(); pushFeedEntry(evt, type, colors, rawEvt);
}

/* ────────────────────────────────────────────────────────────
   CẬP NHẬT GIAO DIỆN
──────────────────────────────────────────────────────────── */
const elAttackCount   = document.getElementById('attackCount');
const elActiveThreats = document.getElementById('activeThreats');
const elTopAttack     = document.getElementById('topAttack');
const feedList        = document.getElementById('feedList');

const bumpStat = (el, v) => { el.textContent = v; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 200); };
const updateStatCounters = () => bumpStat(elAttackCount, totalAttacks.toLocaleString());
const updateActiveThreats = () => { elActiveThreats.textContent = arcs.length; };

const updateLegendCounts = () => {
  let topType = '-', topCount = 0;
  for (const [k, v] of Object.entries(typeCounts)) { if (v > topCount) { topType = k; topCount = v; } }
  elTopAttack.textContent = topType;
  document.querySelectorAll('.legend-count').forEach(el => { el.textContent = (typeCounts[el.dataset.type] || 0).toLocaleString(); });
};

const pushFeedEntry = (evt, type, colors, rawEvt) => {
  const srcIp = evt.srcIp || rawEvt.srcIp || '?';
  const dstIp = evt.dstIp || rawEvt.dstIp || '?';
  const origin = [evt.city, evt.country].filter(Boolean).join(', ') || srcIp;
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  const entry = document.createElement('div');
  entry.className = 'feed-entry';
  entry.innerHTML = `<span class="feed-type-badge" style="color: ${colors.badge}; border-color: ${colors.badge}33; background: ${colors.badge}11;">${type}</span><div class="feed-meta"><span class="feed-origin" title="${origin}">${origin}</span><span class="feed-ip" title="${srcIp} → ${dstIp}">${srcIp} &rarr; ${dstIp}</span></div><span class="feed-time">${time}</span>`;
  feedList.prepend(entry);
  if (feedList.querySelectorAll('.feed-entry').length > MAX_FEED_ROWS) {
    const oldest = feedList.lastChild; oldest.classList.add('fade-out'); setTimeout(() => oldest.remove(), 450);
  }
};

function initLegend() {
  const container = document.getElementById('legendItems');
  Object.entries(ATTACK_COLORS).forEach(([type, c]) => {
    const row = document.createElement('div'); row.className = 'legend-row';
    row.innerHTML = `<div class="legend-swatch" style="background: ${c.arc}; box-shadow: 0 0 6px ${c.arc}88;"></div><span class="legend-label">${type}</span><span class="legend-count" data-type="${type}">0</span>`;
    container.appendChild(row);
  });
}
initLegend();

/* 🔥 TÍCH HỢP LOGIC: Thêm tham số chống Cache */
async function fetchInitialStatsForMap() {
  try {
    const t = new Date().getTime();
    const res = await fetch(`${API_BASE_URL}/stats?t=${t}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.totalEvents) totalAttacks = data.totalEvents;
    if (data.attackTypes) data.attackTypes.forEach(t => { const typeName = resolveType(t.type || t.attack_type); typeCounts[typeName] = (typeCounts[typeName] || 0) + t.count; });
    updateStatCounters(); updateLegendCounts();
  } catch (e) { console.warn('[Map] Sync failed.'); }
}
fetchInitialStatsForMap();

/* WEBSOCKET VỚI EVENT BUFFER CỦA BẠN BẠN */
const elDot = document.getElementById('statusDot');
const elText = document.getElementById('statusText');
let ws = null, retryTimer = null, reconnecting = false;
const setStatus = (state) => { elDot.className = `status-dot ${state}`; elText.textContent = ({ '': 'CONNECTING...', connected: 'LIVE', error: 'DISCONNECTED' })[state] || state; };

function connectWebSocket() {
  if (ws && ws.readyState < 2) ws.close();
  setStatus('');
  ws = new WebSocket(WS_URL);
  ws.onopen = () => { setStatus('connected'); reconnecting = false; if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } };
  
  ws.onmessage = (ev) => { 
    try { 
        let parsed = JSON.parse(ev.data); 
        let events = Array.isArray(parsed) ? parsed : [parsed];
        
        // Nhồi đạn vào Buffer thay vì ném thẳng ra UI
        eventBuffer.push(...events);
        
        // Chống tràn RAM nếu treo tab ẩn quá lâu (Logic bảo vệ tuyệt vời)
        if (eventBuffer.length > 200) {
            eventBuffer = eventBuffer.slice(-200);
        }
    } catch(e) {} 
  };
  
  ws.onclose = () => { if (!reconnecting) { reconnecting = true; setStatus('error'); retryTimer = setTimeout(() => { reconnecting = false; connectWebSocket(); }, WS_RETRY_MS); } };
  ws.onerror = () => { ws.close(); };
}
connectWebSocket();

console.info('Cyber Threat Map v4.5 - Cloudflare Ready & Integrated RAM Protection');
