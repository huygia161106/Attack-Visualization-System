// Cấu hình URL Cloudflare thống nhất 1 chỗ
const API_BASE_URL = 'https://ultram-short-repository-gradually.trycloudflare.com/api/events';
const WS_URL = 'wss://ultram-short-repository-gradually.trycloudflare.com/ws/live';
// const API_BASE_URL = 'http://localhost:8080/api/events';
//const WS_URL = 'ws://localhost:8080/ws/live';

const chart = echarts.init(document.getElementById('map'));

let mapAttacks = []; 
let logAttacks = []; 
let eventBuffer = []; 
let globalStats = { "WORLD": {} }; 

// THÔNG SỐ TỶ LỆ VÀNG
const MAX_ACTIVE_LINES = 300; 
const MAX_LOGS = 50;         
const ATTACK_LIFETIME = 6000; 
const RENDER_INTERVAL = 1000; 

const HONEYPOT_LOOKUP = {
    "14.225.192.112": { name: "Vietnam", coords: [106.8031, 10.8701] },
    "104.16.12.3":    { name: "United States", coords: [-77.0369, 38.9072] },
    "3.120.54.2":     { name: "Germany", coords: [8.6821, 50.1109] },
    "13.230.12.4":    { name: "Japan", coords: [139.6503, 35.6762] },
    "52.74.12.5":     { name: "Singapore", coords: [103.8198, 1.3521] },
    "8.18.43.21":     { name: "United Kingdom", coords: [-0.1278, 51.5074] },
    "139.130.4.5":    { name: "Australia", coords: [151.2093, -33.8688] },
    "187.12.44.3":    { name: "Brazil", coords: [-43.1729, -22.9068] },
    "211.23.45.1":    { name: "South Korea", coords: [126.9780, 37.5665] },
    "192.99.12.4":    { name: "France", coords: [2.3522, 48.8566] },
    "198.51.100.1":   { name: "Canada", coords: [-79.3832, 43.6532] },
    "95.161.2.1":     { name: "Russia", coords: [37.6173, 55.7558] },
    "114.247.1.1":    { name: "China", coords: [116.4074, 39.9042] }
};

const countrySelect = document.getElementById('countrySelect');
if(countrySelect) {
    const uniqueCountries = [...new Set(Object.values(HONEYPOT_LOOKUP).map(h => h.name))].sort();
    uniqueCountries.forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.innerHTML = country.toUpperCase();
        countrySelect.appendChild(opt);
        globalStats[country] = {}; 
    });
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
        map: 'world', roam: true, zoom: 1.2, scaleLimit: { min: 1.2, max: 8 }, top: '15%',
        itemStyle: { areaColor: '#0a1d33', borderColor: '#00f0ff33' },
        emphasis: { label: { show: false }, itemStyle: { areaColor: '#123152' } }
    },
    series: []
});

function updateDashboard() {
    chart.setOption({
        series: [
            {
                type: 'lines', coordinateSystem: 'geo', zlevel: 1, z: 2, animation: false,
                effect: { show: true, period: 4, trailLength: 0.4, symbol: 'circle', symbolSize: 3, loop: false },
                lineStyle: { width: 1.5, opacity: 0, curveness: 0.3 },
                data: mapAttacks.map(a => a.lineData)
            },
            {
                type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2, z: 3, animation: false,
                rippleEffect: { brushType: 'stroke', scale: 2.5 }, symbolSize: 4,
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

// ── Gọi API lấy dữ liệu chuẩn cho Bảng (ĐÃ FIX CACHE CHỐNG LỆCH) ──
function syncMapStats() {
    const t = new Date().getTime();
    fetch(`${API_BASE_URL}/stats/redis?t=${t}`, { cache: "no-store" })
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
}

syncMapStats(); 
setInterval(() => {
    syncMapStats();
}, 500);

const socket = new WebSocket(WS_URL);

socket.onmessage = function(event) {
    // Bỏ if(document.hidden) để chống mất đạn khi chuyển tab
    try {
        const attackList = JSON.parse(event.data);
        eventBuffer.push(...attackList); 
        // Tránh tràn RAM nếu treo quá lâu
        if (eventBuffer.length > 200) eventBuffer = eventBuffer.slice(-200);
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

        a.lineData = { id: 'line_' + a.uid, coords: [a.from, a.to], lineStyle: { color: color } };
        a.scatterSrc = { id: 'src_' + a.uid, value: [...a.from, 1], itemStyle: { color: color } };
        a.scatterDst = { id: 'dst_' + a.uid, value: [...a.to, 1], itemStyle: { color: color } };

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

    chart.setOption({ series: [ { type: 'lines', data: [] }, { type: 'effectScatter', data: [] } ] });
});

window.addEventListener('resize', () => chart.resize());const chart = echarts.init(document.getElementById('map'));

let mapAttacks = []; 
let logAttacks = []; 
let eventBuffer = []; 
let globalStats = { "WORLD": {} }; 

// THÔNG SỐ TỶ LỆ VÀNG (Giữ nguyên)
const MAX_ACTIVE_LINES = 100; 
const MAX_LOGS = 50;         
const ATTACK_LIFETIME = 6000; 
const RENDER_INTERVAL = 1000; 

const HONEYPOT_LOOKUP = {
    "14.225.192.112": { name: "Vietnam", coords: [106.8031, 10.8701] },
    "104.16.12.3":    { name: "United States", coords: [-77.0369, 38.9072] },
    "3.120.54.2":     { name: "Germany", coords: [8.6821, 50.1109] },
    "13.230.12.4":    { name: "Japan", coords: [139.6503, 35.6762] },
    "52.74.12.5":     { name: "Singapore", coords: [103.8198, 1.3521] },
    "8.18.43.21":     { name: "United Kingdom", coords: [-0.1278, 51.5074] },
    "139.130.4.5":    { name: "Australia", coords: [151.2093, -33.8688] },
    "187.12.44.3":    { name: "Brazil", coords: [-43.1729, -22.9068] },
    "211.23.45.1":    { name: "South Korea", coords: [126.9780, 37.5665] },
    "192.99.12.4":    { name: "France", coords: [2.3522, 48.8566] },
    "198.51.100.1":   { name: "Canada", coords: [-79.3832, 43.6532] },
    "95.161.2.1":     { name: "Russia", coords: [37.6173, 55.7558] },
    "114.247.1.1":    { name: "China", coords: [116.4074, 39.9042] }
};

const countrySelect = document.getElementById('countrySelect');
if(countrySelect) {
    const uniqueCountries = [...new Set(Object.values(HONEYPOT_LOOKUP).map(h => h.name))].sort();
    uniqueCountries.forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.innerHTML = country.toUpperCase();
        countrySelect.appendChild(opt);
        globalStats[country] = {}; 
    });
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
