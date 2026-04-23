package com.attvs.backend.config;

import com.attvs.backend.handler.LiveEventHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.Collections;
import java.util.Map;

@Configuration
public class WebSocketConfig {

    @Bean
    public HandlerMapping webSocketMapping(LiveEventHandler liveEventHandler) {
        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping(Map.of("/ws/live", liveEventHandler));
        mapping.setOrder(1); // Đặt độ ưu tiên

        //Mở cửa (CORS) cho phép Frontend từ mọi nơi cắm vào
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.addAllowedOriginPattern("*"); 
        mapping.setCorsConfigurations(Collections.singletonMap("*", corsConfig));

        return mapping;
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }
}