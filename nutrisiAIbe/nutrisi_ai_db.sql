CREATE TABLE USERS (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    weight_kg FLOAT,
    height_cm FLOAT,
    activity_level FLOAT,
    medical_conditions VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE FOOD_LOGS (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    food_name VARCHAR(255),
    calories FLOAT,
    protein_g FLOAT,
    carbs_g FLOAT,
    fat_g FLOAT,
    sugar_g FLOAT,
    salt_mg FLOAT,
    fiber_g FLOAT,
    grade VARCHAR(50),
    image_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USERS(id)
);

CREATE TABLE DAILY_TRACKING (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    date DATE,
    water_glasses INT,
    last_updated DATETIME,
    FOREIGN KEY (user_id) REFERENCES USERS(id)
);

CREATE TABLE CHAT_HISTORY (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    message TEXT,
    sender VARCHAR(50),
    timestamp DATETIME,
    FOREIGN KEY (user_id) REFERENCES USERS(id)
);