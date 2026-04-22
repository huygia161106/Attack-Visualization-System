package com.attvs.backend.repository;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.UUID;

//INTERFACE ĐỂ CLASS IMPLEMENTS ĐỂ TƯƠNG TÁC VỚI POSTGRES SQL
@Repository
public interface AttackEventRepository extends ReactiveCrudRepository<AttackEvent, UUID> {

    //TÌM 100 CUỘC TẤN CÔNG MỚI NHẤT
    Flux<AttackEvent> findTop100ByOrderByTimestampDesc();

    //THỐNG KÊ TOP LOẠI TẤN CÔNG
    @Query("SELECT attack_type as type, COUNT(*) as count FROM attack_events GROUP BY attack_type ORDER BY count DESC")
    Flux<Map<String, Object>> getAttackTypeStats();

    //TOP N IP TẤN CÔNG NHIỀU NHẤT
    @Query("SELECT src_ip as ip, COUNT(*) as count FROM attack_events GROUP BY src_ip ORDER BY count DESC LIMIT :limit")
    Flux<Map<String, Object>> getTopSources(int limit);

    //THỐNG KÊ THEO QUỐC GIA
    @Query("SELECT country, COUNT(*) as count FROM attack_events GROUP BY country")
    Flux<Map<String, Object>> getStatsByCountry();

    //TỔNG SỐ SỰ KIỆN
    Mono<Long> count();
}
