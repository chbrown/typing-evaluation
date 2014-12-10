CREATE TABLE sentences (
  id SERIAL PRIMARY KEY,

  text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en', -- ISO 639-1 two-letter codes
  active BOOLEAN NOT NULL DEFAULT TRUE,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE participants (
  id SERIAL PRIMARY KEY,

  demographics JSON NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);

CREATE TABLE responses (
  id SERIAL PRIMARY KEY,

  participant_id INTEGER REFERENCES participants(id) NOT NULL ON DELETE CASCADE,
  sentence_id INTEGER REFERENCES sentences(id) NOT NULL ON DELETE CASCADE,

  -- keystrokes: Array<{timestamp: number, key: string}>
  keystrokes JSON NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);
