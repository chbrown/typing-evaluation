CREATE TABLE administrators (
  id SERIAL PRIMARY KEY,

  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,

  created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp NOT NULL
);
