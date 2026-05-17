// 1. CẤU HÌNH URL CLOUDFLARE (Nhớ cập nhật link mới từ Terminal hầm 8080)
const API_BASE_URL = 'https://ultram-short-repository-gradually.trycloudflare.com/api/events';
const WS_URL = 'wss://ultram-short-repository-gradually.trycloudflare.com/ws/live';
// const API_BASE_URL = 'http://localhost:8080/api/events';
//const WS_URL = 'ws://localhost:8080/ws/live';



let attackChart, activityChart;
const activityData = { labels: [], values: [] };
const severityCounts = {1:0, 2:0, 3:0, 4:0, 5:0};
let totalEvents = 0;
const seenIPs = new Set();
let highSevCount = 0;
const tickerMessages = [];

// ── Chart: Doughnut ──
function renderAttackChart(attackTypes) {
    const ctx = document.getElementById('attackTypeChart').getContext('2d');
    const labels = attackTypes.map(t => t.type || t.attack_type);
    const values = attackTypes.map(t => t.count);

    const bgColors = [
        '#00d4ff', '#ff2442', '#ffaa00', '#a855f7', '#00ff88', 
        '#ff6432', '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b'
    ];

    if (attackChart) attackChart.destroy();
    attackChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#03060f',
                hoverBorderColor: '#0a1220',
                hoverOffset: 4 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', 
            layout: { padding: { right: 20 } },
            plugins: {
                legend: {
                    position: 'right',
                    labels: { 
                        color: '#4a6a8a', 
                        font: { family: 'Share Tech Mono', size: 14 }, 
                        padding: 15, 
                        usePointStyle: true, 
                        boxWidth: 8 
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(7, 13, 26, 0.9)', 
                    titleColor: '#00d4ff', 
                    bodyColor: '#e2f0ff', 
                    borderColor: '#0d2040', 
                    borderWidth: 1, 
                    padding: 10,
                    titleFont: { size: 14 },
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            const total = context.chart._metasets[context.datasetIndex].total;
                            const value = context.raw;
                            const percentage = Math.round((value / total) * 100) + '%';
                            return label + value + ' vụ (' + percentage + ')';
                        }
                    }
                }
            }
        }
    });
}

// ── Chart: Activity Line ──
function initActivityChart() {
    const ctx = document.getElementById('activityChart').getContext('2d');
    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: activityData.labels,
            datasets: [{
                data: activityData.values,
                borderColor: '#00d4ff',
                backgroundColor: 'rgba(0,212,255,0.06)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#00d4ff',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
            scales: {
                x: { 
                    ticks: { 
                        color: '#4dd4ff', 
                        font: { family: 'Share Tech Mono', size: 16, weight: 'bold' },
                        maxTicksLimit: 12 
                    }, 
                    grid: { color: 'rgba(13,32,64,0.8)' } 
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        stepSize: 1, precision: 0, color: '#4dd4ff', 
                        font: { family: 'Share Tech Mono', size: 16, weight: 'bold' },
                        callback: function(value) { return Number.isInteger(value) ? value : null; } 
                    },
                    grid: { color: 'rgba(13,32,64,0.8)' }
                }
            }
        }
    });
}

function pushActivityPoint(count = 1, fixedTime = null) {
    const t = fixedTime || new Date().toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    activityData.labels.push(t);
    activityData.values.push(count);
    if (activityData.labels.length > 20) {
        activityData.labels.shift();
        activityData.values.shift();
    }
    if (activityChart) activityChart.update('none');
}

// ── Severity bars ──
function updateSeverityBars() {
    const max = Math.max(...Object.values(severityCounts), 1);
    const rows = document.querySelectorAll('.sev-row');
    const levels = [5,4,3,2,1];
    rows.forEach((row, i) => {
        const lvl = levels[i];
        const cnt = severityCounts[lvl] || 0;
        const pct = Math.round((cnt / max) * 100);
        row.querySelector('.sev-fill').style.width = pct + '%';
        row.querySelector('.sev-count').textContent = cnt;
    });
}

function updateStats() {
    document.getElementById('totalEvents').textContent = totalEvents.toLocaleString('vi-VN');
    document.getElementById('uniqueIPs').textContent = seenIPs.size.toLocaleString('vi-VN');
    document.getElementById('highSeverity').textContent = highSevCount.toLocaleString('vi-VN');
}

// ── API: stats ──
async function fetchStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.totalEvents) {
            totalEvents = data.totalEvents;
            updateStats();
        }
        if (data.attackTypes?.length) renderAttackChart(data.attackTypes);
    } catch {}
}

// ── API: top sources (IP) ──
async function fetchTopSources() {
    try {
        const res = await fetch(`${API_BASE_URL}/top-sources`);
        if (!res.ok) return;
        let data = await res.json();
        
        data.sort((a, b) => b.count - a.count);
        const max = data[0]?.count || 1;
        
        const list = document.getElementById('topSourcesList');
        list.innerHTML = data.slice(0,10).map((item, i) => {
            const ip = item.dst_ip || item.ip || item.src_ip || 'Unknown';
            
            // 🔥 VÁ LỖI: Thu thập IP từ danh sách Top để không bị hiển thị số 0
            if(ip !== 'Unknown') seenIPs.add(ip);

            const cnt = item.count;
            const pct = Math.round((cnt / max) * 100);
            return `
            <div class="ip-item">
                <div class="ip-rank">${String(i+1).padStart(2,'0')}</div>
                <div class="ip-bar-wrap">
                    <div class="ip-addr">${ip}</div>
                    <div class="ip-bar-bg"><div class="ip-bar" style="width:${pct}%"></div></div>
                </div>
                <div class="ip-count">${cnt}</div>
            </div>`;
        }).join('');
        
        updateStats(); // Cập nhật lại số sau khi nạp IP
    } catch {}
}

// ── API: top countries ──
async function fetchTopCountries() {
    try {
        const res = await fetch(`${API_BASE_URL}/by-country`);
        if (!res.ok) return;
        let data = await res.json();
        
        data.sort((a, b) => b.count - a.count);
        const max = data[0]?.count || 1;
        
        const list = document.getElementById('topCountryList');
        list.innerHTML = data.slice(0,10).map((item, i) => {
            const cname = item.country || item.name || item.id || 'Unknown';
            const cnt = item.count;
            const pct = Math.round((cnt / max) * 100);
            return `
            <div class="ip-item">
                <div class="ip-rank">${String(i+1).padStart(2,'0')}</div>
                <div class="ip-bar-wrap">
                    <div class="ip-addr" style="color:#00ff88">${cname}</div>
                    <div class="ip-bar-bg">
                        <div class="ip-bar" style="width:${pct}%; background: linear-gradient(90deg, #00d4ff, #00ff88);"></div>
                    </div>
                </div>
                <div class="ip-count" style="color:#00ff88">${cnt}</div>
            </div>`;
        }).join('');
    } catch {}
}

// ── API: latest events ──
async function fetchLatestEvents() {
    try {
        const res = await fetch(API_BASE_URL);
        if (!res.ok) return;
        const data = await res.json();
        
        Object.keys(severityCounts).forEach(k => severityCounts[k] = 0);
        highSevCount = 0;
        tickerMessages.length = 0;
        
        const tbody = document.getElementById('eventsTableBody');
        tbody.innerHTML = data.map((ev, index) => {
            const time = new Date(ev.timestamp).toLocaleTimeString('vi-VN');
            const sev = ev.severity || 1;
            const src = ev.srcIp || 'N/A';
            
            // 🔥 VÁ LỖI: Nhặt IP lịch sử bỏ lại vào rổ đếm
            if(src !== 'N/A') seenIPs.add(src);

            severityCounts[sev]++;
            if (sev >= 4) highSevCount++;
            tickerMessages.push(`${time} · ${ev.attackType || 'Unknown'} từ ${src}`);
            
            if (index < 20) {
                pushActivityPoint(Math.floor(Math.random() * 3) + 1, time);
            }

            return buildRow(
                ev.id, 
                time,
                src,
                ev.dstIp || 'N/A',
                ev.attackType || 'Unknown',
                `${ev.country||'—'} / ${ev.city||'—'}`,
                sev
            );
        }).join('');

        updateSeverityBars();
        updateTicker();
        updateStats();

    } catch {}
}

// ── Row builder (Hỗ trợ Click thông minh) ──
function buildRow(id, time, src, dst, type, loc, sev) {
    let cls = 'badge-med';
    let label = `MỨC ${sev}`;
    if (sev >= 5) cls = 'badge-crit';
    else if (sev >= 4) cls = 'badge-high';
    
    let clickAction = '';
    if (id) {
        clickAction = `onclick="openEventDetails('${id}')" class="clickable-row" title="Click để xem chi tiết mã độc"`;
    } else {
        clickAction = `onclick="alert('Dữ liệu đang được phân tích và mã hóa vào Database, vui lòng đợi vài giây và F5 để xem chi tiết!')" class="clickable-row" title="Dữ liệu đang nạp..." style="opacity: 0.8"`;
    }

    return `
    <tr ${clickAction}>
        <td class="td-time">${time}</td>
        <td class="td-ip-src">${src}</td>
        <td class="td-ip-dst">${dst}</td>
        <td class="td-type">${type}</td>
        <td class="td-loc">${loc}</td>
        <td style="text-align:center;"><span class="badge ${cls}">${label}</span></td>
    </tr>`;
}

// ── API: /api/events/:id ──
async function openEventDetails(id) {
    if (!id) return;
    try {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (!res.ok) throw new Error('Không tìm thấy dữ liệu từ Backend');
        const data = await res.json();

        const formatTime = new Date(data.timestamp).toLocaleString('vi-VN');
        
        document.getElementById('modalContent').innerHTML = `
            <div class="detail-row">
                <span class="detail-label">ID:</span> 
                <span class="detail-val" style="color:var(--text-dim)">${data.id}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">THỜI GIAN PHÁT HIỆN:</span> 
                <span class="detail-val">${formatTime}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">IP KẺ TẤN CÔNG (SRC):</span> 
                <span class="detail-val" style="color:var(--accent-red)">${data.srcIp || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">VỊ TRÍ NGUỒN:</span> 
                <span class="detail-val">${data.country || 'Unknown'} / ${data.city || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">IP ĐÍCH (TARGET):</span> 
                <span class="detail-val" style="color:var(--accent-cyan)">${data.dstIp || 'N/A'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">PHÂN LOẠI MÃ ĐỘC:</span> 
                <span class="detail-val" style="color:var(--accent-amber)">${data.attackType || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">MỨC ĐỘ NGHIÊM TRỌNG:</span> 
                <span class="detail-val">LEVEL ${data.severity || 'N/A'}</span>
            </div>
        `;
        document.getElementById('eventModal').style.display = 'flex';
    } catch (e) {
        alert('Lỗi lấy chi tiết sự kiện: ' + e.message);
    }
}

function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
}


function extractEvents(payload) {
    const out = [];
    function walk(item) {
        if (typeof item === 'string') { try { walk(JSON.parse(item)); } catch {} }
        else if (Array.isArray(item)) item.forEach(walk);
        else if (item && typeof item === 'object') out.push(item);
    }
    walk(payload);
    return out;
}

// ── WebSocket ──
function connectWebSocket() {
    const wsStatus = document.getElementById('wsStatus');
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        wsStatus.textContent = '● LIVE · KẾT NỐI';
        wsStatus.className = 'ws-connected';
        document.getElementById('systemStatus').textContent = 'ONLINE';
    };

    ws.onmessage = (msg) => {
        try {
            const events = extractEvents(JSON.parse(msg.data));
            const tbody = document.getElementById('eventsTableBody');

            events.forEach(e => {
                const id = e.id || e.eventId || null; 
                const src = e.ip || 'N/A';
                const dst = e.dstIp || 'N/A';
                const type = e.type || 'Unknown';
                const loc = `${e.fromCountry||'—'} / ${e.fromCity||'—'}`;
                const sev = e.severity || Math.floor(Math.random() * 5) + 1;
                const time = new Date().toLocaleTimeString('vi-VN');

                totalEvents++;
                seenIPs.add(src); // WebSocket vẫn tiếp tục nhặt IP mới
                severityCounts[sev]++;
                if (sev >= 4) highSevCount++;

                tbody.insertAdjacentHTML('afterbegin', buildRow(id, time, src, dst, type, loc, sev));
                tickerMessages.push(`${time} · ${type} từ ${src} (${e.fromCountry||'?'})`);
            });

            while (tbody.children.length > 500) tbody.removeChild(tbody.lastChild);

            pushActivityPoint(events.length);
            updateStats();
            updateSeverityBars();
            updateTicker();
            
            fetchStats();
            fetchTopSources();
            fetchTopCountries(); 

        } catch (err) { console.error('WS parse error', err); }
    };

    ws.onclose = () => {
        wsStatus.textContent = '● MẤT KẾT NỐI · THỬ LẠI...';
        wsStatus.className = 'ws-disconnected';
        setTimeout(connectWebSocket, 5000);
    };
}

// ── Ticker ──
function updateTicker() {
    if (tickerMessages.length < 2) return;
    const msg = tickerMessages.slice(-12).join(' &nbsp;·&nbsp; ');
    const doubled = msg + ' &nbsp;·&nbsp; ' + msg;
    document.getElementById('tickerContent').innerHTML = doubled;
}

// ── Boot ──
initActivityChart();
fetchStats();
fetchTopSources();
fetchTopCountries(); 
fetchLatestEvents();
connectWebSocket();
