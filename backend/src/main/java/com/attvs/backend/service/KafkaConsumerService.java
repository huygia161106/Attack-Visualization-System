package com.attvs.backend.service;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.handler.LiveEventHandler;
import com.attvs.backend.repository.AttackEventRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
public class KafkaConsumerService {

    private final AttackEventRepository repository;
    private final ObjectMapper objectMapper;
    private final LiveEventHandler liveEventHandler;
    
    private final RedisService redisService;

    private final GeoIPService geoIPService; 
    private final Random random = new Random();

    // DANH SÁCH 50 TRẠM CẢM BIẾN (HONEYPOTS) - [Kinh độ, Vĩ độ, IP Ảo]
    private final Map<String, Object[]> HONEYPOTS = Map.ofEntries(
            // 10 Trạm gốc
            Map.entry("Vietnam", new Object[]{106.8031, 10.8701, "14.225.192.112"}),
            Map.entry("United States", new Object[]{-77.0369, 38.9072, "104.16.12.3"}),
            Map.entry("Germany", new Object[]{8.6821, 50.1109, "3.120.54.2"}),
            Map.entry("Japan", new Object[]{139.6503, 35.6762, "13.230.12.4"}),
            Map.entry("Singapore", new Object[]{103.8198, 1.3521, "52.74.12.5"}),
            Map.entry("United Kingdom", new Object[]{-0.1278, 51.5074, "8.18.43.21"}),
            Map.entry("Australia", new Object[]{151.2093, -33.8688, "139.130.4.5"}),
            Map.entry("Brazil", new Object[]{-43.1729, -22.9068, "187.12.44.3"}),
            Map.entry("South Korea", new Object[]{126.9780, 37.5665, "211.23.45.1"}),
            Map.entry("France", new Object[]{2.3522, 48.8566, "192.99.12.4"}),
            
            // 40 Trạm bổ sung
            Map.entry("Canada - Toronto", new Object[]{-79.3832, 43.6532, "198.51.100.1"}),
            Map.entry("Mexico - Mexico City", new Object[]{-99.1332, 19.4326, "189.201.12.5"}),
            Map.entry("Argentina - Buenos Aires", new Object[]{-58.3816, -34.6037, "181.30.45.8"}),
            Map.entry("Italy - Rome", new Object[]{12.4964, 41.9028, "93.147.2.3"}),
            Map.entry("Spain - Madrid", new Object[]{-3.7038, 40.4168, "212.170.1.4"}),
            Map.entry("Netherlands - Amsterdam", new Object[]{4.8952, 52.3702, "145.100.2.1"}),
            Map.entry("Sweden - Stockholm", new Object[]{18.0686, 59.3293, "193.10.1.2"}),
            Map.entry("Turkey - Istanbul", new Object[]{28.9784, 41.0082, "176.235.10.4"}),
            Map.entry("UAE - Dubai", new Object[]{55.2708, 25.2048, "94.200.5.1"}),
            Map.entry("India - Mumbai", new Object[]{72.8777, 19.0760, "103.21.126.1"}),
            Map.entry("Thailand - Bangkok", new Object[]{100.5018, 13.7563, "203.146.2.5"}),
            Map.entry("Malaysia - Kuala Lumpur", new Object[]{101.6869, 3.1390, "210.187.1.1"}),
            Map.entry("Indonesia - Jakarta", new Object[]{106.8456, -6.2088, "114.122.1.4"}),
            Map.entry("Philippines - Manila", new Object[]{120.9842, 14.5995, "112.198.1.1"}),
            Map.entry("Taiwan - Taipei", new Object[]{121.5654, 25.0330, "1.160.1.2"}),
            Map.entry("Egypt - Cairo", new Object[]{31.2357, 30.0444, "156.200.1.1"}),
            Map.entry("South Africa - Johannesburg", new Object[]{28.0473, -26.2041, "197.242.1.4"}),
            Map.entry("Russia - Moscow", new Object[]{37.6173, 55.7558, "95.161.2.1"}),
            Map.entry("USA - New York", new Object[]{-74.0060, 40.7128, "157.240.1.1"}),
            Map.entry("USA - Los Angeles", new Object[]{-118.2437, 34.0522, "172.217.1.1"}),
            Map.entry("Portugal - Lisbon", new Object[]{-9.1393, 38.7223, "194.65.1.1"}),
            Map.entry("Belgium - Brussels", new Object[]{4.3517, 50.8503, "164.128.1.1"}),
            Map.entry("Denmark - Copenhagen", new Object[]{12.5683, 55.6761, "185.129.1.1"}),
            Map.entry("Finland - Helsinki", new Object[]{24.9384, 60.1699, "135.181.1.1"}),
            Map.entry("Norway - Oslo", new Object[]{10.7522, 59.9139, "158.37.1.1"}),
            Map.entry("Switzerland - Zurich", new Object[]{8.5417, 47.3769, "130.59.1.1"}),
            Map.entry("Poland - Warsaw", new Object[]{21.0122, 52.2297, "149.156.1.1"}),
            Map.entry("Saudi Arabia - Riyadh", new Object[]{46.6753, 24.7136, "37.126.1.1"}),
            Map.entry("Israel - Tel Aviv", new Object[]{34.7818, 32.0853, "147.235.1.1"}),
            Map.entry("China - Beijing", new Object[]{116.4074, 39.9042, "114.247.1.1"}),
            Map.entry("China - Shanghai", new Object[]{121.4737, 31.2304, "101.227.1.1"}),
            Map.entry("New Zealand - Auckland", new Object[]{174.7633, -36.8485, "202.49.1.1"}),
            Map.entry("Nigeria - Lagos", new Object[]{3.3792, 6.5244, "102.67.1.1"}),
            Map.entry("Kenya - Nairobi", new Object[]{36.8219, -1.2921, "196.201.1.1"}),
            Map.entry("Chile - Santiago", new Object[]{-70.6693, -33.4489, "190.160.1.1"}),
            Map.entry("USA - San Francisco", new Object[]{-122.4194, 37.7749, "192.174.1.1"}),
            Map.entry("USA - Chicago", new Object[]{-87.6298, 41.8781, "192.174.2.1"}),
            Map.entry("Austria - Vienna", new Object[]{16.3738, 48.2082, "193.170.1.1"}),
            Map.entry("India - New Delhi", new Object[]{77.2090, 28.6139, "103.21.127.1"}),
            Map.entry("Canada - Vancouver", new Object[]{-123.1207, 49.2827, "199.60.1.1"})
    );
    
    public KafkaConsumerService(AttackEventRepository repository, LiveEventHandler liveEventHandler, GeoIPService geoIPService, RedisService redisService) {
        this.repository = repository;
        this.liveEventHandler = liveEventHandler;
        this.geoIPService = geoIPService;
        this.redisService = redisService;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(topics = "attack-events", groupId = "attack-group")
    public void consumeAttackEvent(String message) {
        try {
            Map<String, String> rawData = objectMapper.readValue(message, new TypeReference<Map<String, String>>() {});
            String ip = rawData.get("ip");
            String attackType = rawData.get("type");

            if (ip == null) return; 

            Double lat = geoIPService.getLatitude(ip);
            Double lon = geoIPService.getLongitude(ip);

            if (lat != null && lon != null) {
                String country = geoIPService.getCountryName(ip);
                String city = geoIPService.getCity(ip);
                int severity = random.nextInt(5) + 1;   

                // 1. CHỌN NGẪU NHIÊN 1 TRẠM ĐÍCH
                List<String> targetCountries = new ArrayList<>(HONEYPOTS.keySet());
                String targetCountry = targetCountries.get(random.nextInt(targetCountries.size()));
                Object[] targetData = HONEYPOTS.get(targetCountry);
                Double destLon = (Double) targetData[0];
                Double destLat = (Double) targetData[1];
                String destIp = (String) targetData[2];

                // 2. KHỞI TẠO ĐỐI TƯỢNG EVENT ĐỂ LƯU DATABASE
                AttackEvent event = new AttackEvent();
                event.setId(UUID.randomUUID());
                event.setTimestamp(Instant.now());
                event.setSrcIp(ip); 
                event.setDstIp(destIp); 
                event.setSrcLat(lat);
                event.setSrcLng(lon);
                event.setAttackType(attackType != null ? attackType : "Botnet Traffic");
                event.setSeverity(severity);
                event.setCountry(country);
                event.setCity(city);
                event.setRawPayload(message);

                // 3. LƯU DATABASE XONG MỚI BẮN WEBSOCKET (Tránh lỗi chưa lưu xong đã click)
                repository.save(event)
                        .doOnSuccess(savedEvent -> {
                            // Khi vào được đây, nghĩa là Database đã Commit thành công 100%
                            System.out.println("ĐÃ LƯU DB: " + savedEvent.getSrcIp() + " -> " + destIp);
                            // ============================================
                            // UPDATE REDIS REAL-TIME TẠI ĐÂY
                            // Tăng đếm cho Toàn cầu (WORLD)
                            redisService.incrementAttackCount("WORLD", savedEvent.getAttackType());
                            // Tăng đếm riêng cho Quốc gia đích
                            redisService.incrementAttackCount(targetCountry, savedEvent.getAttackType());
                            // ============================================
                            try {
                                // TIẾN HÀNH BẮN SỰ KIỆN LÊN WEBSOCKET 
                                Map<String, Object> frontendEvent = new HashMap<>();
                                
                                // FIX: Thêm ID để Frontend gọi API /api/events/{id} mở Modal
                                frontendEvent.put("id", savedEvent.getId().toString()); 
                                
                                frontendEvent.put("from", new Double[]{lon, lat});
                                frontendEvent.put("to", new Double[]{destLon, destLat});
                                frontendEvent.put("ip", ip);
                                frontendEvent.put("dstIp", destIp);
                                frontendEvent.put("type", savedEvent.getAttackType());
                                
                                // FIX: Truyền cả mức độ nghiêm trọng đồng bộ với DB
                                frontendEvent.put("severity", savedEvent.getSeverity()); 
                                
                                frontendEvent.put("fromCountry", country != null ? country : "Unknown");
                                frontendEvent.put("fromCity", city != null ? city : "Unknown City"); 
                                frontendEvent.put("toCountry", targetCountry);

                                String frontendJson = objectMapper.writeValueAsString(frontendEvent);
                                liveEventHandler.broadcast(frontendJson);
                                
                            } catch (Exception ex) {
                                System.err.println("LỖI TẠO JSON WS: " + ex.getMessage());
                            }
                        })
                        .doOnError(err -> System.err.println("LỖI DB: " + err.getMessage()))
                        .subscribe();
            }

        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
        }
    }
}