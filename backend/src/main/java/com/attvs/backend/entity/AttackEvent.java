package com.attvs.backend.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

import java.net.InetAddress;
import java.time.Instant;
import java.util.UUID;

@Table("attack_events")
public class AttackEvent {
    @Id
    private UUID id;
    private Instant timestamp;
    private InetAddress srcIp;
    private InetAddress dstIp;
    private Double srcLat; // vĩ độ
    private Double srcLng; // kinh độ
    private String attackType; // DDoS, SQLi...
    private Integer severity; // 1-5
    private String country; // ISO code
    private String city;
    private String rawPayload; // JSON dạng String

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

    public InetAddress getDstIp() {
        return dstIp;
    }

    public InetAddress getSrcIp() {
        return srcIp;
    }

    public void setSrcIp(InetAddress srcIp) {
        this.srcIp = srcIp;
    }

    public void setDstIp(InetAddress dstIp) {
        this.dstIp = dstIp;
    }
}