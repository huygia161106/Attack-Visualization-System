package com.attvs.backend.config;

import com.attvs.backend.handler.LiveEventHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.Map;

//LỚP CẤU HÌNH CHO VIỆC KẾT NỐI VỚI WEBSOCKET
@Configuration
public class WebSocketConfig {

    @Bean
    public HandlerMapping webSocketMapping(LiveEventHandler liveEventHandler) {
        return new SimpleUrlHandlerMapping(Map.of("/ws/live", liveEventHandler), 1);
    }

    @Bean
    public WebSocketHandlerAdapter handlerAdapter() {
        return new WebSocketHandlerAdapter();
    }

}