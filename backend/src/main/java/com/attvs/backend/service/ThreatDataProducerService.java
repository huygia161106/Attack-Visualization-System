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

@Service
public class ThreatDataProducerService {

    private final WebClient webClient;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private static final String TOPIC = "attack-events";

    public ThreatDataProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.webClient = WebClient.builder().baseUrl("https://feodotracker.abuse.ch/downloads").build();
        this.objectMapper = new ObjectMapper();
    }

    @Scheduled(initialDelay = 3000, fixedDelay = 60000)
    public void fetchAndPublish() {
        System.out.println("[PRODUCER] Đang cào IP thô từ Abuse.ch...");

        webClient.get()
                .uri("/ipblocklist.json")
                .retrieve()
                .bodyToMono(String.class)
                .subscribe(responseString -> {
                    try {
                        List<Map<String, Object>> items = objectMapper.readValue(
                                responseString, new TypeReference<List<Map<String, Object>>>() {}
                        );
                        System.out.println("[PRODUCER] Lấy được " + items.size() + " IPs. Bắt đầu đẩy vào Kafka...");
                        
                        for (Map<String, Object> item : items) {
                            String ip = (String) item.get("ip_address");
                            String malware = (String) item.get("malware");
                            String attackType = (malware != null) ? malware + " Infection" : "Botnet Traffic";

                            // Đóng gói Data thô (Chưa có tọa độ)
                            Map<String, String> rawData = new HashMap<>();
                            rawData.put("ip", ip);
                            rawData.put("type", attackType);

                            // BẮN THẲNG VÀO KAFKA
                            String payload = objectMapper.writeValueAsString(rawData);
                            kafkaTemplate.send(TOPIC, payload);
                        }
                    } catch (Exception e) {
                        System.err.println("[PRODUCER] Lỗi parse JSON: " + e.getMessage());
                    }
                }, error -> System.err.println("[PRODUCER] Lỗi gọi API: " + error.getMessage()));
    }
}
