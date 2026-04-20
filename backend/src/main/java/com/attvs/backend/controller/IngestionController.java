package com.attvs.backend.controller;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // CHO PHÉP MỌI REQUEST ĐI VÀO BACKEND MÀ KHÔNG CHẶN
public class IngestionController {

    // MÁY PHÁT MESSAGE LÊN KAFKA
    private final KafkaTemplate<String, String> kafkaTemplate;

    public IngestionController(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    // ENDPOINT ĐỂ TEST API
    @PostMapping("/attack/simulator")
    public String simulateAttack(@RequestBody String payload) {

        kafkaTemplate.send("attack-events", payload);

        System.out.println("ĐÃ BẮN MESSAGE VÀO KAFKA: " + payload);
        return "SUCCESS";
    }
}