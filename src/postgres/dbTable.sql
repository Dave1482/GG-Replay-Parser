-- Connect to the database first
\c replay_db;

-- Create enum for roles
CREATE TYPE user_role AS ENUM ('USER', 'PLAYER', 'CAPTAIN', 'ADMIN');

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create replays table
CREATE TABLE replays (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_id in replays table
CREATE INDEX replays_user_id_idx ON replays(user_id);