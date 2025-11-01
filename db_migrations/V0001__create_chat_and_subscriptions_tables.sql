CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_token VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('week', 'month')),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_token ON subscriptions(user_token);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at);
CREATE INDEX idx_messages_created ON messages(created_at DESC);