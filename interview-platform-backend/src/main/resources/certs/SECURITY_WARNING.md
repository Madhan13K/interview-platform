# WARNING: Development Keys Only

The `private.pem` and `public.pem` files in this directory are for LOCAL DEVELOPMENT ONLY.

## Production Requirements

In production, RSA keys MUST be loaded from HashiCorp Vault:

```yaml
# application-prod.yml
app:
  security:
    rsa:
      from-vault: true  # This is already set
```

## NEVER do this in production:
- Commit real private keys to source control
- Use classpath-based key loading (`classpath:certs/private.pem`)
- Share these dev keys with production environments

## Key Rotation
Generate new RSA key pairs for production:
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```
Then store in Vault at: `secret/interview-platform/rsa-keys`
