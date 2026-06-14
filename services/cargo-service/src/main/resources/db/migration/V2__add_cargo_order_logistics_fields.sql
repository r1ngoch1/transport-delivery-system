ALTER TABLE cargo_orders
    ADD COLUMN pickup_city VARCHAR(255),
    ADD COLUMN pickup_address VARCHAR(500),
    ADD COLUMN dropoff_city VARCHAR(255),
    ADD COLUMN dropoff_address VARCHAR(500),
    ADD COLUMN declared_value NUMERIC(12, 2),
    ADD COLUMN sender_name VARCHAR(255),
    ADD COLUMN sender_phone VARCHAR(64),
    ADD COLUMN recipient_name VARCHAR(255),
    ADD COLUMN recipient_phone VARCHAR(64);
