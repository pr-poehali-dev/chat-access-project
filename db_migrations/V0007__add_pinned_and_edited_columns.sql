-- Add is_pinned column for pinning messages
-- Add edited_at column for tracking message edits

ALTER TABLE t_p8566807_chat_access_project.messages 
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMP;