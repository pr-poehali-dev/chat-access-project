-- Create payment_orders table for tracking Robokassa payments
CREATE TABLE t_p8566807_chat_access_project.payment_orders (
    id SERIAL PRIMARY KEY,
    invoice_id VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(10) NOT NULL CHECK (plan IN ('week', 'month')),
    amount INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);