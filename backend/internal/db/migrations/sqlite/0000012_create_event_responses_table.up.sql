-- +migrate Up
CREATE TABLE event_responses (
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    response TEXT ,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES group_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);