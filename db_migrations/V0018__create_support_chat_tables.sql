-- Таблица для тикетов поддержки (каждый клиент имеет свой тикет)
CREATE TABLE IF NOT EXISTS t_p8566807_chat_access_project.support_tickets (
    id SERIAL PRIMARY KEY,
    client_email VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP
);

-- Таблица для сообщений в чате
CREATE TABLE IF NOT EXISTS t_p8566807_chat_access_project.support_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin')),
    sender_email VARCHAR(255),
    message_text TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для реакций на сообщения
CREATE TABLE IF NOT EXISTS t_p8566807_chat_access_project.support_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    reaction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_email, reaction)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON t_p8566807_chat_access_project.support_tickets(client_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON t_p8566807_chat_access_project.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON t_p8566807_chat_access_project.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_reactions_message ON t_p8566807_chat_access_project.support_reactions(message_id);