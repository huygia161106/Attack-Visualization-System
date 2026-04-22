package com.attvs.backend.repository;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.UUID;

public interface AttackEventRepository extends ReactiveCrudRepository<AttackEvent, UUID> {
}
