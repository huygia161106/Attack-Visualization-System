const API_BASE_URL = 'http://localhost:8080/api/events';
const WS_URL = 'ws://localhost:8080/ws/live';

let attackChart, activityChart;
const activityData   = { labels: [], values: [] };
const severityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
let totalEvents      = 0;
let highSevCount     = 0;
const seenIPs        = new Set();
const tickerMessages = [];

const TYPE_COLORS_FIXED = {
    'Port Scan': '#00d4ff', 'Zero-Day Attack': '#ff2442', 'Ransomware': '#ffaa00',
    'SSH Brute-force': '#a855f7', 'SQL Injection': '#00ff88', 'Credential Stuffing': '#ff6432',
    'XSS Exploit': '#3b82f6', 'DDoS': '#ec4899', 'Malware Infection': '#14b8a6', 'Unknown': '#a0a0b0'
};


/* ── 2. DATA NORMALIZERS ─────────────────────────────────────────────────── */
function normalizeCountryName(rawName) {
    if (!rawName) return "Unknown";
    let cleanName = rawName.split('-')[0].trim();
    const upper = cleanName.toUpperCase();
    
    if (upper === "UNITED STATES" || upper === "US" || upper === "USA") return "USA";
    if (upper === "THE NETHERLANDS" || upper === "NETHERLANDS") return "Netherlands";
    if (upper === "UK" || upper === "UNITED KINGDOM") return "United Kingdom";
    
    return cleanName;
}


/* ── 3. CHARTS INITIALIZATION ────────────────────────────────────────────── */
function renderAttackChart(attackTypes) {
    const ctx = document.getElementById('attackTypeChart').getContext('2d');
    const labels = attackTypes.map(t => t.type || t.attack_type);
    const values = attackTypes.map(t => t.count);
    const bgColors = labels.map(label => TYPE_COLORS_FIXED[label] || '#a0a0b0');

    if (attackChart) attackChart.destroy();
    attackChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: bgColors, borderWidth: 2, borderColor: '#03060f', hoverOffset: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: {
                legend: { position: 'right', labels: { color: '#4a6a8a', font: { family: 'Share Tech Mono', size: 14 }, usePointStyle: true } },
                tooltip: {
                    backgroundColor: 'rgba(7, 13, 26, 0.9)', titleColor: '#00d4ff', bodyColor: '#e2f0ff',
                    callbacks: {
                        label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${Math.round((ctx.raw / ctx.chart._metasets[ctx.datasetIndex].total) * 100)}%)`
                    }
                }
            }
        }
    });
}

function initActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: activityData.labels,
            datasets: [{
                data: activityData.values, borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.06)',
                borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#00d4ff', tension: 0.4, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#4dd4ff', font: { family: 'Share Tech Mono' } }, grid: { color: 'rgba(13,32,64,0.8)' } },
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#4dd4ff' }, grid: { color: 'rgba(13,32,64,0.8)' } }
            }
        }
    });
}


/* ── 4. UI UPDATE HELPERS ────────────────────────────────────────────────── */
function pushActivityPoint(count = 1, fixedTime = null) {
    const t = fixedTime || new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    activityData.labels.push(t);
    activityData.values.push(count);
    if (activityData.labels.length > 20) { activityData.labels.shift(); activityData.values.shift(); }
    if (activityChart) activityChart.update('none');
}

function updateSeverityBars() {
    const max = Math.max(...Object.values(severityCounts), 1);
    document.querySelectorAll('.sev-row').forEach((row, i) => {
        const lvl = [5, 4, 3, 2, 1][i];
        const cnt = severityCounts[lvl] || 0;
        row.querySelector('.sev-fill').style.width = Math.round((cnt / max) * 100) + '%';
        row.querySelector('.sev-count').textContent = cnt;
    });
}

function updateStats() {
    document.getElementById('totalEvents').textContent = totalEvents.toLocaleString('vi-VN');
    document.getElementById('uniqueIPs').textContent = seenIPs.size.toLocaleString('vi-VN');
    document.getElementById('highSeverity').textContent = highSevCount.toLocaleString('vi-VN');
}

function updateTicker() {
    if (tickerMessages.length < 2) return;
    const msg = tickerMessages.slice(-12).join(' &nbsp;·&nbsp; ');
    document.getElementById('tickerContent').innerHTML = msg + ' &nbsp;·&nbsp; ' + msg;
}

function buildRow(id, time, src, dst, type, loc, sev) {
    let cls = sev >= 5 ? 'badge-crit' : (sev >= 4 ? 'badge-high' : 'badge-med');
    let clickAction = id ? `onclick="openEventDetails('${id}')" class="clickable-row" title="Click để xem chi tiết"` 
                         : `onclick="alert('Đang mã hóa dữ liệu, vui lòng đợi vài giây và F5!')" class="clickable-row" style="opacity: 0.8"`;
    return `
    <tr ${clickAction}>
        <td class="td-time">${time}</td><td class="td-ip-src">${src}</td><td class="td-ip-dst">${dst}</td>
        <td class="td-type">${type}</td><td class="td-loc">${loc}</td>
        <td style="text-align:center;"><span class="badge ${cls}">MỨC ${sev}</span></td>
    </tr>`;
}


/* ── 5. API FETCHERS (HTTP REST) ─────────────────────────────────────────── */
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.totalEvents) { totalEvents = data.totalEvents; updateStats(); }
        if (data.attackTypes?.length) renderAttackChart(data.attackTypes);
    } catch (e) { console.warn('Fetch Stats failed'); }
}

async function fetchTopSources() {
    try {
        const res = await fetch(`${API_BASE_URL}/top-sources`);
        if (!res.ok) return;
        let data = await res.json();
        data.sort((a, b) => b.count - a.count);
        
        const max = data[0]?.count || 1;
        document.getElementById('topSourcesList').innerHTML = data.slice(0,10).map((item, i) => {
            const ip = item.dst_ip || item.ip || item.src_ip || 'Unknown';
            if (ip !== 'Unknown') seenIPs.add(ip);
            const pct = Math.round((item.count / max) * 100);
            
            return `<div class="ip-item"><div class="ip-rank">${String(i+1).padStart(2,'0')}</div>
                    <div class="ip-bar-wrap"><div class="ip-addr">${ip}</div>
                    <div class="ip-bar-bg"><div class="ip-bar" style="width:${pct}%"></div></div></div>
                    <div class="ip-count">${item.count}</div></div>`;
        }).join('');
        updateStats();
    } catch (e) { console.warn('Fetch Top Sources failed'); }
}

async function fetchTopCountries() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats/redis?t=${new Date().getTime()}`, { cache: "no-store" });
        if (!res.ok) return;
        const dataR = await res.json();
        const countryTotals = {};

        for (const country in dataR) {
            if (country === "WORLD") continue;
            let cleanCountry = normalizeCountryName(country);
            if (!countryTotals[cleanCountry]) countryTotals[cleanCountry] = 0;
            for (const rawType in dataR[country]) {
                countryTotals[cleanCountry] += parseInt(dataR[country][rawType]) || 0;
            }
        }

        let data = Object.keys(countryTotals).map(c => ({ country: c, count: countryTotals[c] })).sort((a, b) => b.count - a.count);
        const max = data[0]?.count || 1;
        
        document.getElementById('topCountryList').innerHTML = data.slice(0, 10).map((item, i) => {
            const pct = Math.round((item.count / max) * 100);
            return `<div class="ip-item"><div class="ip-rank">${String(i+1).padStart(2,'0')}</div>
                    <div class="ip-bar-wrap"><div class="ip-addr" style="color:#00ff88">${item.country}</div>
                    <div class="ip-bar-bg"><div class="ip-bar" style="width:${pct}%; background: linear-gradient(90deg, #00d4ff, #00ff88);"></div></div></div>
                    <div class="ip-count" style="color:#00ff88">${item.count}</div></div>`;
        }).join('');
    } catch (e) { console.warn('Fetch Top Countries failed'); }
}

async function fetchLatestEvents() {
    try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) return;
        const data = await res.json();
        
        Object.keys(severityCounts).forEach(k => severityCounts[k] = 0);
        highSevCount = 0; tickerMessages.length = 0;
        
        document.getElementById('eventsTableBody').innerHTML = data.map((ev) => {
            const time = new Date(ev.timestamp).toLocaleTimeString('vi-VN');
            const sev = ev.severity || 1;
            const src = ev.srcIp || 'N/A';
            if (src !== 'N/A') seenIPs.add(src);
            severityCounts[sev]++; if (sev >= 4) highSevCount++;
            tickerMessages.push(`${time} · ${ev.attackType || 'Unknown'} từ ${src}`);
            return buildRow(ev.id, time, src, ev.dstIp || 'N/A', ev.attackType || 'Unknown', `${ev.country||'—'} / ${ev.city||'—'}`, sev);
        }).join('');

        updateSeverityBars(); updateTicker(); updateStats();
    } catch (e) { console.warn('Fetch Latest Events failed'); }
}

async function openEventDetails(id) {
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy dữ liệu từ Backend');
        const data = await res.json();
        const formatTime = new Date(data.timestamp).toLocaleString('vi-VN');
        
        document.getElementById('modalContent').innerHTML = `
            <div class="detail-row"><span class="detail-label">ID:</span><span class="detail-val" style="color:var(--text-dim)">${data.id}</span></div>
            <div class="detail-row"><span class="detail-label">THỜI GIAN PHÁT HIỆN:</span><span class="detail-val">${formatTime}</span></div>
            <div class="detail-row"><span class="detail-label">IP NGUỒN:</span><span class="detail-val" style="color:var(--accent-red)">${data.srcIp || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">VỊ TRÍ NGUỒN:</span><span class="detail-val">${data.country || 'Unknown'} / ${data.city || 'Unknown'}</span></div>
            <div class="detail-row"><span class="detail-label">IP ĐÍCH:</span><span class="detail-val" style="color:var(--accent-cyan)">${data.dstIp || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">PHÂN LOẠI:</span><span class="detail-val" style="color:var(--accent-amber)">${data.attackType || 'Unknown'}</span></div>
            <div class="detail-row"><span class="detail-label">MỨC ĐỘ:</span><span class="detail-val">LEVEL ${data.severity || 'N/A'}</span></div>
        `;
        document.getElementById('eventModal').style.display = 'flex';
    } catch (e) { alert('Lỗi: ' + e.message); }
}
function closeModal() { document.getElementById('eventModal').style.display = 'none'; }


/* ── 6. WEBSOCKET REAL-TIME ENGINE ───────────────────────────────────────── */
function connectWebSocket() {
    const wsStatus = document.getElementById('wsStatus');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        wsStatus.textContent = '● LIVE · KẾT NỐI';
        wsStatus.className = 'ws-connected';
    };

    ws.onmessage = (msg) => {
        try {
            const out = [];
            const walk = (item) => {
                if (typeof item === 'string') { try { walk(JSON.parse(item)); } catch {} }
                else if (Array.isArray(item)) item.forEach(walk);
                else if (item && typeof item === 'object') out.push(item);
            };
            walk(JSON.parse(msg.data));

            const tbody = document.getElementById('eventsTableBody');
            out.forEach(e => {
                const id = e.id || e.eventId || null; 
                const src = e.ip || 'N/A';
                const sev = e.severity || Math.floor(Math.random() * 5) + 1;
                const time = new Date().toLocaleTimeString('vi-VN');

                totalEvents++; seenIPs.add(src); severityCounts[sev]++;
                if (sev >= 4) highSevCount++;

                tbody.insertAdjacentHTML('afterbegin', buildRow(id, time, src, e.dstIp || 'N/A', e.type || 'Unknown', `${e.fromCountry||'—'} / ${e.fromCity||'—'}`, sev));
                tickerMessages.push(`${time} · ${e.type || 'Unknown'} từ ${src}`);
            });

            while (tbody.children.length > MAX_TABLE_ROWS) tbody.removeChild(tbody.lastChild);

            pushActivityPoint(out.length);
            updateStats(); updateSeverityBars(); updateTicker();
            
            // XÓA GỌI API Ở ĐÂY ĐỂ TRÁNH DDOS BACKEND

        } catch (err) { console.error('WS error', err); }
    };

    ws.onclose = () => {
        wsStatus.textContent = '● MẤT KẾT NỐI · THỬ LẠI...';
        wsStatus.className = 'ws-disconnected';
        setTimeout(connectWebSocket, 5000);
    };
}


/* ── 7. BOOT SEQUENCE & INTERVALS ────────────────────────────────────────── */
initActivityChart();

// Khởi chạy lấy dữ liệu ban đầu
fetchStats();
fetchTopSources();
fetchTopCountries(); 
fetchLatestEvents();
<<<<<<< HEAD

// Kết nối luồng Live
connectWebSocket();

// 🔥 Lên lịch cập nhật các bảng xếp hạng định kỳ (5 giây/lần)
setInterval(() => {
    fetchStats();
    fetchTopSources();
    fetchTopCountries();
}, API_REFRESH_INTERVAL);

console.info('✅ Cyber Threat Dashboard v3.0 Ready - Optimized Polling Engine');
=======
connectWebSocket();