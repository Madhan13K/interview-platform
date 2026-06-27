# Entity Design Reference

## Database Statistics
- **160+ JPA Entities** across 159 packages
- **43 Flyway Migrations** (V1-V43)
- **PostgreSQL 16** with JSONB support

## Key Entity Groups

### Core
| Entity | Table | Key Fields |
|--------|-------|-----------|
| User | `users` | email, password, status, authProvider |
| Interview | `interviews` | title, status, type, candidateId, scheduledById |
| InterviewFeedBack | `interview_feedback` | rating, recommendation, strengths |
| JobPosition | `job_positions` | title, department, status, requirements |

### AI & Intelligence
| Entity | Table | Purpose |
|--------|-------|---------|
| AiSuggestion | `ai_suggestions` | AI-generated content |
| VideoAnalysisResult | `video_analysis_results` | Video engagement scores |
| TranscriptionSession | `transcription_sessions` | Live speech-to-text |
| ResumeRank | `resume_ranks` | AI resume scoring |
| MLModel / MLPrediction | `ml_models` / `ml_predictions` | Custom ML scoring |

### Security & Compliance
| Entity | Table | Purpose |
|--------|-------|---------|
| WebAuthnCredential | `webauthn_credentials` | FIDO2 passkeys |
| DlpPolicy / DlpIncident | `dlp_policies` / `dlp_incidents` | Data loss prevention |
| Soc2Control / Soc2Evidence | `soc2_controls` / `soc2_evidence` | SOC 2 compliance |
| IsmsPolicy / RiskAssessment | `isms_policies` / `risk_assessments` | ISO 27001 |
| HipaaAuditLog | `hipaa_audit_logs` | HIPAA PHI access tracking |
| PenTestReport / PenTestFinding | `pentest_reports` / `pentest_findings` | Security testing |

### Event Sourcing
| Entity | Table | Purpose |
|--------|-------|---------|
| DomainEvent | `domain_events` | Immutable event log |
| EventSnapshot | `event_snapshots` | Aggregate state snapshots |

### Related SDD
- Full schema: [AI_Interview_SDD/docs/16-database-design.md](../../AI_Interview_SDD/docs/16-database-design.md)
- Entity relationships: [AI_Interview_SDD/docs/25-entity-design.md](../../AI_Interview_SDD/docs/25-entity-design.md)
