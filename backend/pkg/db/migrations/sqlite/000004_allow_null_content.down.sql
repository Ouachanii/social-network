-- +migrate Down
-- Revert content column back to NOT NULL
CREATE TABLE posts_old (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    group_id   INTEGER,
    content TEXT NOT NULL,
    image_path TEXT UNIQUE DEFAULT NULL,
    privacy TEXT NOT NULL DEFAULT 'public',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Copy data from current table to old table (excluding NULL content)
INSERT INTO posts_old SELECT * FROM posts WHERE content IS NOT NULL;

-- Drop current table and rename old table
DROP TABLE posts;
ALTER TABLE posts_old RENAME TO posts; 