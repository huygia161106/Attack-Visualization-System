package com.attvs.backend.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    public RedisService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    // 1. TĂNG BIẾN ĐẾM TRONG REDIS
    public void incrementAttackCount(String country, String attackType) {
        // Tạo Key theo định dạng: "stats:WORLD" hoặc "stats:Vietnam"
        String redisKey = "stats:" + country;
        // Dùng cấu trúc Hash của Redis: Trong Key "stats:Vietnam" sẽ có trường "DDoS" = +1
        redisTemplate.opsForHash().increment(redisKey, attackType, 1);
    }

    // 2. GOM TẤT CẢ THỐNG KÊ CỦA MỌI QUỐC GIA ĐỂ TRẢ VỀ CHO FRONTEND 1 LẦN
    public Map<String, Map<Object, Object>> getAllGlobalStats() {
        Set<String> keys = redisTemplate.keys("stats:*");
        if (keys == null || keys.isEmpty()) return Map.of();

        return keys.stream().collect(Collectors.toMap(
                key -> key.replace("stats:", ""), // Lấy tên nước làm Key (VD: "Vietnam")
                key -> redisTemplate.opsForHash().entries(key) // Lấy danh sách các mã độc và số lượng
        ));
    }
}