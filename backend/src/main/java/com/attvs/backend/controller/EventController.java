package com.attvs.backend.controller;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import com.attvs.backend.repository.AttackEventRepository;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

//HÀM ĐỂ XỬ LÝ REQUEST
@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final AttackEventRepository repository;

    public EventController(AttackEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/events")
    public Flux<AttackEvent> get100LatestEvents() {
        return repository.findTop100ByOrderByTimestampDesc();
    }

    //TOP 10
    @GetMapping("/top-sources")
    public Flux<Map<String,Object>> getTop10Sources(){
        return repository.getTopSources(10);
    }
    @GetMapping("/stats")
    public Mono<Map<String,Object>> gétStatus(){
        return repository.count()
                         //LAMBDA EXPRESSION SẼ TRẢ VỀ MONO<MAP<STRING,OBJECT>> NÊN CẦN FLATMAP ĐỂ FLATTEN
                         .flatMap(total -> repository.getAttackTypeStats()
                                                           //BIẾN NHIỀU LẦN LẦN TRẢ MAP<> CỦA ATTACK TYPE THÀNH 1 LIST DUY NHẤT ĐỂ
                                                           //NHANH CHÓNG TRẢ VỀ CHO FRONTEND
                                                           .collectList()
                                                           .map(types -> {
                                                               HashMap<String,Object> result = new HashMap<>();
                                                               result.put("totalEvents",total);
                                                               result.put("attackTypes",types);
                                                               return result;
                                                           }
                         )
        );
    }

    @GetMapping("/by-country")
    public Flux<Map<String,Object>> getByCountry(){
        return repository.getStatsByCountry();
    }

    @GetMapping("/{id}")
    public Mono<AttackEvent> getEventById(@PathVariable UUID id){
        return repository.findById(id);
    }
}
