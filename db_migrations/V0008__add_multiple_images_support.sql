-- Add image_urls array for multiple images support
ALTER TABLE t_p8566807_chat_access_project.messages 
ADD COLUMN image_urls TEXT[];

-- Migrate existing single image_url to array format
UPDATE t_p8566807_chat_access_project.messages 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL;