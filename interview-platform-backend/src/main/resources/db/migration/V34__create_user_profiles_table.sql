-- V34: Create user_profiles table (was previously auto-created by JPA ddl-auto)

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    profile UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_picture_url TEXT,
    bio TEXT,
    skills TEXT,
    contact_number TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    resume_url TEXT,
    designation VARCHAR(255),
    company VARCHAR(255),
    experience_years INTEGER,
    CONSTRAINT uk_user_profiles_user UNIQUE (profile)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(profile);
