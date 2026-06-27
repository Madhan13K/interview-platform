# SSO Architecture

## Supported Providers
| Provider | Protocol | Package |
|----------|----------|---------|
| Okta | OIDC | `sso/` |
| Keycloak | OIDC | `sso/` |
| Azure AD | SAML 2.0 | `sso/` |
| Google Workspace | OAuth2 | `security/oauth2/` |
| GitHub | OAuth2 | `security/oauth2/` |

## SSO Discovery (4 Methods)
1. **Subdomain** — `acme.interview-platform.app` → lookup org by subdomain
2. **Cookie** — Return visitor remembered org
3. **IdP-Initiated** — User lands directly from IdP
4. **Email Discovery** — User types email, onBlur triggers SSO lookup

## Configuration
```yaml
# Per-org SSO config (stored in DB)
app:
  sso:
    enabled: true
    provider: okta  # or keycloak, azure
    issuer-uri: https://your-org.okta.com/oauth2/default
    client-id: ${OKTA_CLIENT_ID}
    client-secret: ${OKTA_CLIENT_SECRET}
```

## Testing
```bash
# Discover SSO for email domain
curl "http://localhost:8080/api/v1/sso/discover?email=user@company.com"

# List configured providers
curl "http://localhost:8080/api/v1/sso/providers" \
  -H "Authorization: Bearer <admin_token>"
```

### Related SDD
- Full details: [AI_Interview_SDD/docs/03-authentication-security.md](../../AI_Interview_SDD/docs/03-authentication-security.md)
