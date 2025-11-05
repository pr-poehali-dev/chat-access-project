-- Add user_token to messages to track who sent each message
ALTER TABLE t_p8566807_chat_access_project.messages 
ADD COLUMN user_token VARCHAR(255);

-- Add email and blocking fields to subscriptions
ALTER TABLE t_p8566807_chat_access_project.subscriptions 
ADD COLUMN email VARCHAR(255),
ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_user_token ON t_p8566807_chat_access_project.subscriptions(user_token);
CREATE INDEX idx_messages_user_token ON t_p8566807_chat_access_project.messages(user_token);