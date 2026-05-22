CREATE TABLE cargo_orders (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    trip_id UUID NOT NULL,
    description VARCHAR(500) NOT NULL,
    weight_kg NUMERIC(12, 2) NOT NULL,
    length_cm NUMERIC(12, 2) NOT NULL,
    width_cm NUMERIC(12, 2) NOT NULL,
    height_cm NUMERIC(12, 2) NOT NULL,
    volume_m3 NUMERIC(12, 4) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    payment_id UUID,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_cargo_orders_user_id ON cargo_orders(user_id);
CREATE INDEX idx_cargo_orders_trip_id ON cargo_orders(trip_id);
CREATE INDEX idx_cargo_orders_trip_status ON cargo_orders(trip_id, status);
