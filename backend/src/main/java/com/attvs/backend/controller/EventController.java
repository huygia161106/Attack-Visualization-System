package com.attvs.backend.controller;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.entity.StatResponse; // Import thêm DTO này
import com.attvs.backend.repository.AttackEventRepository;
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

    public EventController(AttackEventRepository repository) {
        this.repository = repository;
    }

    // Đổi thành chuỗi rỗng để gọi chuẩn: localhost:8080/api/events
    @GetMapping("")
    public Flux<AttackEvent> get100LatestEvents() {
        return repository.findTop100ByOrderByTimestampDesc();
    }

    // Đổi Map thành StatResponse
    @GetMapping("/top-sources")
    public Flux<StatResponse> getTop10Sources(){
        return repository.getTopSources(10);
    }

    @GetMapping("/stats")
    public Mono<Map<String,Object>> getStatus(){
        return repository.count()
                         .flatMap(total -> repository.getAttackTypeStats()
                                                           .collectList()
                                                           .map(types -> {
                                                               HashMap<String,Object> result = new HashMap<>();
                                                               result.put("totalEvents",total);
                                                               result.put("attackTypes",types); // Types giờ là List<StatResponse>
                                                               return result;
                                                           }
                         )
        );
    }

    // Đổi Map thành StatResponse
    @GetMapping("/by-country")
    public Flux<StatResponse> getByCountry(){
        return repository.getStatsByCountry();
    }

    @GetMapping("/{id}")
    public Mono<AttackEvent> getEventById(@PathVariable UUID id){
        return repository.findById(id);
    }
}