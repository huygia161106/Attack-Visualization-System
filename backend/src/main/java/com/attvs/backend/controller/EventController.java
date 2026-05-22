package com.attvs.backend.controller;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.entity.StatResponse;
import com.attvs.backend.repository.AttackEventRepository;
import com.attvs.backend.service.RedisService;

import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final AttackEventRepository repository;
    private final RedisService redisService;

    public EventController(AttackEventRepository repository, RedisService redisService) {
        this.repository = repository;
        this.redisService = redisService;
    }

    @GetMapping("")
    public Flux<AttackEvent> get100LatestEvents() {
        return repository.findTop100ByOrderByTimestampDesc();
    }

    // Đã sửa lỗi đánh máy StatRespoGia Huynse -> StatResponse
    @GetMapping("/top-sources")
    public Flux<StatResponse> getTop10Sources(){
        return repository.getTopSources(10);
    }

    // 🔥 CẬP NHẬT LỚN: Tối ưu WebFlux (Mono.zip) và trả về thêm totalUniqueIps
    @GetMapping("/stats")
    public Mono<Map<String,Object>> getStatus(){
        // 1. Chạy 5 luồng truy vấn song song siêu tốc độ
        Mono<Long> totalEventsMono = repository.count();
        Mono<Long> uniqueIpsMono = repository.countUniqueSourceIps();
        Mono<java.util.List<StatResponse>> attackTypesMono = repository.getAttackTypeStats().collectList();
        Mono<Long> highSevMono = repository.countHighSeverity();
        Mono<java.util.List<StatResponse>> severityStatsMono = repository.getSeverityStats().collectList();

        // 2. Gộp 5 kết quả lại trả về cho giao diện
        return Mono.zip(totalEventsMono, uniqueIpsMono, attackTypesMono, highSevMono, severityStatsMono)
            .map(tuple -> {
                HashMap<String,Object> result = new HashMap<>();
                result.put("totalEvents", tuple.getT1());
                result.put("totalUniqueIps", tuple.getT2());
                result.put("attackTypes", tuple.getT3());
                result.put("highSeverityCount", tuple.getT4()); // Dữ liệu mới
                result.put("severityDistribution", tuple.getT5()); // Dữ liệu mới
                return result;
            });
    }

    @GetMapping("/by-country")
    public Flux<StatResponse> getByCountry(){
        return repository.getStatsByCountry();
    }

    @GetMapping("/{id}")
    public Mono<AttackEvent> getEventById(@PathVariable UUID id){
        return repository.findById(id);
    }

    @GetMapping("/stats/redis")
    public Mono<Map<String, Map<Object, Object>>> getGlobalStatsFromRedis() {
        return Mono.just(redisService.getAllGlobalStats());
    }
}