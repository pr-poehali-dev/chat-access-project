-- Add reply_to column to messages table for threaded conversations
ALTER TABLE t_p8566807_chat_access_project.messages 
ADD COLUMN reply_to INTEGER NULL REFERENCES t_p8566807_chat_access_project.messages(id);