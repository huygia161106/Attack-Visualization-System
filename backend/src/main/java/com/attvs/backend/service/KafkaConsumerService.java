package com.attvs.backend.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class KafkaConsumerService {

    // Đứng canh ở băng chuyền Kafka tên "attack-events"
    @KafkaListener(topics = "attack-events", groupId = "attack-group")
    public void consumeAttackEvent(String message) {
        System.out.println("🔥 NI ROI CAC CHAU OI! Kafka attacked: " + message);


    }
}