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
    private String dstIp;
    private Double srcLat; // vĩ độ
    private Double srcLng; // kinh độ
    private String attackType; // DDoS, SQLi...
    private Integer severity; // 1-5
    private String country; // ISO code
    private String city;
    private String rawPayload; // JSON dạng String

    @Transient
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }
    // -----------------------------------------------------------------

    public void setId(UUID id) {
        this.id = id;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public void setSrcLat(Double srcLat) {
        this.srcLat = srcLat;
    }

    public void setSrcLng(Double srcLng) {
        this.srcLng = srcLng;
    }

    public void setAttackType(String attackType) {
        this.attackType = attackType;
    }

    public void setSeverity(Integer severity) {
        this.severity = severity;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public void setRawPayload(String rawPayload) {
        this.rawPayload = rawPayload;
    }

    @Override
    public UUID getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public Double getSrcLat() {
        return srcLat;
    }

    public Double getSrcLng() {
        return srcLng;
    }

    public String getAttackType() {
        return attackType;
    }

    public Integer getSeverity() {
        return severity;
    }

    public String getCountry() {
        return country;
    }

    public String getCity() {
        return city;
    }

    public String getRawPayload() {
        return rawPayload;
    }

    public String getDstIp() {
        return dstIp;
    }

    public String getSrcIp() {
        return srcIp;
    }

    public void setSrcIp(String srcIp) {
        this.srcIp = srcIp;
    }

    public void setDstIp(String dstIp) {
        this.dstIp = dstIp;
    }
}