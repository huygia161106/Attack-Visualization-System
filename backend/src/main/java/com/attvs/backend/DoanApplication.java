package com.attvs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableR2dbcRepositories(basePackages = "com.attvs.backend.repository")
@EnableScheduling // <-- CÔNG TẮC KÍCH HOẠT VÒNG LẶP CÀO DATA
//CLASS ĐỂ KHỞI ĐỘNG BACKEND
public class DoanApplication {

    public static void main(String[] args) {
        SpringApplication.run(DoanApplication.class, args);
    }

}