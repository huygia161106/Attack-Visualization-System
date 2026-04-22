package com.attvs.backend.service;

import com.maxmind.geoip2.DatabaseReader;
import com.maxmind.geoip2.model.CityResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.net.InetAddress;

@Service
public class GeoIPService {

    private DatabaseReader reader;

    @Value("${geoip.database.path:/app/geoip/GeoLite2-City.mmdb}")
    private String databasePath;

    @PostConstruct
    public void init() {
        try {
            File dbFile = new File(databasePath);
            if (dbFile.exists()) {
                this.reader = new DatabaseReader.Builder(dbFile).build();
                System.out.println("✓ GeoIP database loaded from: " + databasePath);
            } else {
                System.err.println("✗ GeoIP database not found at: " + databasePath);
            }
        } catch (Exception e) {
            System.err.println("✗ Failed to load GeoIP database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public CityResponse getLocation(String ipAddress) {
        if (reader == null) return null;
        try {
            InetAddress address = InetAddress.getByName(ipAddress);
            return reader.city(address);
        } catch (Exception e) {
            System.err.println("Error getting location for IP " + ipAddress + ": " + e.getMessage());
            return null;
        }
    }

    public String getCountry(String ipAddress) {
        CityResponse response = getLocation(ipAddress);
        if (response != null && response.getCountry() != null) {
            return response.getCountry().getIsoCode();
        }
        return null;
    }

    public String getCountryName(String ipAddress) {
        CityResponse response = getLocation(ipAddress);
        if (response != null && response.getCountry() != null) {
            return response.getCountry().getName();
        }
        return null;
    }

    public String getCity(String ipAddress) {
        CityResponse response = getLocation(ipAddress);
        if (response != null && response.getCity() != null) {
            return response.getCity().getName();
        }
        return null;
    }

    public Double getLatitude(String ipAddress) {
        CityResponse response = getLocation(ipAddress);
        if (response != null && response.getLocation() != null) {
            return response.getLocation().getLatitude();
        }
        return null;
    }

    public Double getLongitude(String ipAddress) {
        CityResponse response = getLocation(ipAddress);
        if (response != null && response.getLocation() != null) {
            return response.getLocation().getLongitude();
        }
        return null;
    }
}