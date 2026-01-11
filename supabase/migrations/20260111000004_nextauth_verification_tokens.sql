-- ============================================================================
-- Supabase Migration: NextAuth.js Verification Tokens Table
-- Adds verification_tokens table required by NextAuth.js adapter
-- Date: 2026-01-11
-- ============================================================================

-- Verification tokens table (for NextAuth.js)
-- Stores email verification and password reset tokens
CREATE TABLE IF NOT EXISTS public.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (identifier, token)
);

-- Indexes for verification tokens
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON public.verification_tokens(expires);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);

-- Comments for documentation
COMMENT ON TABLE public.verification_tokens IS 'Email verification and password reset tokens for NextAuth.js';
COMMENT ON COLUMN public.verification_tokens.identifier IS 'Email address or user identifier';
COMMENT ON COLUMN public.verification_tokens.token IS 'Verification token';
COMMENT ON COLUMN public.verification_tokens.expires IS 'Token expiration timestamp';