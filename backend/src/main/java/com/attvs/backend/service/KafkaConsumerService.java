package com.attvs.backend.service;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.handler.LiveEventHandler;
import com.attvs.backend.repository.AttackEventRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
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

    // Tọa độ đích (Ví dụ: UIT)
    private final Double[] DEST_COORDS = {106.8031, 10.8701};
    private final String TARGET_IP = "14.225.192.112";

    public KafkaConsumerService(AttackEventRepository repository, LiveEventHandler liveEventHandler, GeoIPService geoIPService) {
        this.repository = repository;
        this.liveEventHandler = liveEventHandler;
        this.geoIPService = geoIPService;
        this.objectMapper = new ObjectMapper();
        // ĐÃ XÓA DÒNG JavaTimeModule ĐỂ TRÁNH LỖI ĐỎ
    }

    @KafkaListener(topics = "attack-events", groupId = "attack-group")
    public void consumeAttackEvent(String message) {
        try {
            // ĐÃ FIX CẢNH BÁO VÀNG BẰNG TypeReference
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

                AttackEvent event = new AttackEvent();
                event.setId(UUID.randomUUID());
                event.setTimestamp(Instant.now());
                event.setSrcIp(ip); 
                event.setDstIp(TARGET_IP);
                event.setSrcLat(lat);
                event.setSrcLng(lon);
                event.setAttackType(attackType != null ? attackType : "Botnet Traffic");
                event.setSeverity(severity);
                event.setCountry(country);
                event.setCity(city);
                event.setRawPayload(message);

                repository.save(event)
                        .doOnSuccess(saved -> System.out.println("ĐÃ LƯU DB: " + saved.getSrcIp()))
                        .doOnError(err -> System.err.println("LỖI DB: " + err.getMessage()))
                        .subscribe();

                Map<String, Object> frontendEvent = new HashMap<>();
                frontendEvent.put("from", new Double[]{lon, lat});
                frontendEvent.put("to", DEST_COORDS);
                frontendEvent.put("ip", ip);
                frontendEvent.put("type", event.getAttackType());
                frontendEvent.put("fromCountry", country != null ? country : "Unknown");
                frontendEvent.put("toCountry", "Vietnam");

                String frontendJson = objectMapper.writeValueAsString(frontendEvent);
                liveEventHandler.broadcast(frontendJson);
                System.out.println("ĐÃ BẮN SỰ KIỆN LÊN WEBSOCKET!");
            }

        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
        }
    }
}