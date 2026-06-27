# Authentication Testing Guide

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@interview.local | ChangeMe123! |
| Recruiter | recruiter@interview.local | ChangeMe123! |
| Interviewer | interviewer@interview.local | ChangeMe123! |
| Candidate | candidate@interview.local | ChangeMe123! |

## Auth Flows to Test

### 1. Local JWT Auth
```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@interview.local","password":"ChangeMe123!"}'

# Use token
curl http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer <token>"

# Refresh
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

### 2. OAuth2 (Google/GitHub)
- Google: `GET /login/oauth2/code/google`
- GitHub: `GET /login/oauth2/code/github`
- Callback processes token exchange automatically

### 3. MFA/TOTP
```bash
# Enable MFA
curl -X POST http://localhost:8080/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer <token>"
# Returns QR code + secret

# Verify OTP
curl -X POST http://localhost:8080/api/v1/auth/mfa/verify \
  -H "Authorization: Bearer <token>" \
  -d '{"code":"123456"}'
```

### 4. WebAuthn/FIDO2
```bash
# Start registration
curl -X POST http://localhost:8080/api/v1/webauthn/register/start \
  -H "Authorization: Bearer <token>" \
  -d '{"credentialName":"My Key","authenticatorType":"platform"}'
```

### 5. API Key Auth
```bash
curl http://localhost:8080/api/v1/interviews \
  -H "X-API-Key: <api_key>"
```

## Security Tests (in test suite)
- JWT token validation (expiry, signature, claims) — `JwtTokenValidationTest`
- OAuth2 PKCE flow — `OAuth2PkceFlowTest`
- MFA TOTP validation — `MfaTotpValidationTest`
- Rate limiting — `RateLimiterUnitTest`
- SAML assertion parsing — `SamlAssertionParsingTest`
