const chart = echarts.init(document.getElementById('map'));

let attacks = [];

// Thời gian đạn bay (giây)
const ATTACK_PERIOD = 4; 
// Thời gian đạn tồn tại thêm sau khi đến đích (giây)
const PERSIST_AFTER_ARRIVAL = 2; 

// 1. TỪ ĐIỂN TRA CỨU IP ĐÍCH (Đã cập nhật đủ 50 trạm Honeypots)
const HONEYPOT_LOOKUP = {
    // 10 Trạm cũ
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
    // 40 Trạm mới bổ sung
    "198.51.100.1":   { name: "Canada - Toronto", coords: [-79.3832, 43.6532] },
    "189.201.12.5":   { name: "Mexico - Mexico City", coords: [-99.1332, 19.4326] },
    "181.30.45.8":    { name: "Argentina - Buenos Aires", coords: [-58.3816, -34.6037] },
    "93.147.2.3":     { name: "Italy - Rome", coords: [12.4964, 41.9028] },
    "212.170.1.4":    { name: "Spain - Madrid", coords: [-3.7038, 40.4168] },
    "145.100.2.1":    { name: "Netherlands - Amsterdam", coords: [4.8952, 52.3702] },
    "193.10.1.2":     { name: "Sweden - Stockholm", coords: [18.0686, 59.3293] },
    "176.235.10.4":   { name: "Turkey - Istanbul", coords: [28.9784, 41.0082] },
    "94.200.5.1":     { name: "UAE - Dubai", coords: [55.2708, 25.2048] },
    "103.21.126.1":   { name: "India - Mumbai", coords: [72.8777, 19.0760] },
    "203.146.2.5":    { name: "Thailand - Bangkok", coords: [100.5018, 13.7563] },
    "210.187.1.1":    { name: "Malaysia - Kuala Lumpur", coords: [101.6869, 3.1390] },
    "114.122.1.4":    { name: "Indonesia - Jakarta", coords: [106.8456, -6.2088] },
    "112.198.1.1":    { name: "Philippines - Manila", coords: [120.9842, 14.5995] },
    "1.160.1.2":      { name: "Taiwan - Taipei", coords: [121.5654, 25.0330] },
    "156.200.1.1":    { name: "Egypt - Cairo", coords: [31.2357, 30.0444] },
    "197.242.1.4":    { name: "South Africa - Johannesburg", coords: [28.0473, -26.2041] },
    "95.161.2.1":     { name: "Russia - Moscow", coords: [37.6173, 55.7558] },
    "157.240.1.1":    { name: "USA - New York", coords: [-74.0060, 40.7128] },
    "172.217.1.1":    { name: "USA - Los Angeles", coords: [-118.2437, 34.0522] },
    "194.65.1.1":     { name: "Portugal - Lisbon", coords: [-9.1393, 38.7223] },
    "164.128.1.1":    { name: "Belgium - Brussels", coords: [4.3517, 50.8503] },
    "185.129.1.1":    { name: "Denmark - Copenhagen", coords: [12.5683, 55.6761] },
    "135.181.1.1":    { name: "Finland - Helsinki", coords: [24.9384, 60.1699] },
    "158.37.1.1":     { name: "Norway - Oslo", coords: [10.7522, 59.9139] },
    "130.59.1.1":     { name: "Switzerland - Zurich", coords: [8.5417, 47.3769] },
    "149.156.1.1":    { name: "Poland - Warsaw", coords: [21.0122, 52.2297] },
    "37.126.1.1":     { name: "Saudi Arabia - Riyadh", coords: [46.6753, 24.7136] },
    "147.235.1.1":    { name: "Israel - Tel Aviv", coords: [34.7818, 32.0853] },
    "114.247.1.1":    { name: "China - Beijing", coords: [116.4074, 39.9042] },
    "101.227.1.1":    { name: "China - Shanghai", coords: [121.4737, 31.2304] },
    "202.49.1.1":     { name: "New Zealand - Auckland", coords: [174.7633, -36.8485] },
    "102.67.1.1":     { name: "Nigeria - Lagos", coords: [3.3792, 6.5244] },
    "196.201.1.1":    { name: "Kenya - Nairobi", coords: [36.8219, -1.2921] },
    "190.160.1.1":    { name: "Chile - Santiago", coords: [-70.6693, -33.4489] },
    "192.174.1.1":    { name: "USA - San Francisco", coords: [-122.4194, 37.7749] },
    "192.174.2.1":    { name: "USA - Chicago", coords: [-87.6298, 41.8781] },
    "193.170.1.1":    { name: "Austria - Vienna", coords: [16.3738, 48.2082] },
    "103.21.127.1":   { name: "India - New Delhi", coords: [77.2090, 28.6139] },
    "199.60.1.1":     { name: "Canada - Vancouver", coords: [-123.1207, 49.2827] }
};

fetch('http://localhost:8080/api/events')
    .then(response => response.json())
    .then(data => {
        data.reverse().forEach(event => {
            if (event.srcLng && event.srcLat) {
                const target = HONEYPOT_LOOKUP[event.dstIp] || HONEYPOT_LOOKUP["14.225.192.112"];
                attacks.push({
                    time: new Date(event.timestamp).toLocaleTimeString(),
                    from: [event.srcLng, event.srcLat],
                    to: target.coords,
                    ip: event.srcIp,
                    type: event.attackType,
                    fromCountry: event.country || "Unknown",
                    fromCity: event.city || "Unknown City",
                    toCountry: target.name
                });
            }
        });
        updateChart();
        console.log("✅ Đã nạp xong lịch sử tấn công Đa điểm!");
    })
    .catch(error => console.error("Lỗi nạp lịch sử:", error));

const option = {
    backgroundColor: 'transparent',
    geo: {
        map: 'world',
        roam: true,
        zoom: 1.2,
        top: '15%',
        itemStyle: {
            areaColor: '#072a40',
            borderColor: '#00f0ff33'
        },
        emphasis: {
            label: {
                show: true,
                color: '#000000',
                fontSize: 16,
                fontWeight: 'bold',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                padding: [4, 8],
                borderRadius: 4
            },
            itemStyle: {
                areaColor: '#0b3d5c'
            }
        }
    },
    series: []
};

chart.setOption(option);

window.addEventListener('resize', function() {
    chart.resize();
});

/* ========================================================
   FIX CORE: Dùng dispatchAction để đồng bộ lại vị trí
   thay vì gọi setOption (quá nặng, không kịp 60fps)
======================================================== */
let isRoaming = false;
let roamEndTimer = null;

chart.on('georoam', function() {
    isRoaming = true;

    // Clear timer cũ nếu người dùng vẫn đang kéo
    if (roamEndTimer) {
        clearTimeout(roamEndTimer);
    }

    // Đánh dấu kết thúc roam sau 150ms không có sự kiện mới
    roamEndTimer = setTimeout(function() {
        isRoaming = false;
        roamEndTimer = null;

        // Sau khi roam dừng, vẽ lại 1 lần dứt khoát với notMerge=false
        updateChart();
    }, 150);

    // Trong khi đang kéo: ẩn series effect để tránh lệch tọa độ
    chart.setOption({
        series: [
            {
                type: 'lines',
                coordinateSystem: 'geo',
                z: 2,
                animation: false,
                effect: {
                    show: false   // ← TẮT effect animation khi đang roam
                },
                lineStyle: {
                    color: '#00f0ff',
                    width: 1,
                    opacity: 0.4,
                    curveness: 0.3
                },
                data: attacks.map(a => ({
                    coords: [a.from, a.to],
                    value: a
                }))
            },
            {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                z: 3,
                animation: false,
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 0   // ← Thu nhỏ ripple về 0 khi roam
                },
                symbolSize: 6,
                itemStyle: {
                    color: '#ff3c3c'
                },
                data: attacks.map(a => ({
                    value: [...a.to, 1]
                }))
            }
        ]
    }, { notMerge: false, lazyUpdate: false, silent: true });
});

/* UPDATE CHART - Vẽ đầy đủ với effect */
function updateChart() {
    chart.setOption({
        series: [
            {
                type: 'lines',
                coordinateSystem: 'geo',
                z: 2,
                animation: false,
                effect: {
                    show: true,
                    period: ATTACK_PERIOD, // Đã chỉnh theo biến khai báo trên cùng
                    trailLength: 0.5,
                    symbol: 'arrow',
                    symbolSize: 6,
                    color: '#00f0ff'
                },
                lineStyle: {
                    color: '#00f0ff',
                    width: 1,
                    opacity: 0.5,
                    curveness: 0.3
                },
                data: attacks.map(a => ({
                    coords: [a.from, a.to],
                    value: a
                }))
            },
            {
                type: 'effectScatter',
                coordinateSystem: 'geo',
                z: 3,
                animation: false,
                rippleEffect: {
                    brushType: 'stroke'
                },
                symbolSize: 6,
                itemStyle: {
                    color: '#ff3c3c'
                },
                data: attacks.map(a => ({
                    value: [...a.to, 1]
                }))
            }
        ]
    }, { notMerge: false, lazyUpdate: false, silent: true });
}


/* KẾT NỐI WEBSOCKET ĐẾN JAVA BACKEND */
const socket = new WebSocket('ws://localhost:8080/ws/live');

socket.onopen = () => {
    console.log("Đã kết nối tới Java Spring Boot WebSocket Backend");
};

socket.onmessage = function(event) {
    try {
        const attackList = JSON.parse(event.data);

        attackList.forEach(realAttack => {
            realAttack.time = new Date().toLocaleTimeString();
            
            // Tạo 1 ID duy nhất để quản lý vòng đời của từng tia đạn
            const uniqueId = Math.random().toString(36).substr(2, 9);
            realAttack.uid = uniqueId;
            
            attacks.push(realAttack);

            // TÍNH TOÁN THỜI GIAN TỰ HỦY: (Thời gian bay + Thời gian chờ) * 1000ms
            const lifetime = (ATTACK_PERIOD + PERSIST_AFTER_ARRIVAL) * 1000;
            
            setTimeout(() => {
                // Xóa đúng cuộc tấn công này khỏi mảng sau khi hết hạn vòng đời
                attacks = attacks.filter(a => a.uid !== uniqueId);
                if (!isRoaming) {
                    updateChart();
                }
            }, lifetime);
        });

        // ĐÃ XÓA logic cắt mảng (attacks.length > 60) vì giờ đạn sẽ tự biến mất theo thời gian

        // Không vẽ lại khi đang roam để tránh giật
        if (!isRoaming) {
            updateChart();
        }
    } catch (error) {
        console.error("Lỗi xử lý dữ liệu từ Backend:", error);
    }
};

socket.onclose = () => {
    console.log("Đã mất kết nối tới Backend");
};

socket.onerror = (error) => {
    console.error("Lỗi kết nối WebSocket:", error);
};

/* CLICK VÀO ĐƯỜNG BAY TRÊN BẢN ĐỒ */
chart.on('click', function(params) {
    if (params.data && params.data.value) {
        const a = params.data.value;
        alert(
            `==============================\n` +
            `Thời gian: ${a.time}\n` +
            `Nguồn (Attacker): ${a.fromCity}, ${a.fromCountry}\n` +
            `Đích (Target): Trạm cảm biến ${a.toCountry}\n` +
            `IP Kẻ tấn công: ${a.ip}\n` +
            `Loại mã độc: ${a.type}`
        );
    }
});