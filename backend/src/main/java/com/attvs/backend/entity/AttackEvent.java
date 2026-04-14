package com.attvs.backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("attack_events")
public class AttackEvent {
    @Id
    private UUID id;
    private Instant timestamp;
    private String srcIp;
    private String attackType;
    private int severity;

    public AttackEvent() {}

    public AttackEvent(UUID id, Instant timestamp, String srcIp, String attackType, int severity) {
        this.id = id;
        this.timestamp = timestamp;
        this.srcIp = srcIp;
        this.attackType = attackType;
        this.severity = severity;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public void setSrcIp(String srcIp) {
        this.srcIp = srcIp;
    }

    public void setAttackType(String attackType) {
        this.attackType = attackType;
    }

    public void setSeverity(int severity) {
        this.severity = severity;
    }

    public UUID getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getSrcIp() {
        return srcIp;
    }

    public String getAttackType() {
        return attackType;
    }

    public int getSeverity() {
        return severity;
    }
}
