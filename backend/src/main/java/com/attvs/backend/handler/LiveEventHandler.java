package com.attvs.backend.handler;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

@Component
public class LiveEventHandler implements WebSocketHandler {

    private final Sinks.Many<String> sink = Sinks.many().multicast().directBestEffort();

    //NHÉT KAFKA MESSAGE VÀO WEBSOCKET
    public void broadcast(String message) {
        sink.tryEmitNext(message);
    }

    // HÀM DUY TRÌ KẾT NỐI WEBSOCKET VỚI FRONTEND
    @Override
    public Mono<Void> handle(WebSocketSession session) {
        return session.send(
                sink.asFlux().map(string -> session.textMessage(string))
        );
    }


}