package com.attvs.backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("attack_events")
public class AttackEvent implements Persistable<UUID> {
    @Id
    private UUID id;
    private Instant timestamp;
    private String srcIp;
    private String attackType;
    private int severity;

    // Dòng này cực kỳ quan trọng: Ép Spring Boot dùng lệnh INSERT thay vì UPDATE
    @Transient
    private boolean isNew = true;

    public AttackEvent() {}

    public AttackEvent(UUID id, Instant timestamp, String srcIp, String attackType, int severity) {
        this.id = id;
        this.timestamp = timestamp;
        this.srcIp = srcIp;
        this.attackType = attackType;
        this.severity = severity;
    }

    // Các hàm bắt buộc của Persistable
    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    // Getters & Setters
    public void setId(UUID id) { this.id = id; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getSrcIp() { return srcIp; }
    public void setSrcIp(String srcIp) { this.srcIp = srcIp; }
    public String getAttackType() { return attackType; }
    public void setAttackType(String attackType) { this.attackType = attackType; }
    public int getSeverity() { return severity; }
    public void setSeverity(int severity) { this.severity = severity; }
}