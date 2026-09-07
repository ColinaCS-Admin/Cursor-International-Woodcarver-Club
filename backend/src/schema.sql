CREATE TABLE IF NOT EXISTS country (
  country_code VARCHAR(2) PRIMARY KEY,
  country_desc VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS state_province (
  state_province_code VARCHAR(10) PRIMARY KEY,
  state_province_desc VARCHAR(150) NOT NULL,
  country_code VARCHAR(2) NOT NULL REFERENCES country(country_code)
);

CREATE TABLE IF NOT EXISTS member_discount_profile (
  member_discount_id SERIAL PRIMARY KEY,
  member_discount_desc VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_tier (
  member_tier_code VARCHAR(20) PRIMARY KEY,
  member_tier_desc VARCHAR(255) NOT NULL,
  member_discount_profile_id INTEGER REFERENCES member_discount_profile(member_discount_id)
);

CREATE TABLE IF NOT EXISTS craft_skill (
  craft_skill_code VARCHAR(20) PRIMARY KEY,
  craft_skill_desc VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS member (
  member_id BIGSERIAL PRIMARY KEY,
  member_alias VARCHAR(50) NOT NULL UNIQUE,
  member_first_name VARCHAR(100) NOT NULL,
  member_middle_name VARCHAR(100),
  member_last_name VARCHAR(100) NOT NULL,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  telephone_number_1 VARCHAR(30) NOT NULL,
  telephone_number_1_type VARCHAR(10) NOT NULL CHECK (telephone_number_1_type IN ('Mobile', 'Landline')),
  telephone_number_2 VARCHAR(30),
  telephone_number_2_type VARCHAR(10) CHECK (telephone_number_2_type IN ('Mobile', 'Landline')),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  city VARCHAR(100),
  zip_code VARCHAR(20),
  state_province_code VARCHAR(10) REFERENCES state_province(state_province_code),
  country_code VARCHAR(2) NOT NULL REFERENCES country(country_code),
  craft_skill_code VARCHAR(20) NOT NULL REFERENCES craft_skill(craft_skill_code),
  member_tier_code VARCHAR(20) NOT NULL REFERENCES membership_tier(member_tier_code),
  active_ind CHAR(1) NOT NULL CHECK (active_ind IN ('Y', 'N', 'S')),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('MEMBER', 'ADMIN')),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_email ON member (lower(email_address));
CREATE INDEX IF NOT EXISTS idx_member_alias ON member (lower(member_alias));
CREATE INDEX IF NOT EXISTS idx_member_country ON member (country_code);
CREATE INDEX IF NOT EXISTS idx_member_skill ON member (craft_skill_code);
CREATE INDEX IF NOT EXISTS idx_state_country ON state_province (country_code);
