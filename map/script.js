const chart = echarts.init(document.getElementById('map'));

let mapAttacks = []; 
let logAttacks = []; 
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

function getColorByType(type) {
    if (!type) return '#00f0ff'; 
    const t = type.toLowerCase();
    if (t.includes('infection') || t.includes('malware') || t.includes('ransomware') || t.includes('zero')) return '#ff3333'; 
    if (t.includes('ddos') || t.includes('flood') || t.includes('stuffing')) return '#ffaa00'; 
    if (t.includes('scan') || t.includes('brute') || t.includes('sqli')) return '#00ff66'; 
    return '#00f0ff'; 
}

chart.setOption({
    backgroundColor: 'transparent',
    geo: {
        map: 'world',
        roam: true,
        zoom: 1.2,
        scaleLimit: { min: 1.2, max: 8 },
        top: '15%',
        itemStyle: { areaColor: '#0a1d33', borderColor: '#00f0ff33' },
        emphasis: { label: { show: false }, itemStyle: { areaColor: '#123152' } }
    },
    series: []
});

function updateDashboard() {
    chart.setOption({
        series: [
            {
                type: 'lines',
                coordinateSystem: 'geo',
                zlevel: 1,
                z: 2,
                animation: false,
                effect: { 
                    show: true, 
                    period: 4,           
                    trailLength: 0.4,    
                    symbol: 'circle',    
                    symbolSize: 3,
                    loop: false          
                },
                lineStyle: {
                    width: 1.5,
                    opacity: 0,          
                    curveness: 0.3       
                },
                // 🔥 LẤY ĐÚNG OBJECT GỐC RA VẼ, KHÔNG TẠO BẢN SAO MỚI NỮA
                data: mapAttacks.map(a => a.lineData)
            },
            {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                zlevel: 2,
                z: 3,
                animation: false,
                rippleEffect: { brushType: 'stroke', scale: 2.5 },
                symbolSize: 4,
                // 🔥 LẤY ĐÚNG OBJECT GỐC RA VẼ
                data: mapAttacks.flatMap(a => [a.scatterSrc, a.scatterDst])
            }
        ]
    });

    if(countrySelect) {
        const selectedCountry = countrySelect.value;
        const stats = globalStats[selectedCountry] || {};
        const contentDiv = document.getElementById('stats-content');
        
        if (contentDiv) {
            if (Object.keys(stats).length === 0) {
                contentDiv.innerHTML = `<div style="text-align:center; color:#555;">Đang chờ dữ liệu...</div>`;
            } else {
                const sortedStats = Object.entries(stats).sort((a, b) => b[1] - a[1]);
                contentDiv.innerHTML = sortedStats.map(([type, count]) => `
                    <div class="stat-row">
                        <span class="stat-type" style="color: ${getColorByType(type)}">${type}</span>
                        <span class="stat-count">${count}</span>
                    </div>
                `).join('');
            }
        }
    }

    const timelineDiv = document.getElementById('timeline');
    if (timelineDiv) {
        timelineDiv.innerHTML = logAttacks.slice(-20).reverse().map(a => `
            <div class="event" style="border-left-color: ${getColorByType(a.type)}">
                <span class="time">${a.time}</span>
                <div class="route">${a.fromCountry} ➔ ${a.toCountry}</div>
                <div class="ip">IP: ${a.ip}</div>
                <div class="type" style="color: ${getColorByType(a.type)}">${a.type}</div>
            </div>
        `).join('');
    }
}

try {
    fetch('http://localhost:8080/api/events/stats/redis')
        .then(response => response.json())
        .then(data => {
            if (data && Object.keys(data).length > 0) {
                for (const country in data) {
                    if (!globalStats[country]) globalStats[country] = {};
                    for (const type in data[country]) {
                        globalStats[country][type] = parseInt(data[country][type]);
                    }
                }
                updateDashboard();
            }
        })
        .catch(error => console.error("Lỗi nạp Redis:", error));
} catch(e) { console.error(e); }

const socket = new WebSocket('ws://localhost:8080/ws/live');

socket.onmessage = function(event) {
    if (document.hidden) return; 
    try {
        const attackList = JSON.parse(event.data);
        eventBuffer.push(...attackList); 
    } catch (error) {}
};

setInterval(() => {
    if (document.hidden || eventBuffer.length === 0) return;

    const batch = eventBuffer.splice(0, 8); 

    batch.forEach(a => {
        a.time = new Date().toLocaleTimeString();
        a.uid = Math.random().toString(36).substr(2, 9);
        
        const dest = a.toCountry;
        const type = a.type || "Botnet";
        const color = getColorByType(type);
        
        globalStats["WORLD"][type] = (globalStats["WORLD"][type] || 0) + 1;
        if (globalStats[dest]) {
            globalStats[dest][type] = (globalStats[dest][type] || 0) + 1;
        }

        // 🔥 ĐÓNG GÓI SẴN OBJECT ECHARTS 1 LẦN DUY NHẤT LÚC ĐẠN MỚI SINH RA
        a.lineData = {
            id: 'line_' + a.uid,
            coords: [a.from, a.to],
            lineStyle: { color: color }
        };
        a.scatterSrc = {
            id: 'src_' + a.uid,
            value: [...a.from, 1],
            itemStyle: { color: color }
        };
        a.scatterDst = {
            id: 'dst_' + a.uid,
            value: [...a.to, 1],
            itemStyle: { color: color }
        };

        logAttacks.push(a);
        if (logAttacks.length > MAX_LOGS) logAttacks.shift();

        mapAttacks.push(a);
        if (mapAttacks.length > MAX_ACTIVE_LINES) mapAttacks.shift();

        setTimeout(() => {
            mapAttacks = mapAttacks.filter(line => line.uid !== a.uid);
            if (!isRoaming && !document.hidden) updateDashboard();
        }, ATTACK_LIFETIME);
    });

    if (!isRoaming) updateDashboard();

}, RENDER_INTERVAL);

let isRoaming = false;
let roamEndTimer = null;
chart.on('georoam', function() {
    isRoaming = true;
    if (roamEndTimer) clearTimeout(roamEndTimer);
    
    roamEndTimer = setTimeout(() => {
        isRoaming = false;
        roamEndTimer = null;
        updateDashboard();
    }, 150);

    chart.setOption({
        series: [ { type: 'lines', data: [] }, { type: 'effectScatter', data: [] } ]
    });
});

window.addEventListener('resize', () => chart.resize());