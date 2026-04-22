CREATE TABLE IF NOT EXISTS attack_events (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMP,
    src_ip VARCHAR(255),
    attack_type VARCHAR(255),
    severity INT
);