-- +migrate Up
-- Allow NULL content in posts table to support image-only posts
-- SQLite doesn't support ALTER TABLE MODIFY COLUMN, so we need to recreate the table
CREATE TABLE posts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    group_id   INTEGER,
    content TEXT,
    image_path TEXT UNIQUE DEFAULT NULL,
    privacy TEXT NOT NULL DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO posts_new SELECT * FROM posts;

-- Drop old table and rename new table
DROP TABLE posts;
ALTER TABLE posts_new RENAME TO posts; 