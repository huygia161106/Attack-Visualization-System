package com.attvs.backend.controller;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import com.attvs.backend.repository.AttackEventRepository;

@RestController
public class EventController {

    private final AttackEventRepository repository;

    public EventController(AttackEventRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/api/events")
    public Flux<AttackEvent> getAllEvents() {
        return repository.findAll();
    }
}
