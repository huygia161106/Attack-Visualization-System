package com.attvs.backend.service;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.handler.LiveEventHandler;
import com.attvs.backend.repository.AttackEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
public class SANSDataFetcherService {

    private final GeoIPService geoIPService;
    private final LiveEventHandler liveEventHandler;
    private final AttackEventRepository repository;
    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // Tọa độ đích (Ví dụ: UIT)
    private final Double[] DEST_COORDS = {106.8031, 10.8701}; 
    private final Random random = new Random();

    public SANSDataFetcherService(GeoIPService geoIPService, LiveEventHandler liveEventHandler, AttackEventRepository repository) {
        this.geoIPService = geoIPService;
        this.liveEventHandler = liveEventHandler;
        this.repository = repository;
        
        // Sử dụng API của Abuse.ch - chuyên cung cấp IP Botnet/Malware thật 100%
        this.webClient = WebClient.builder()
                .baseUrl("https://feodotracker.abuse.ch/downloads")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Scheduled(initialDelay = 3000, fixedDelay = 60000)
    public void fetchAndStreamAttacks() {
        System.out.println("[*] Đang lấy danh sách IP Botnet thực tế từ Abuse.ch...");

        webClient.get()
                .uri("/ipblocklist.json")
                .retrieve()
                .bodyToFlux(Map.class) // Abuse.ch trả về JSON xịn, không bị lỗi text/json
                .delayElements(Duration.ofMillis(300)) // Giãn cách 300ms để map vẽ mượt
                .subscribe(item -> {
                    try {
                        // Cấu trúc JSON của Abuse.ch: {"ip_address": "...", "malware": "QakBot", ...}
                        String ip = (String) item.get("ip_address");
                        String malwareFamily = (String) item.get("malware");
                        
                        // Lấy tên mã độc làm loại tấn công thật
                        String attackType = (malwareFamily != null) ? malwareFamily + " Infection" : "Botnet Traffic";

                        Double lat = geoIPService.getLatitude(ip);
                        Double lon = geoIPService.getLongitude(ip);

                        if (lat != null && lon != null) {
                            String country = geoIPService.getCountryName(ip);
                            int severity = random.nextInt(3) + 3; // Mức độ nghiêm trọng từ 3 đến 5

                            // 1. Lưu vào PostgreSQL
                            AttackEvent event = new AttackEvent(UUID.randomUUID(), Instant.now(), ip, attackType, severity);
                            repository.save(event).subscribe(
                                    saved -> {}, 
                                    err -> System.err.println("[-] Lỗi lưu Database: " + err.getMessage())
                            );

                            // 2. Chuẩn bị dữ liệu JSON cho Frontend
                            Map<String, Object> eventData = new HashMap<>();
                            eventData.put("from", new Double[]{lon, lat});
                            eventData.put("to", DEST_COORDS);
                            eventData.put("ip", ip);
                            eventData.put("type", attackType);
                            eventData.put("fromCountry", country != null ? country : "Unknown");
                            eventData.put("toCountry", "Vietnam");

                            // 3. Đẩy dữ liệu qua WebSocket
                            String jsonMessage = objectMapper.writeValueAsString(eventData);
                            liveEventHandler.broadcast(jsonMessage);
                        }
                    } catch (Exception e) {
                        // Bỏ qua nếu có 1 vài IP bị lỗi định dạng
                    }
                }, error -> {
                    System.err.println("[-] Lỗi khi gọi API Abuse.ch: " + error.getMessage());
                }, () -> {
                    System.out.println("[+] Đã quét xong đợt IP Botnet hiện tại.");
                });
    }
}