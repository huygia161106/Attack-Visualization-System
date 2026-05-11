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
    
    private final GeoIPService geoIPService; 
    private final Random random = new Random();

    // DANH SÁCH 10 TRẠM CẢM BIẾN (HONEYPOTS) - [Kinh độ, Vĩ độ, IP Ảo]
    private final Map<String, Object[]> HONEYPOTS = Map.of(
            "Vietnam", new Object[]{106.8031, 10.8701, "14.225.192.112"},
            "United States", new Object[]{-77.0369, 38.9072, "104.16.12.3"},
            "Germany", new Object[]{8.6821, 50.1109, "3.120.54.2"},
            "Japan", new Object[]{139.6503, 35.6762, "13.230.12.4"},
            "Singapore", new Object[]{103.8198, 1.3521, "52.74.12.5"},
            "United Kingdom", new Object[]{-0.1278, 51.5074, "8.18.43.21"},
            "Australia", new Object[]{151.2093, -33.8688, "139.130.4.5"},
            "Brazil", new Object[]{-43.1729, -22.9068, "187.12.44.3"},
            "South Korea", new Object[]{126.9780, 37.5665, "211.23.45.1"},
            "France", new Object[]{2.3522, 48.8566, "192.99.12.4"}
    );
    
    public KafkaConsumerService(AttackEventRepository repository, LiveEventHandler liveEventHandler, GeoIPService geoIPService) {
        this.repository = repository;
        this.liveEventHandler = liveEventHandler;
        this.geoIPService = geoIPService;
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
                int severity = random.nextInt(3) + 3; 

                // 1. CHỌN NGẪU NHIÊN 1 TRẠM ĐÍCH
                List<String> targetCountries = new ArrayList<>(HONEYPOTS.keySet());
                String targetCountry = targetCountries.get(random.nextInt(targetCountries.size()));
                Object[] targetData = HONEYPOTS.get(targetCountry);
                Double destLon = (Double) targetData[0];
                Double destLat = (Double) targetData[1];
                String destIp = (String) targetData[2];

                // 2. LƯU DATABASE (Lưu IP của trạm đích)
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

                repository.save(event)
                        .doOnSuccess(saved -> System.out.println("ĐÃ LƯU DB: " + saved.getSrcIp() + " -> " + destIp))
                        .doOnError(err -> System.err.println("LỖI DB: " + err.getMessage()))
                        .subscribe();

                // 3. BẮN SỰ KIỆN LÊN WEBSOCKET (ĐA NGUỒN - ĐA ĐÍCH)
                // BẮN SỰ KIỆN LÊN WEBSOCKET (ĐA NGUỒN - ĐA ĐÍCH)
                Map<String, Object> frontendEvent = new HashMap<>();
                frontendEvent.put("from", new Double[]{lon, lat});
                frontendEvent.put("to", new Double[]{destLon, destLat});
                frontendEvent.put("ip", ip);
                frontendEvent.put("dstIp", destIp); // <-- THÊM DÒNG NÀY ĐỂ TRUYỀN IP ĐÍCH CỤ THỂ XUỐNG FRONTEND
                frontendEvent.put("type", event.getAttackType());
                frontendEvent.put("fromCountry", country != null ? country : "Unknown");
                // THÊM DÒNG NÀY ĐỂ TRUYỀN CITY LÊN WEB:
                frontendEvent.put("fromCity", city != null ? city : "Unknown City"); 
                frontendEvent.put("toCountry", targetCountry);

                String frontendJson = objectMapper.writeValueAsString(frontendEvent);
                liveEventHandler.broadcast(frontendJson);
            }

        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
        }
    }
}