--just for learning im delting any exist table

DROP TABLE IF EXISTS citylocation;

CREATE TABLE citylocation (
    id SERIAL PRIMARY KEY,
    city VARCHAR(255),
    search VARCHAR(255),
    longitude NUMERIC,
    latitude NUMERIC
);