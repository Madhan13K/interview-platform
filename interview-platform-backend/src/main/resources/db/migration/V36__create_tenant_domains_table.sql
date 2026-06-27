-- V36: Domain-to-Tenant mapping for SSO discovery
-- Allows the login page to auto-detect which SSO provider to use based on email domain.
-- Example: user@acme.com -> tenant "Acme Corp" -> redirect to their Okta/Azure AD

CREATE TABLE tenant_domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    domain          VARCHAR(255) NOT NULL,
    verified        BOOLEAN NOT NULL DEFAULT FALSE,
    primary_domain  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_tenant_domain UNIQUE (domain)
);

CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

-- Seed some test domains for local development
INSERT INTO tenant_domains (tenant_id, domain, verified, primary_domain)
SELECT
    (SELECT tenant_id FROM sso_configurations LIMIT 1),
    'test.com',
    true,
    true
WHERE EXISTS (SELECT 1 FROM sso_configurations LIMIT 1);
