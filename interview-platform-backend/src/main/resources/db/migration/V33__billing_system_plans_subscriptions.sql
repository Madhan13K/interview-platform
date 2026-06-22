-- V33: Billing system - subscription plans, organization subscriptions, payment transactions, invoices

-- ─────────────────────────────────────────────────────────────
-- Subscription Plans
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly_usd DECIMAL(10,2),
    price_monthly_inr DECIMAL(10,2),
    price_yearly_usd DECIMAL(10,2),
    price_yearly_inr DECIMAL(10,2),
    max_users INTEGER,
    max_interviews_per_month INTEGER,
    max_job_positions INTEGER,
    max_storage_gb INTEGER,
    ai_features_enabled BOOLEAN DEFAULT FALSE,
    video_interviews_enabled BOOLEAN DEFAULT TRUE,
    sso_enabled BOOLEAN DEFAULT FALSE,
    api_access_enabled BOOLEAN DEFAULT FALSE,
    custom_branding_enabled BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Organization Subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'TRIALING',
    billing_cycle VARCHAR(10) DEFAULT 'MONTHLY',
    payment_gateway VARCHAR(20),
    gateway_subscription_id VARCHAR(255),
    gateway_customer_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);

-- ─────────────────────────────────────────────────────────────
-- Payment Transactions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    subscription_id UUID,
    gateway VARCHAR(20) NOT NULL,
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_type VARCHAR(20) DEFAULT 'SUBSCRIPTION',
    payment_method VARCHAR(50),
    failure_reason VARCHAR(500),
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_txn_org ON payment_transactions(organization_id);
CREATE INDEX idx_payment_txn_gateway ON payment_transactions(gateway, gateway_payment_id);

-- ─────────────────────────────────────────────────────────────
-- Invoices
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    organization_id UUID NOT NULL,
    subscription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    pdf_url VARCHAR(500),
    gstin VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Seed Default Plans
-- ─────────────────────────────────────────────────────────────
INSERT INTO subscription_plans (id, slug, name, description, price_monthly_usd, price_monthly_inr, price_yearly_usd, price_yearly_inr, max_users, max_interviews_per_month, max_job_positions, max_storage_gb, ai_features_enabled, video_interviews_enabled, sso_enabled, api_access_enabled, custom_branding_enabled, priority_support, sort_order)
VALUES
(gen_random_uuid(), 'free', 'Free', 'Get started with basic features', 0, 0, 0, 0, 3, 10, 2, 1, false, false, false, false, false, false, 1),
(gen_random_uuid(), 'starter', 'Starter', 'For small teams getting started with structured hiring', 49, 3999, 470, 38390, 10, 50, 5, 5, false, true, false, false, false, false, 2),
(gen_random_uuid(), 'professional', 'Professional', 'For growing teams with advanced needs', 149, 11999, 1430, 115190, 50, 200, 25, 25, true, true, true, true, false, false, 3),
(gen_random_uuid(), 'enterprise', 'Enterprise', 'For large organizations with custom requirements', 399, 32999, 3830, 316790, -1, -1, -1, 100, true, true, true, true, true, true, 4)
ON CONFLICT (slug) DO NOTHING;
