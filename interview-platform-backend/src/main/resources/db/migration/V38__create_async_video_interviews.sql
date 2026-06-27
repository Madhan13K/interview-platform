-- V38: Async Video Interviews
-- Candidates record video responses to pre-set questions at their convenience.
-- Reviewers watch and rate the recordings later.

CREATE TABLE async_interviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(300) NOT NULL,
    description         TEXT,
    organization_id     UUID,
    created_by          UUID NOT NULL REFERENCES users(id),
    deadline            TIMESTAMP WITH TIME ZONE,
    max_response_time   INTEGER DEFAULT 120,          -- seconds per question
    max_retakes         INTEGER DEFAULT 3,
    status              VARCHAR(30) NOT NULL DEFAULT 'DRAFT',  -- DRAFT, PUBLISHED, CLOSED, ARCHIVED
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE
);

CREATE TABLE async_interview_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    async_interview_id  UUID NOT NULL REFERENCES async_interviews(id) ON DELETE CASCADE,
    question_text       TEXT NOT NULL,
    question_order      INTEGER NOT NULL,
    thinking_time       INTEGER DEFAULT 30,            -- seconds to prepare
    max_response_time   INTEGER DEFAULT 120,           -- override per question
    required            BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE async_interview_invitations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    async_interview_id  UUID NOT NULL REFERENCES async_interviews(id) ON DELETE CASCADE,
    candidate_id        UUID NOT NULL REFERENCES users(id),
    candidate_email     VARCHAR(255) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'INVITED',  -- INVITED, STARTED, COMPLETED, EXPIRED
    invite_token        VARCHAR(500) NOT NULL UNIQUE,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE async_interview_responses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id       UUID NOT NULL REFERENCES async_interview_invitations(id) ON DELETE CASCADE,
    question_id         UUID NOT NULL REFERENCES async_interview_questions(id) ON DELETE CASCADE,
    video_s3_key        VARCHAR(1000) NOT NULL,
    duration_seconds    INTEGER,
    retake_number       INTEGER DEFAULT 1,
    transcript          TEXT,                           -- AI-generated transcript
    ai_score            DECIMAL(3,1),                  -- AI-generated score (0-10)
    ai_feedback         TEXT,                          -- AI-generated feedback
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE async_interview_reviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id       UUID NOT NULL REFERENCES async_interview_invitations(id) ON DELETE CASCADE,
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    overall_rating      INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    notes               TEXT,
    decision            VARCHAR(30),    -- ADVANCE, REJECT, HOLD
    reviewed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_async_interviews_org ON async_interviews(organization_id);
CREATE INDEX idx_async_invitations_interview ON async_interview_invitations(async_interview_id);
CREATE INDEX idx_async_invitations_candidate ON async_interview_invitations(candidate_id);
CREATE INDEX idx_async_invitations_token ON async_interview_invitations(invite_token);
CREATE INDEX idx_async_responses_invitation ON async_interview_responses(invitation_id);
CREATE INDEX idx_async_reviews_invitation ON async_interview_reviews(invitation_id);
