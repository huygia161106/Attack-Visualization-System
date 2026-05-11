package com.attvs.backend.entity;

public class StatResponse {
    private String ip;
    private String type;
    private Long count;
    private String country;

    // Getters
    public String getIp() { return ip; }
    public String getType() { return type; }
    public Long getCount() { return count; }
    public String getCountry() { return country; }

    // Setters
    public void setIp(String ip) { this.ip = ip; }
    public void setType(String type) { this.type = type; }
    public void setCount(Long count) { this.count = count; }
    public void setCountry(String country) { this.country = country; }
}