-- Create table for typing indicators
CREATE TABLE IF NOT EXISTS t_p8566807_chat_access_project.typing_indicators (
    user_token TEXT PRIMARY KEY,
    author_name TEXT,
    last_typing_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster cleanup of old indicators
CREATE INDEX IF NOT EXISTS idx_typing_last_typing_at ON t_p8566807_chat_access_project.typing_indicators(last_typing_at);
