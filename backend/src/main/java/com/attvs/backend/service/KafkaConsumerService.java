package com.attvs.backend.service;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.repository.AttackEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.UUID;

@Service
public class KafkaConsumerService {

    private final AttackEventRepository repository;
    private final ObjectMapper objectMapper;


    public KafkaConsumerService(AttackEventRepository repository) {
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
        // Để Jackson đọc được kiểu dữ liệu thời gian (Instant, LocalDateTime)
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @KafkaListener(topics = "attack-events", groupId = "attack-group")
    public void consumeAttackEvent(String message) {
        try {

            AttackEvent event = objectMapper.readValue(message, AttackEvent.class);

            if (event.getId() == null) event.setId(UUID.randomUUID());
            if (event.getTimestamp() == null) event.setTimestamp(Instant.now());

            repository.save(event)
                    .doOnSuccess(saved -> System.out.println("DB SAVED: ID=" + saved.getId() + " IP=" + saved.getSrcIp()))
                    .doOnError(err -> System.err.println("DB ERROR: " + err.getMessage()))
                    .subscribe(); // IMPORTANT!!!!!!!!!!!!!!!!!!!!!!!!

        } catch (Exception e) {
            System.err.println("JSON DECODING ERROR: " + e.getMessage());
        }
    }
}