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
    
    private static final String TOPIC = "attack-events";
    
    // 1. MỞ RỘNG DANH SÁCH LOẠI TẤN CÔNG (Giúp biểu đồ tròn đa dạng hơn)
    private final String[] ATTACK_TYPES = {
        "Port Scan", "DDoS", "SSH Brute-force", "SQL Injection",
        "XSS Exploit", "Ransomware", "Zero-Day Attack", 
        "Credential Stuffing", "Malware Infection"
    };

    // 2. CẤU HÌNH KỊCH BẢN CAO ĐIỂM (SPIKE) CHO BUỔI DEMO
    private long lastSpikeStartTime = System.currentTimeMillis();
    private boolean isSpikeMode = false;
    private final long SPIKE_INTERVAL = 5 * 60 * 1000; // 5 phút (300.000 ms)
    private final long SPIKE_DURATION = 20 * 1000;     // Kéo dài 20 giây

    public ThreatDataProducerService(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        // Giả lập User-Agent của Chrome
        this.webClient = WebClient.builder()
                .baseUrl("https://isc.sans.edu/api/topips/100?json")
                .defaultHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .build();
        this.objectMapper = new ObjectMapper();
    }

    // =================================================================
    // LUỒNG 1: Lấy IP thật từ SANS (Chạy 2 phút/lần để an toàn, không bị khóa IP)
    // =================================================================
    @Scheduled(initialDelay = 3000, fixedDelay = 120000)
    public void fetchRealIpsFromSANS() {
        System.out.println("[PRODUCER-SANS] Đang cào IP thô từ SANS ISC...");

        webClient.get()
                .retrieve()
                .bodyToMono(String.class)
                .subscribe(responseString -> {
                    try {
                        List<Map<String, Object>> items = objectMapper.readValue(
                                responseString, new TypeReference<List<Map<String, Object>>>() {}
                        );
                        System.out.println("[PRODUCER-SANS] Lấy thành công " + items.size() + " IPs thật.");
                        
                        for (Map<String, Object> item : items) {
                            String ip = (String) item.get("source");
                            String attackType = ATTACK_TYPES[random.nextInt(ATTACK_TYPES.length)];
                            sendToKafka(ip, attackType);
                        }
                    } catch (Exception e) {
                        System.err.println("[PRODUCER-SANS] Lỗi parse JSON SANS: " + e.getMessage());
                    }
                }, error -> {
                    System.err.println("[PRODUCER-SANS] SANS chặn IP (Lỗi mạng hoặc 522). Đã có luồng Mock lo.");
                });
    }

    // =================================================================
    // LUỒNG 2: Stream thời gian thực + Kịch bản dội bom (Chạy 2 giây/lần)
    // Giúp giao diện nhảy số liên tục, mượt mà và tạo đợt cao điểm
    // =================================================================
    @Scheduled(initialDelay = 5000, fixedRate = 2000) // Đã trả lại nhịp độ 2 giây/lần
    public void simulateRealtimeTraffic() {
        long now = System.currentTimeMillis();

        // Kiểm tra kích hoạt Cao Điểm
        if (!isSpikeMode && (now - lastSpikeStartTime > SPIKE_INTERVAL)) {
            isSpikeMode = true;
            System.out.println("🚨 [WARNING] PHÁT HIỆN ĐỢT TẤN CÔNG CAO ĐIỂM! HỆ THỐNG ĐANG BỊ DỘI BOM!");
        }

        // Kiểm tra kết thúc Cao Điểm
        if (isSpikeMode && (now - lastSpikeStartTime > SPIKE_INTERVAL + SPIKE_DURATION)) {
            isSpikeMode = false;
            lastSpikeStartTime = now; // Reset lại đồng hồ cho đợt tiếp theo
            System.out.println("✅ [INFO] ĐỢT TẤN CÔNG CAO ĐIỂM ĐÃ KẾT THÚC. HỆ THỐNG ỔN ĐỊNH.");
        }

        int eventCount;
        
        if (isSpikeMode) {
            // ĐANG BỊ DỘI BOM: Vẫn giữ tần suất cao (ví dụ 20-30 cuộc/2s)
            eventCount = random.nextInt(11) + 20; 
        } else {
            // BÌNH THƯỜNG: Sinh ngẫu nhiên từ 1 đến 3 cuộc tấn công
            eventCount = random.nextInt(3) + 1;
        }

        for (int i = 0; i < eventCount; i++) {
            // Sinh IP Public ngẫu nhiên
            String mockIp = (random.nextInt(223) + 1) + "." + 
                            random.nextInt(256) + "." + 
                            random.nextInt(256) + "." + 
                            (random.nextInt(254) + 1);
                            
            String attackType = ATTACK_TYPES[random.nextInt(ATTACK_TYPES.length)];
            
            // Nếu đang cao điểm, ép 60% đòn đánh là DDoS
            if (isSpikeMode && random.nextInt(100) < 60) {
                attackType = "DDoS";
            }
            
            sendToKafka(mockIp, attackType);
        }
    }

    // Hàm phụ trợ đóng gói đẩy lên Kafka
    private void sendToKafka(String ip, String attackType) {
        try {
            Map<String, String> rawData = new HashMap<>();
            rawData.put("ip", ip);
            rawData.put("type", attackType);
            String payload = objectMapper.writeValueAsString(rawData);
            kafkaTemplate.send(TOPIC, payload);
        } catch (Exception e) {
            System.err.println("Lỗi đóng gói gửi Kafka: " + e.getMessage());
        }
    }
}