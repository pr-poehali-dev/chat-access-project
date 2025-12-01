-- Add support for 'combo' plan type in payment_orders table
ALTER TABLE t_p8566807_chat_access_project.payment_orders 
DROP CONSTRAINT payment_orders_plan_check;

ALTER TABLE t_p8566807_chat_access_project.payment_orders 
ADD CONSTRAINT payment_orders_plan_check CHECK (plan IN ('week', 'month', 'combo'));
