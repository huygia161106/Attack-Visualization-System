package com.attvs.backend.service;

import com.attvs.backend.entity.AttackEvent;
import com.attvs.backend.handler.LiveEventHandler; // MỚI THÊM
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
    private final LiveEventHandler liveEventHandler;

    public KafkaConsumerService(AttackEventRepository repository, LiveEventHandler liveEventHandler) {
        this.repository = repository;
        this.liveEventHandler = liveEventHandler; // MỚI THÊM
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    @KafkaListener(topics = "attack-events", groupId = "attack-group")
    public void consumeAttackEvent(String message) {
        try {
            AttackEvent event = objectMapper.readValue(message, AttackEvent.class);
            if (event.getId() == null) event.setId(UUID.randomUUID());
            if (event.getTimestamp() == null) event.setTimestamp(Instant.now());

            event.setRawPayload(message);

            // 1. Lưu DB
            repository.save(event)
                    .doOnSuccess(saved -> System.out.println("✅ ĐÃ LƯU KHO: " + saved.getSrcIp()))
                    .doOnError(err -> System.err.println("❌ LỖI DB: " + err.getMessage()))
                    .subscribe();

            //SEND MESSAGE TO FRONTEND
            liveEventHandler.broadcast(message);
            System.out.println("FR!");

        } catch (Exception e) {
            System.err.println("JSON DECODING ERROR: " + e.getMessage());
        }
    }
}