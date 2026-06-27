# Kubernetes Infrastructure

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│ Kubernetes Cluster (EKS/GKE)                         │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────────────────┐ │
│  │ Ingress │  │ Service │  │ Deployment (2+ pods) │ │
│  │ (ALB)   │→ │ :8080   │→ │ interview-platform   │ │
│  └─────────┘  └─────────┘  └─────────────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ StatefulSets / Managed Services               │   │
│  │ PostgreSQL | Redis | Kafka | S3               │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Manifests Location
- `k8s/` directory at project root
- Istio service mesh configs in `k8s/istio/`

## Key Resources
| Resource | File | Purpose |
|----------|------|---------|
| Deployment | `k8s/deployment.yml` | App pods with health probes |
| Service | `k8s/service.yml` | Internal ClusterIP |
| Ingress | `k8s/ingress.yml` | External HTTPS access |
| HPA | `k8s/hpa.yml` | Auto-scaling (CPU/memory) |
| ConfigMap | `k8s/configmap.yml` | Non-secret configuration |
| Secrets | Vault/SecretsManager | All credentials |

## CI/CD Deployment Workflows
| Workflow | Strategy |
|----------|----------|
| `canary-deployment.yml` | Istio traffic splitting (5%→25%→100%) |
| `blue-green-deployment.yml` | Service selector switch |
| `chaos-engineering.yml` | Chaos Mesh fault injection |

## Docker Image
```bash
# Build optimized image (~180MB)
docker build -f Dockerfile.optimized -t interview-platform:latest .
```
