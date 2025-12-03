-- Add test subscription for v89661655608@gmail.com
INSERT INTO t_p8566807_chat_access_project.subscriptions 
  (user_token, plan, expires_at, email, is_blocked, created_at) 
VALUES 
  ('30c8fd45-2734-43af-b532-e28a5ec6044d', 'month', NOW() + INTERVAL '30 days', 'v89661655608@gmail.com', false, NOW())
ON CONFLICT (user_token) DO UPDATE 
SET expires_at = EXCLUDED.expires_at, email = EXCLUDED.email, is_blocked = false;