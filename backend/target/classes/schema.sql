DROP TABLE IF EXISTS attack_events;

CREATE TABLE attack_events (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP,
    src_ip VARCHAR(255),
    dst_ip VARCHAR(255),
    src_lat DOUBLE PRECISION,
    src_lng DOUBLE PRECISION,
    attack_type VARCHAR(255),
    severity INT,
    country VARCHAR(255),
    city VARCHAR(255),
    raw_payload TEXT
);