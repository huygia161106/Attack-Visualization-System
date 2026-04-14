package com.attvs.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.r2dbc.autoconfigure.R2dbcAutoConfiguration;

@SpringBootApplication(exclude = { R2dbcAutoConfiguration.class })
public class DoanApplication {

	public static void main(String[] args) {
		SpringApplication.run(DoanApplication.class, args);
	}

}
