package com.unipulse.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class UniPulseCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniPulseCoreApplication.class, args);
    }
}
