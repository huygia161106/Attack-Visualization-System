package com.attvs.backend.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Component
public class LiveEventHandler implements WebSocketHandler {
    
    // Trạm phát sóng đa luồng (Ai truy cập web cũng nhận được)
    private final Sinks.Many<String> sink = Sinks.many().multicast().onBackpressureBuffer();

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        return session.send(sink.asFlux().map(session::textMessage));
    }

    // Hàm này để các class khác gọi khi có dữ liệu mới
    public void broadcast(String message) {
        sink.tryEmitNext(message);
    }
}