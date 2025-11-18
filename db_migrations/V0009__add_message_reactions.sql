-- Create table for message reactions
CREATE TABLE IF NOT EXISTS t_p8566807_chat_access_project.reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL,
    user_token TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(message_id, user_token, emoji)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON t_p8566807_chat_access_project.reactions(message_id);
