create table users (
    id uuid primary key,
    email varchar(255) not null unique,
    phone varchar(64) not null unique,
    password_hash varchar(255) not null,
    full_name varchar(255) not null,
    enabled boolean not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);

create table user_roles (
    user_id uuid not null references users(id) on delete cascade,
    role varchar(32) not null,
    primary key (user_id, role)
);
