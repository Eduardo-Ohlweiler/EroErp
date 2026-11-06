package com.api.ero_api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class EroApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(EroApiApplication.class, args);
    }
}
