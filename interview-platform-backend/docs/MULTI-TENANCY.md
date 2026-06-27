# Multi-Tenancy Architecture

## Strategy: Schema-per-Tenant + Row-Level Security

### Tenant Resolution Flow
```
Request → TenantContextFilter → Extract org from JWT/subdomain
       → TenantContext.setCurrentTenant(orgId)
       → All queries scoped to tenant
```

### Key Components
| Component | Package | Purpose |
|-----------|---------|---------|
| TenantContextFilter | `tenant/filter/` | Sets tenant context per request |
| TenantContext | `tenant/filter/` | ThreadLocal tenant storage |
| TenantProvisioningService | `tenant/service/` | Auto-creates schemas for new orgs |
| TenantSchemaInterceptor | `tenant/config/` | Routes to correct schema |
| OrganizationService | `tenant/service/` | Org CRUD + membership |

### Tenant Isolation Levels
| Level | Implementation |
|-------|---------------|
| Data | Schema-per-tenant (separate DB schemas) |
| Config | Per-org white-label (`whitelabel/`) |
| SSO | Per-org SSO config (`sso/`) |
| Billing | Per-org subscription (`billing/`) |
| IP Whitelist | Per-org IP rules (`ipwhitelist/`) |

### Related SDD
- Full details: [AI_Interview_SDD/docs/21-multi-tenancy-saas.md](../../AI_Interview_SDD/docs/21-multi-tenancy-saas.md)
