package repository;

import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.awt.desktop.AboutEvent;
import java.util.UUID;

public interface AttackEventRepository extends ReactiveCrudRepository<AboutEvent, UUID> {
}
