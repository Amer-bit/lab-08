--just for learning im delting any exist table

DROP TABLE IF EXISTS citylocation;

CREATE TABLE citylocation (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    searchcity VARCHAR(255),
    latitude NUMERIC,
    longitude NUMERIC
);