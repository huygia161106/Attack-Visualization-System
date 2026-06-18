/**
 * ============================================================================
 * CYBER THREAT MAP
 * Architecture: Event-Driven, Geometry Caching, Throttled UI Rendering
 * ============================================================================
 */

/* ── 1. SYSTEM CONFIGURATION ─────────────────────────────────────────────── */
const API_BASE_URL  = 'https://strong-bulk-olive-text.trycloudflare.com/api/events';
const WS_URL        = 'wss://strong-bulk-olive-text.trycloudflare.com/ws/live';

const WS_RETRY_MS   = 3000;
const MAX_FEED_ROWS = 8;
const RENDER_INTERVAL_MS = 100;

// Danh sách trạm Honeypot toàn cầu
const HONEYPOT_LOOKUP = {
  // Châu Á - Thái Bình Dương
  "14.225.192.112": { lat: 10.8701, lng: 106.8031, label: "Vietnam" },
  "13.230.12.4":    { lat: 35.6762, lng: 139.6503, label: "Japan" },
  "52.74.12.5":     { lat: 1.3521, lng: 103.8198, label: "Singapore" },
  "139.130.4.5":    { lat: -33.8688, lng: 151.2093, label: "Australia" },
  "211.23.45.1":    { lat: 37.5665, lng: 126.9780, label: "South Korea" },
  "103.21.126.1":   { lat: 19.0760, lng: 72.8777,  label: "India" },
  "203.146.2.5":    { lat: 13.7563, lng: 100.5018, label: "Thailand" },
  "210.187.1.1":    { lat: 3.1390,  lng: 101.6869, label: "Malaysia" },
  "114.122.1.4":    { lat: -6.2088, lng: 106.8456, label: "Indonesia" },
  "112.198.1.1":    { lat: 14.5995, lng: 120.9842, label: "Philippines" },
  "1.160.1.2":      { lat: 25.0330, lng: 121.5654, label: "Taiwan" },
  "114.247.1.1":    { lat: 39.9042, lng: 116.4074, label: "China" },
  "101.227.1.1":    { lat: 31.2304, lng: 121.4737, label: "China" },
  "202.49.1.1":     { lat: -36.8485, lng: 174.7633, label: "New Zealand" },
  
  // Châu Mỹ
  "104.16.12.3":    { lat: 38.9072, lng: -77.0369, label: "USA" },
  "157.240.1.1":    { lat: 40.7128, lng: -74.0060, label: "USA" },
  "172.217.1.1":    { lat: 34.0522, lng: -118.2437, label: "USA" },
  "192.174.1.1":    { lat: 37.7749, lng: -122.4194, label: "USA" },
  "192.174.2.1":    { lat: 41.8781, lng: -87.6298, label: "USA" },
  "198.51.100.1":   { lat: 43.6532, lng: -79.3832, label: "Canada" },
  "199.60.1.1":     { lat: 49.2827, lng: -123.1207, label: "Canada" },
  "189.201.12.5":   { lat: 19.4326, lng: -99.1332, label: "Mexico" },
  "187.12.44.3":    { lat: -22.9068, lng: -43.1729, label: "Brazil" },
  "181.30.45.8":    { lat: -34.6037, lng: -58.3816, label: "Argentina" },
  "190.160.1.1":    { lat: -33.4489, lng: -70.6693, label: "Chile" },

  // Châu Âu & Trung Đông & Châu Phi
  "3.120.54.2":     { lat: 50.1109, lng: 8.6821,   label: "Germany" },
  "8.18.43.21":     { lat: 51.5074, lng: -0.1278,  label: "United Kingdom" },
  "192.99.12.4":    { lat: 48.8566, lng: 2.3522,   label: "France" },
  "93.147.2.3":     { lat: 41.9028, lng: 12.4964,  label: "Italy" },
  "212.170.1.4":    { lat: 40.4168, lng: -3.7038,  label: "Spain" },
  "145.100.2.1":    { lat: 52.3702, lng: 4.8952,   label: "Netherlands" },
  "193.10.1.2":     { lat: 59.3293, lng: 18.0686,  label: "Sweden" },
  "185.129.1.1":    { lat: 55.6761, lng: 12.5683,  label: "Denmark" },
  "135.181.1.1":    { lat: 60.1699, lng: 24.9384,  label: "Finland" },
  "158.37.1.1":     { lat: 59.9139, lng: 10.7522,  label: "Norway" },
  "130.59.1.1":     { lat: 47.3769, lng: 8.5417,   label: "Switzerland" },
  "149.156.1.1":    { lat: 52.2297, lng: 21.0122,  label: "Poland" },
  "193.170.1.1":    { lat: 48.2082, lng: 16.3738,  label: "Austria" },
  "194.65.1.1":     { lat: 38.7223, lng: -9.1393,  label: "Portugal" },
  "164.128.1.1":    { lat: 50.8503, lng: 4.3517,   label: "Belgium" },
  "95.161.2.1":     { lat: 55.7558, lng: 37.6173,  label: "Russia" },
  "176.235.10.4":   { lat: 41.0082, lng: 28.9784,  label: "Turkey" },
  "94.200.5.1":     { lat: 25.2048, lng: 55.2708,  label: "UAE" },
  "37.126.1.1":     { lat: 24.7136, lng: 46.6753,  label: "Saudi Arabia" },
  "147.235.1.1":    { lat: 32.0853, lng: 34.7818,  label: "Israel" },
  "156.200.1.1":    { lat: 30.0444, lng: 31.2357,  label: "Egypt" },
  "197.242.1.4":    { lat: -26.2041, lng: 28.0473, label: "South Africa" },
  "102.67.1.1":     { lat: 6.5244,  lng: 3.3792,   label: "Nigeria" },
  "196.201.1.1":    { lat: -1.2921, lng: 36.8219,  label: "Kenya" }
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
  'Unknown':             { arc: '#a0a0b0', hex: 0xa0a0b0, badge: '#a0a0b0' }
};


/* ── 2. DATA NORMALIZERS ─────────────────────────────────────────────────── */

function resolveType(raw) {
  if (!raw) return 'Unknown';
  const rawStr = String(raw).trim().toLowerCase();
  const foundKey = Object.keys(ATTACK_COLORS).find(k => rawStr.includes(k.toLowerCase()));
  return foundKey || 'Unknown';
}

function normalizeCountryName(rawName) {
  if (!rawName) return "Unknown";
  let cleanName = rawName.split('-')[0].trim();
  const upper = cleanName.toUpperCase();
  
  if (upper === "UNITED STATES" || upper === "US" || upper === "USA") return "USA";
  if (upper === "THE NETHERLANDS" || upper === "NETHERLANDS") return "Netherlands";
  if (upper === "UK" || upper === "UNITED KINGDOM") return "United Kingdom";
  
  return cleanName;
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


/* ── 3. STATE MANAGEMENT ─────────────────────────────────────────────────── */

let arcs = [];
const typeCounts = {};
const countryStats = {}; 
let totalAttacks = 0;
let eventBuffer = []; 

let activePanelCountry = null;
let isKasDropdownOpen = false;


/* ── 4. BACKGROUND & GLOBE INITIALIZATION ────────────────────────────────── */

function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  const stars = [];
  let W, H;
  
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize); resize();
  
  for (let i = 0; i < 280; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.2, a: Math.random(), da: (Math.random() - 0.5) * 0.004 });
  }
  
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

const globeContainer = document.getElementById('globe-container');
const globe = Globe()(globeContainer)
  .backgroundColor('rgba(0,0,0,0)')
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
  .showGraticules(false)
  .atmosphereColor('#1b1b24') 
  .atmosphereAltitude(0.1)
  .arcsData([])
  .arcStartLat(d => d.srcLat)
  .arcStartLng(d => d.srcLng)
  .arcEndLat(d => d.dstLat)
  .arcEndLng(d => d.dstLng)
  .arcColor(d => d.color)
  .arcAltitude(d => d.altitude)
  .arcStroke(d => d.stroke)
  .arcDashLength(0.8)
  .arcDashGap(2)
  .arcDashAnimateTime(d => d.animTime);

// Nạp bản đồ địa lý và Label
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(res => res.json())
  .then(countries => {
    globe.polygonsData(countries.features)
      .polygonCapColor(() => '#1f2025')
      .polygonSideColor(() => '#0a0a0c')
      .polygonStrokeColor(() => '#2b2c33')
      .polygonAltitude(0.012); 

    const labels = countries.features.map(f => {
      let pts = [];
      if (f.geometry.type === 'Polygon') pts = f.geometry.coordinates[0];
      else if (f.geometry.type === 'MultiPolygon') pts = f.geometry.coordinates[0][0];
      
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
      if (pts) {
        pts.forEach(p => {
          if (p[0] < minLng) minLng = p[0]; if (p[0] > maxLng) maxLng = p[0];
          if (p[1] < minLat) minLat = p[1]; if (p[1] > maxLat) maxLat = p[1];
        });
      }
      return { 
        lat: (minLat + maxLat) / 2, 
        lng: (minLng + maxLng) / 2, 
        text: f.properties.NAME, 
        pop: f.properties.POP_EST || 0 
      };
    }).sort((a, b) => b.pop - a.pop).slice(0, 80); 
    
    globe.labelsData(labels)
      .labelLat(d => d.lat)
      .labelLng(d => d.lng)
      .labelText(d => d.text)
      .labelSize(0.8)
      .labelDotRadius(0)
      .labelColor(() => 'rgba(255, 255, 255, 0.4)')
      .labelAltitude(0.035); // Đảm bảo chữ lơ lửng, không bị chìm
  });

globe.pointOfView({ altitude: 2.5 });
const controls = globe.controls();
controls.autoRotate = true; controls.autoRotateSpeed = 0.35;
controls.enableDamping = true; controls.dampingFactor = 0.08;

// Xử lý sự kiện điều hướng bản đồ
globeContainer.addEventListener('mousedown',  () => { controls.autoRotate = false; });
globeContainer.addEventListener('touchstart', () => { controls.autoRotate = false; }, { passive: true });
document.addEventListener('mouseup',  () => { controls.autoRotate = true; });
document.addEventListener('touchend', () => { controls.autoRotate = true; });
window.addEventListener('resize', () => globe.width(window.innerWidth).height(window.innerHeight));


/* ── 5. 3D HEXAGON ENGINE (GPU OPTIMIZED) ────────────────────────────────── */

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
  
  activeHexagons.push({ 
    mesh, 
    lat: lat + cfg.dLat, 
    lng: lng + cfg.dLng, 
    t0: Date.now() + (cfg.delay || 0), 
    dur: cfg.dur, 
    altStart: cfg.altStart, 
    altEnd: cfg.altEnd, 
    scaleEnd: cfg.scaleEnd, 
    fadeFrom: cfg.fadeFrom, 
    spin: cfg.spin 
  });
}

function spawnHexBurst(lat, lng, colorHex) {
  if (typeof THREE === 'undefined') return;
  
  // 1. Sóng xung kích (Shockwave) - Đã được thu nhỏ tinh tế hơn
  _spawnOneHex(lat, lng, colorHex, { 
    r: 0.4,           // Thu nhỏ bán kính gốc
    tube: 0.02,       // Viền mỏng lại
    delay: 0, 
    dLat: 0, dLng: 0, 
    dur: 700, 
    altStart: 0.013, 
    altEnd: 0.018, 
    scaleEnd: 4.5,    // Nở ra vừa phải
    fadeFrom: 0.2, 
    spin: 0 
  });

  // 2. Cột lục giác bay lên (Column Particles)
  const SIZES = [ 
    { r: 0.3, tube: 0.020 }, 
    { r: 0.6, tube: 0.035 }, 
    { r: 1.0, tube: 0.060 } 
  ];
  const WEIGHTS = [0.50, 0.35, 0.15]; 
  const TOTAL = 12 + Math.floor(Math.random() * 8); 

  for (let i = 0; i < TOTAL; i++) {
    const roll = Math.random(); 
    let si = 0; 
    let cumul = 0;
    
    for (let s = 0; s < WEIGHTS.length; s++) { 
      cumul += WEIGHTS[s]; 
      if (roll < cumul) { si = s; break; } 
    }
    
    const sz = SIZES[si];
    const delay = i * 45 + Math.random() * 25;    
    const spread = 0.35 + si * 0.15;              
    const dLat = (Math.random() - 0.5) * spread;
    const dLng = (Math.random() - 0.5) * spread;
    const altMax = 0.15 + si * 0.15 + Math.random() * 0.3; 

    _spawnOneHex(lat, lng, colorHex, { 
      r: sz.r, 
      tube: sz.tube, 
      delay, 
      dLat, 
      dLng, 
      dur: 1000 + Math.random() * 800, 
      altStart: 0.013, 
      altEnd: altMax, 
      scaleEnd: 1.5 + si * 0.5, 
      fadeFrom: 0.45 + Math.random() * 0.15, 
      spin: (Math.random() - 0.5) * 0.018 
    });
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

    if (t >= 1) { 
      globe.scene().remove(h.mesh); 
      h.mesh.material.dispose(); 
      activeHexagons.splice(i, 1); 
      continue; 
    }

    const e = 1 - Math.pow(1 - t, 4); // Ease-out quartic
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


/* ── 6. DATA PROCESSING & THROTTLING ─────────────────────────────────────── */

const lastBurstTime = {}; 

setInterval(() => {
  const now = Date.now();
  const prevA = arcs.length;
  
  // Xóa đạn rác đã bay xong
  arcs = arcs.filter(a => now < a.expireAt);
  if (arcs.length !== prevA) globe.arcsData([...arcs]);
  updateActiveThreats();
  
  // Xả Buffer từ từ để chống nghẽn GPU
  if (eventBuffer.length > 0) {
      const batch = eventBuffer.splice(0, 5); 
      batch.forEach(rawEvt => processAttackEvent(rawEvt));
  }
}, RENDER_INTERVAL_MS); 

function processAttackEvent(rawEvt) {
  const evt = normalizeEvent(rawEvt);
  const srcLat = parseFloat(evt.srcLat);
  const srcLng = parseFloat(evt.srcLng);
  if (isNaN(srcLat) || isNaN(srcLng)) return;

  // Tra cứu quốc gia đích
  let dstIp = String(evt.dstIp || '').trim();
  let dst = HONEYPOT_LOOKUP[dstIp] || HONEYPOT_LOOKUP[Object.keys(HONEYPOT_LOOKUP)[Math.floor(Math.random() * 5)]];
  
  const targetCountry = normalizeCountryName(dst.label); 
  const type = resolveType(evt.attackType);
  const colors = ATTACK_COLORS[type];
  const now = Date.now();
  
  const animTime = 700 + Math.random() * 400; 
  const impactTime = animTime * 0.8; 

  arcs.push({ 
    srcLat, srcLng, 
    dstLat: dst.lat, dstLng: dst.lng, 
    color: colors.arc, 
    altitude: 0.3 + Math.random() * 0.1, 
    stroke: 0.4 + Math.random() * 0.2, 
    animTime: animTime, 
    expireAt: now + animTime 
  });

  // Chống SPAM hiệu ứng cháy nổ (Debounce 800ms)
  setTimeout(() => {
    const burstNow = Date.now();
    if (!lastBurstTime[dstIp] || burstNow - lastBurstTime[dstIp] > 800) {
      spawnHexBurst(dst.lat, dst.lng, colors.hex);
      lastBurstTime[dstIp] = burstNow;
    }
  }, impactTime); 

  globe.arcsData([...arcs]);
  
  // Cập nhật số liệu State
  totalAttacks++; 
  typeCounts[type] = (typeCounts[type] || 0) + 1;
  
  // Render ra UI
  updateStatCounters(); 
  updateTopAttackBottomLeft();
  pushFeedEntry(evt, type, colors, rawEvt);
}


/* ── 7. UI UPDATES (HUD & KASPERSKY PANEL) ───────────────────────────────── */

function toggleKasPanel(show) {
  const panel = document.getElementById('kasPanel');
  const openBtn = document.getElementById('kpOpenBtn');
  
  if (show) {
    if (panel) panel.style.display = 'flex';
    if (openBtn) openBtn.style.display = 'none';
    updateKasperskyPanel();
  } else {
    if (panel) panel.style.display = 'none';
    if (openBtn) openBtn.style.display = 'block';
    isKasDropdownOpen = false;
    const dropdown = document.getElementById('kpDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
}

function toggleKasDropdown() {
  isKasDropdownOpen = !isKasDropdownOpen;
  document.getElementById('kpDropdown').classList.toggle('show', isKasDropdownOpen);
}

function resetKasPanel() {
  activePanelCountry = null;
  updateKasperskyPanel();
}

function selectKasCountry(countryName) {
  activePanelCountry = countryName;
  isKasDropdownOpen = false;
  document.getElementById('kpDropdown').classList.remove('show');
  updateKasperskyPanel(); 
}

function updateKasperskyPanel() {
  const panel = document.getElementById('kasPanel');
  if (!panel || panel.style.display === 'none') return;

  const sortedCountries = Object.entries(countryStats).sort((a, b) => b[1].total - a[1].total);
  if (sortedCountries.length === 0) return;

  if (!activePanelCountry) {
    activePanelCountry = sortedCountries[0][0]; 
  }

  let currentRank = 0;
  let currentData = { total: 0, types: {} };
  
  for (let i = 0; i < sortedCountries.length; i++) {
    if (sortedCountries[i][0] === activePanelCountry) {
      currentRank = i + 1;
      currentData = sortedCountries[i][1];
      break;
    }
  }

  document.getElementById('kpCountryName').textContent = activePanelCountry;
  document.getElementById('kpRank').textContent = `# ${currentRank} MOST-ATTACKED COUNTRY`;

  const alphabetCountries = Object.keys(countryStats).sort((a, b) => a.localeCompare(b));
  document.getElementById('kpDropdown').innerHTML = alphabetCountries.map(cName => {
    return `<li onclick="selectKasCountry('${cName}')">${cName}</li>`;
  }).join('');

  const sortedTypes = Object.entries(currentData.types).sort((a, b) => b[1] - a[1]);
  document.getElementById('kpStatsList').innerHTML = sortedTypes.map(([tName, tCount]) => {
    const color = ATTACK_COLORS[tName] ? ATTACK_COLORS[tName].badge : '#a0a0b0';
    return `
      <div class="kp-stat-item">
        <span class="kp-stat-name" style="color: ${color}">${tName}</span>
        <span class="kp-stat-value">${tCount.toLocaleString()}</span>
      </div>
    `;
  }).join('');
}

const elAttackCount   = document.getElementById('attackCount');
const elActiveThreats = document.getElementById('activeThreats');
const elTopAttack     = document.getElementById('topAttack');
const feedList        = document.getElementById('feedList');

const bumpStat = (el, v) => { 
  el.textContent = v; 
  el.classList.remove('bump'); 
  void el.offsetWidth; 
  el.classList.add('bump'); 
  setTimeout(() => el.classList.remove('bump'), 200); 
};

const updateStatCounters = () => bumpStat(elAttackCount, totalAttacks.toLocaleString());
const updateActiveThreats = () => { elActiveThreats.textContent = arcs.length; };

function updateTopAttackBottomLeft() {
  let topType = '-', topCount = 0;
  for (const [k, v] of Object.entries(typeCounts)) { 
    if (v > topCount) { topType = k; topCount = v; } 
  }
  elTopAttack.textContent = topType;
}

const pushFeedEntry = (evt, type, colors, rawEvt) => {
  const srcIp = evt.srcIp || rawEvt.srcIp || '?';
  const dstIp = evt.dstIp || rawEvt.dstIp || '?';
  const origin = [evt.city, evt.country].filter(Boolean).join(', ') || srcIp;
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  
  const entry = document.createElement('div');
  entry.className = 'feed-entry';
  entry.innerHTML = `
    <span class="feed-type-badge" style="color: ${colors.badge}; border-color: ${colors.badge}33; background: ${colors.badge}11;">
      ${type}
    </span>
    <div class="feed-meta">
      <span class="feed-origin" title="${origin}">${origin}</span>
      <span class="feed-ip" title="${srcIp} → ${dstIp}">${srcIp} &rarr; ${dstIp}</span>
    </div>
    <span class="feed-time">${time}</span>
  `;
  feedList.prepend(entry);
  
  if (feedList.querySelectorAll('.feed-entry').length > MAX_FEED_ROWS) {
    const oldest = feedList.lastChild; 
    oldest.classList.add('fade-out'); 
    setTimeout(() => oldest.remove(), 450);
  }
};


/* ── 8. SYSTEM INITIALIZATION & WEBSOCKET ────────────────────────────────── */

async function fetchInitialStatsForMap() {
  try {
    const t = new Date().getTime();
    for (const key in countryStats) delete countryStats[key];
    for (const key in typeCounts) delete typeCounts[key];
    totalAttacks = 0;
    
    // 1. Fetch Global Stats
    const resStats = await fetch(`${API_BASE_URL}/stats?t=${t}`, { cache: "no-store" });
    if (resStats.ok) {
      const data = await resStats.json();
      if (data.totalEvents) totalAttacks = data.totalEvents;
      if (data.attackTypes) {
        data.attackTypes.forEach(typeObj => { 
          const typeName = resolveType(typeObj.type || typeObj.attack_type); 
          typeCounts[typeName] = (typeCounts[typeName] || 0) + typeObj.count; 
        });
      }
    }

    // 2. Fetch Detailed Country Stats from Redis
    const resRedis = await fetch(`${API_BASE_URL}/stats/redis?t=${t}`, { cache: "no-store" });
    if (resRedis.ok) {
      const dataR = await resRedis.json();
      for (const country in dataR) {
        if (country === "WORLD") continue; 
        
        let cleanCountry = normalizeCountryName(country);
        if (!countryStats[cleanCountry]) countryStats[cleanCountry] = { total: 0, types: {} };
        
        for (const rawType in dataR[country]) {
          const typeName = resolveType(rawType);
          const count = parseInt(dataR[country][rawType]) || 0;
          
          countryStats[cleanCountry].types[typeName] = (countryStats[cleanCountry].types[typeName] || 0) + count;
          countryStats[cleanCountry].total += count; 
        }
      }
    }

    // Refresh UI
    updateStatCounters(); 
    updateTopAttackBottomLeft();
    updateKasperskyPanel(); 
  } catch (e) { console.warn('[Map] Initial Sync failed.', e); }
}

const elDot = document.getElementById('statusDot');
const elText = document.getElementById('statusText');
let ws = null, retryTimer = null, reconnecting = false;

function setStatus(state) { 
  elDot.className = `status-dot ${state}`; 
  elText.textContent = ({ '': 'CONNECTING...', connected: 'LIVE', error: 'DISCONNECTED' })[state] || state; 
}

function connectWebSocket() {
  if (ws && ws.readyState < 2) ws.close();
  setStatus('');
  ws = new WebSocket(WS_URL);
  
  ws.onopen = () => { 
    setStatus('connected'); 
    reconnecting = false; 
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } 
  };
  
  ws.onmessage = (ev) => { 
    try { 
        let parsed = JSON.parse(ev.data); 
        let events = Array.isArray(parsed) ? parsed : [parsed];
        
        eventBuffer.push(...events);
        
        // Anti-Memory Leak Mechanism
        if (eventBuffer.length > 200) {
            eventBuffer = eventBuffer.slice(-200);
        }
    } catch(e) {} 
  };
  
  ws.onclose = () => { 
    if (!reconnecting) { 
      reconnecting = true; 
      setStatus('error'); 
      retryTimer = setTimeout(() => { reconnecting = false; connectWebSocket(); }, WS_RETRY_MS); 
    } 
  };
  
  ws.onerror = () => { ws.close(); };
}

// ── BOOT SEQUENCE ──
fetchInitialStatsForMap();
connectWebSocket();

// 🔥 THÊM ĐOẠN NÀY VÀO CUỐI FILE
// Đồng bộ số liệu Bảng Kaspersky với Redis mỗi 5 giây
setInterval(() => {
    // Lưu ý: Cần điều chỉnh nhẹ hàm fetchInitialStatsForMap để reset countryStats trước khi nạp lại
    // Tránh bị cộng dồn chồng chéo dữ liệu cũ và mới
    for (const key in countryStats) delete countryStats[key]; 
    for (const key in typeCounts) delete typeCounts[key];
    
    fetchInitialStatsForMap();
}, 5000);
