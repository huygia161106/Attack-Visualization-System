package com.attvs.backend.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.time.Duration;

@Component
public class LiveEventHandler implements WebSocketHandler {
    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Cứ mỗi 1 giây đẩy 1 tin nhắn "Có biến!" xuống Frontend
        Flux<String> mockEvents = Flux.interval(Duration.ofSeconds(1))
                .map(i -> "ATTACK EVENT!!!!! NUM: " + i);

        return session.send(mockEvents.map(session::textMessage));
    }
}