package com.eventwhere.participantservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.eventwhere.participantservice")
@EntityScan(basePackages = "com.eventwhere.participantservice.model")
@EnableJpaRepositories(basePackages = "com.eventwhere.participantservice.repository")
public class ParticipantServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ParticipantServiceApplication.class, args);
    }
}