alter table payments
    add column idempotency_key varchar(128);

alter table payments
    add constraint uk_payments_user_id_idempotency_key unique (user_id, idempotency_key);
