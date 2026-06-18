package com.attvs.backend.repository;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.entity.StatResponse;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AttackEventRepository extends ReactiveCrudRepository<AttackEvent, UUID> {

    Flux<AttackEvent> findTop100ByOrderByTimestampDesc();

    // Thay Map bằng StatResponse
    @Query("SELECT attack_type as type, COUNT(*) as count FROM attack_events GROUP BY attack_type ORDER BY count DESC")
    Flux<StatResponse> getAttackTypeStats();

    // Thay Map bằng StatResponse
    // ĐỔI THÀNH: TOP N IP BỊ TẤN CÔNG NHIỀU NHẤT (ĐÍCH)
    @Query("SELECT dst_ip as ip, COUNT(*) as count FROM attack_events GROUP BY dst_ip ORDER BY count DESC LIMIT :limit")
    Flux<StatResponse> getTopSources(int limit);
    
    @Query("SELECT country, COUNT(*) as count FROM attack_events GROUP BY country")
    Flux<StatResponse> getStatsByCountry();

    Mono<Long> count();

    // 🔥 CẬP NHẬT MỚI: Đếm tổng số IP nguồn (độc hại) duy nhất từ trước đến nay
    @Query("SELECT COUNT(DISTINCT src_ip) FROM attack_events")
    Mono<Long> countUniqueSourceIps();

    // XÓA SỰ KIỆN CŨ HƠN 24 GIỜ (DÙNG CHO LÀM SẠCH DB, KHÔNG PHẢI CHO FRONTEND)
    @Modifying
    @Query("DELETE FROM attack_events WHERE timestamp < :cutoffTime")
    Mono<Integer> deleteOldEvents(Instant cutoffTime);

    // Đếm phân bố 5 mức độ nghiêm trọng
    @Query("SELECT CAST(severity AS VARCHAR) as type, COUNT(*) as count FROM attack_events GROUP BY severity")
    Flux<StatResponse> getSeverityStats();

    // Đếm tổng số cuộc tấn công mức độ cao (Level 4 & 5)
    @Query("SELECT COUNT(*) FROM attack_events WHERE severity >= 4")
    Mono<Long> countHighSeverity();
}