package com.attvs.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
public class ThreatDataProducerService {

    private final WebClient webClient;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();
    
    // Tên topic phải khớp chính xác với bên Consumer
    private static final String TOPIC = "attack-events";
    
    // Tự sinh loại tấn công vì SANS không trả về field này
    private final String[] ATTACK_TYPES = {"Port Scan", "DDoS", "SSH Brute-force", "SQL Injection"};

    public ThreatDataProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        // Đổi base URL về SANS và thêm User-Agent giả mạo trình duyệt để lách Cloudflare
        this.webClient = WebClient.builder()
                .baseUrl("https://isc.sans.edu/api/topips/100?json")
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // Nên để 120 giây (2 phút) 1 lần để tránh bị SANS khóa IP
    @Scheduled(initialDelay = 3000, fixedDelay = 120000)
    public void fetchAndPublish() {
        System.out.println("[PRODUCER] Đang cào IP thô từ SANS ISC...");

        webClient.get()
                .retrieve()
                // Bắt buộc phải đọc dưới dạng String thô để lách lỗi "text/json" của SANS
                .bodyToMono(String.class)
                .subscribe(responseString -> {
                    try {
                        List<Map<String, Object>> items = objectMapper.readValue(
                                responseString, new TypeReference<List<Map<String, Object>>>() {}
                        );
                        System.out.println("[PRODUCER] Lấy được " + items.size() + " IPs từ SANS. Bắt đầu đẩy vào Kafka...");
                        
                        for (Map<String, Object> item : items) {
                            // Cấu trúc của SANS chứa IP trong trường "source"
                            String ip = (String) item.get("source");
                            String attackType = ATTACK_TYPES[random.nextInt(ATTACK_TYPES.length)];

                            // Đóng gói Data thô (Chưa có tọa độ)
                            Map<String, String> rawData = new HashMap<>();
                            rawData.put("ip", ip);
                            rawData.put("type", attackType);

                            // BẮN THẲNG VÀO KAFKA
                            String payload = objectMapper.writeValueAsString(rawData);
                            kafkaTemplate.send(TOPIC, payload);
                        }
                    } catch (Exception e) {
                        System.err.println("[PRODUCER] Lỗi parse JSON SANS: " + e.getMessage());
                    }
                }, error -> System.err.println("[PRODUCER] SANS chặn IP (Lỗi mạng hoặc 522): " + error.getMessage()));
    }
}