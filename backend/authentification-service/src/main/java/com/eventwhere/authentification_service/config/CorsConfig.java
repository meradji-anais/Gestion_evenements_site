package com.eventwhere.authentification_service.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        
        config.setAllowedOriginPatterns(Arrays.asList("http://localhost:4200"));
        
        config.setAllowCredentials(true);
      
        config.addAllowedHeader(CorsConfiguration.ALL);
     
        config.addAllowedMethod(CorsConfiguration.ALL);
        
        config.addExposedHeader("Authorization");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
       
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}