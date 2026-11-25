CREATE TABLE IF NOT EXISTS homepage_translations (
    language TEXT NOT NULL CHECK (language IN ('en', 'ja', 'ko')),
    item_key TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    PRIMARY KEY (language, item_key)
);
