package com.attvs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.r2dbc.autoconfigure.R2dbcAutoConfiguration;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;

@SpringBootApplication
@EnableR2dbcRepositories(basePackages = "com.attvs.backend.repository")
public class DoanApplication {

	public static void main(String[] args) {
		SpringApplication.run(DoanApplication.class, args);
	}

}
