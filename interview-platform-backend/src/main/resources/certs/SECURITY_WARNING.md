# WARNING: Development Keys Only

The `private.pem` and `public.pem` files in this directory are for LOCAL DEVELOPMENT ONLY.
The `localhost.p12` keystore is a self-signed certificate for local HTTPS testing ONLY.

## mTLS Development Certificates

The following mTLS certificates are for LOCAL DEVELOPMENT/TESTING ONLY:

| File | Purpose | Password |
|------|---------|----------|
| `ca-cert.pem` | Self-signed Certificate Authority | - |
| `ca-key.pem` | CA private key (signs server + client certs) | - |
| `server-keystore.p12` | Server identity (cert + key) for inbound mTLS | `changeit` |
| `client-truststore.p12` | Trusted CAs for verifying client certificates | `changeit` |
| `client-keystore.p12` | Client identity for outbound mTLS calls | `changeit` |
| `server-truststore.p12` | Trusted CAs for verifying server certificates | `changeit` |
| `client-cert.pem` | Client certificate (PEM format, for curl testing) | - |
| `client-key.pem` | Client private key (PEM format, for curl testing) | - |
| `server-cert.pem` | Server certificate (PEM format) | - |
| `server-key.pem` | Server private key (PEM format) | - |

### Regenerate mTLS Certificates
```bash
./scripts/generate-mtls-certs.sh
```

## Production Requirements

In production, RSA keys MUST be loaded from HashiCorp Vault:

```yaml
# application-prod.yml
app:
  security:
    rsa:
      from-vault: true  # This is already set
```

HTTPS in production is terminated at the Istio Ingress Gateway (see `k8s/istio/gateway.yaml`).
The Spring Boot application runs on plain HTTP behind the service mesh.

For mTLS in production:
- Use certificates issued by your organization's PKI/CA
- Store keystores and truststores in HashiCorp Vault or AWS Secrets Manager
- Automate rotation with cert-manager in Kubernetes
- Enable CRL/OCSP checking for certificate revocation

## NEVER do this in production:
- Commit real private keys to source control
- Use classpath-based key loading (`classpath:certs/private.pem`)
- Use the `localhost.p12` self-signed certificate
- Use the development CA or mTLS certificates
- Share these dev keys with production environments
- Use `changeit` as a keystore password

## Key Rotation
Generate new RSA key pairs for production:
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```
Then store in Vault at: `secret/interview-platform/rsa-keys`

## Regenerating the Local HTTPS Keystore
```bash
keytool -genkeypair -alias interview-platform -keyalg RSA -keysize 2048 \
  -storetype PKCS12 -keystore localhost.p12 -validity 365 \
  -storepass changeit -dname "CN=localhost" -ext "SAN=dns:localhost,ip:127.0.0.1"
```
