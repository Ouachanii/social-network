-- +migrate Up
CREATE TABLE IF NOT EXISTS post_interactions (
    user_id INTEGER,
    post_id INTEGER,
    interaction INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, post_id), 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
