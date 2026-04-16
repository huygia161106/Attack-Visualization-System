package com.attvs.backend.repository;

import com.attvs.backend.entity.AttackEvent;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AttackEventRepository extends ReactiveCrudRepository<AttackEvent, UUID> {

}
