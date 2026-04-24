package com.attvs.backend.controller;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.data.domain.Sort;
import org.springframework.data.r2dbc.core.R2dbcEntityTemplate;
import org.springframework.data.relational.core.query.Criteria;
import org.springframework.data.relational.core.query.Query;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import com.attvs.backend.repository.AttackEventRepository;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

//HÀM ĐỂ XỬ LÝ REQUEST
@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final AttackEventRepository repository;
    private final R2dbcEntityTemplate r2dbcEntityTemplate;

    public EventController(AttackEventRepository repository, R2dbcEntityTemplate r2dbcEntityTemplate) {
        this.repository = repository;
        this.r2dbcEntityTemplate = r2dbcEntityTemplate;
    }


    @GetMapping
    public Flux<AttackEvent> getEvents(@RequestParam(required = false) String from,
                                       @RequestParam(required = false) String to,
                                       @RequestParam(required = false, defaultValue = "100") int limit,
                                       @RequestParam(required = false) String country,
                                       @RequestParam(name = "attack_type", required = false) String attackType,
                                       @RequestParam(name = "severity_min", required = false, defaultValue = "1") int severityMin)
    {
        //TINH THOI GIAN CHO TO VA FROM
        Instant toInstant = (to != null) ? Instant.parse(to) : Instant.now();
        Instant fromInstant = (from != null) ? Instant.parse(from) : toInstant.minus(1, ChronoUnit.HOURS);

        //TẠO SQL QUERY ĐỘNG
        Criteria criteria = Criteria.where("timestamp").between(fromInstant, toInstant)
                                    .and("severity").greaterThanOrEquals(severityMin);

        if(country != null) criteria = criteria.and("country").is(country);
        if(attackType != null) criteria = criteria.and("attackType").is(attackType);
        int finalLimit = Math.min(limit, 1000);

        Query query = Query.query(criteria).sort(Sort.by(Sort.Direction.DESC, "timestamp"))
                                           .limit(finalLimit);

        return r2dbcEntityTemplate.select(AttackEvent.class).from("attack_events").matching(query).all();
    }



    //TOP 10
    @GetMapping("/top-sources")
    public Flux<Map<String,Object>> getTop10Sources(){
        return repository.getTopSources(10);
    }




    @GetMapping("/stats")
    public Mono<Map<String,Object>> getStatus(){
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
