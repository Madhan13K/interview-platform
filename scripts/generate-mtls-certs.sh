#!/bin/bash
# =============================================================================
# mTLS Certificate Generation Script for Development
# =============================================================================
# This script generates a self-signed CA, server certificate, and client 
# certificate for local mTLS development/testing.
#
# NEVER use these certificates in production!
# For production, use certificates from your organization's PKI/CA.
#
# Usage: ./generate-mtls-certs.sh
# Output: Creates certificates in src/main/resources/certs/
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="${SCRIPT_DIR}/../interview-platform-backend/src/main/resources/certs"
VALIDITY_DAYS=365
KEY_SIZE=2048
CA_SUBJECT="/C=US/ST=California/L=San Francisco/O=Interview Platform/OU=Development/CN=Interview Platform Dev CA"
SERVER_SUBJECT="/C=US/ST=California/L=San Francisco/O=Interview Platform/OU=Backend/CN=localhost"
CLIENT_SUBJECT="/C=US/ST=California/L=San Francisco/O=Interview Platform/OU=Service Client/CN=interview-platform-client"

echo "=== mTLS Certificate Generation for Development ==="
echo "Output directory: ${CERT_DIR}"
echo ""

mkdir -p "${CERT_DIR}"

# --- 1. Generate CA (Certificate Authority) ---
echo "[1/6] Generating CA private key and self-signed certificate..."
openssl req -x509 -newkey rsa:${KEY_SIZE} -nodes \
    -keyout "${CERT_DIR}/ca-key.pem" \
    -out "${CERT_DIR}/ca-cert.pem" \
    -days ${VALIDITY_DAYS} \
    -subj "${CA_SUBJECT}" \
    2>/dev/null

echo "  -> CA certificate: ${CERT_DIR}/ca-cert.pem"
echo "  -> CA private key: ${CERT_DIR}/ca-key.pem"

# --- 2. Generate Server Certificate (signed by CA) ---
echo "[2/6] Generating server private key and CSR..."
openssl req -newkey rsa:${KEY_SIZE} -nodes \
    -keyout "${CERT_DIR}/server-key.pem" \
    -out "${CERT_DIR}/server-csr.pem" \
    -subj "${SERVER_SUBJECT}" \
    2>/dev/null

# Create server extensions file for SAN (Subject Alternative Names)
cat > "${CERT_DIR}/server-ext.cnf" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=localhost
DNS.2=*.localhost
DNS.3=interview-platform-backend
DNS.4=*.interview-platform.local
IP.1=127.0.0.1
IP.2=::1
EOF

echo "[3/6] Signing server certificate with CA..."
openssl x509 -req \
    -in "${CERT_DIR}/server-csr.pem" \
    -CA "${CERT_DIR}/ca-cert.pem" \
    -CAkey "${CERT_DIR}/ca-key.pem" \
    -CAcreateserial \
    -out "${CERT_DIR}/server-cert.pem" \
    -days ${VALIDITY_DAYS} \
    -extfile "${CERT_DIR}/server-ext.cnf" \
    2>/dev/null

echo "  -> Server certificate: ${CERT_DIR}/server-cert.pem"

# --- 3. Generate Client Certificate (signed by same CA) ---
echo "[4/6] Generating client private key and CSR..."
openssl req -newkey rsa:${KEY_SIZE} -nodes \
    -keyout "${CERT_DIR}/client-key.pem" \
    -out "${CERT_DIR}/client-csr.pem" \
    -subj "${CLIENT_SUBJECT}" \
    2>/dev/null

# Create client extensions file
cat > "${CERT_DIR}/client-ext.cnf" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature
extendedKeyUsage=clientAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=interview-platform-client
email.1=service@interview-platform.local
EOF

echo "[5/6] Signing client certificate with CA..."
openssl x509 -req \
    -in "${CERT_DIR}/client-csr.pem" \
    -CA "${CERT_DIR}/ca-cert.pem" \
    -CAkey "${CERT_DIR}/ca-key.pem" \
    -CAcreateserial \
    -out "${CERT_DIR}/client-cert.pem" \
    -days ${VALIDITY_DAYS} \
    -extfile "${CERT_DIR}/client-ext.cnf" \
    2>/dev/null

echo "  -> Client certificate: ${CERT_DIR}/client-cert.pem"

# --- 4. Create PKCS12 Keystores/Truststores ---
echo "[6/6] Creating PKCS12 keystores and truststores..."

# Server keystore (server cert + private key)
openssl pkcs12 -export \
    -in "${CERT_DIR}/server-cert.pem" \
    -inkey "${CERT_DIR}/server-key.pem" \
    -certfile "${CERT_DIR}/ca-cert.pem" \
    -out "${CERT_DIR}/server-keystore.p12" \
    -name "interview-platform-server" \
    -password pass:changeit \
    2>/dev/null

echo "  -> Server keystore: ${CERT_DIR}/server-keystore.p12 (password: changeit)"

# Client truststore (contains CA cert - server uses this to verify client certs)
openssl pkcs12 -export \
    -nokeys \
    -in "${CERT_DIR}/ca-cert.pem" \
    -out "${CERT_DIR}/client-truststore.p12" \
    -name "interview-platform-ca" \
    -password pass:changeit \
    2>/dev/null

echo "  -> Client truststore: ${CERT_DIR}/client-truststore.p12 (password: changeit)"

# Client keystore (client cert + private key - for outbound mTLS calls)
openssl pkcs12 -export \
    -in "${CERT_DIR}/client-cert.pem" \
    -inkey "${CERT_DIR}/client-key.pem" \
    -certfile "${CERT_DIR}/ca-cert.pem" \
    -out "${CERT_DIR}/client-keystore.p12" \
    -name "interview-platform-client" \
    -password pass:changeit \
    2>/dev/null

echo "  -> Client keystore: ${CERT_DIR}/client-keystore.p12 (password: changeit)"

# Server truststore (contains CA cert - client uses this to verify server cert)
openssl pkcs12 -export \
    -nokeys \
    -in "${CERT_DIR}/ca-cert.pem" \
    -out "${CERT_DIR}/server-truststore.p12" \
    -name "interview-platform-ca" \
    -password pass:changeit \
    2>/dev/null

echo "  -> Server truststore: ${CERT_DIR}/server-truststore.p12 (password: changeit)"

# --- 5. Clean up temporary files ---
rm -f "${CERT_DIR}/server-csr.pem" "${CERT_DIR}/client-csr.pem"
rm -f "${CERT_DIR}/server-ext.cnf" "${CERT_DIR}/client-ext.cnf"
rm -f "${CERT_DIR}/ca-cert.srl"

echo ""
echo "=== mTLS Certificates Generated Successfully ==="
echo ""
echo "To test mTLS locally:"
echo "  1. Start the backend with: --spring.profiles.active=dev,mtls"
echo "  2. Test with curl:"
echo "     curl --cert ${CERT_DIR}/client-cert.pem \\"
echo "          --key ${CERT_DIR}/client-key.pem \\"
echo "          --cacert ${CERT_DIR}/ca-cert.pem \\"
echo "          https://localhost:8443/api/v1/mtls/verify"
echo ""
echo "WARNING: These are DEVELOPMENT-ONLY certificates. Never use in production!"
