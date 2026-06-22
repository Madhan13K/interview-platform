# Interview Platform - Entity Design & API Reference

## Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CORE AUTH                                         │
│                                                                               │
│  ┌─────────┐    ┌───────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │  users  │───▶│ user_roles│───▶│    roles     │───▶│ role_permissions  │  │
│  │  (UUID) │    └───────────┘    │    (UUID)    │    │                   │  │
│  │         │                     └──────────────┘    └─────────┬─────────┘  │
│  │         │    ┌───────────────┐                              │            │
│  │         │───▶│refresh_tokens │                    ┌─────────▼─────────┐  │
│  │         │    └───────────────┘                    │   permissions     │  │
│  │         │    ┌───────────────┐                    │     (UUID)        │  │
│  │         │───▶│  user_mfa     │                    └───────────────────┘  │
│  │         │    └───────────────┘                                           │
│  │         │    ┌───────────────┐                                           │
│  │         │───▶│  api_keys     │                                           │
│  └────┬────┘    └───────────────┘                                           │
│       │                                                                      │
└───────┼──────────────────────────────────────────────────────────────────────┘
        │
        ├──────────────────────────────────────────────────────┐
        │                                                       │
┌───────▼──────────────────────────────────────────┐    ┌──────▼───────────────┐
│              INTERVIEWS                           │    │    ORGANIZATIONS      │
│                                                   │    │                       │
│  ┌────────────┐     ┌──────────────────────┐    │    │  ┌──────────────┐    │
│  │ interviews │────▶│interview_interviewers │    │    │  │organizations │    │
│  │   (UUID)   │     │       (M2M)          │    │    │  │    (UUID)    │    │
│  │            │     └──────────────────────┘    │    │  └──────┬───────┘    │
│  │            │     ┌──────────────────────┐    │    │         │            │
│  │            │────▶│ interview_feedback    │    │    │  ┌──────▼───────┐    │
│  │            │     └──────────────────────┘    │    │  │org_members   │    │
│  │            │     ┌──────────────────────┐    │    │  └──────────────┘    │
│  │            │────▶│   meeting_links      │    │    └───────────────────────┘
│  │            │     └──────────────────────┘    │
│  │            │     ┌──────────────────────┐    │    ┌───────────────────────┐
│  │            │────▶│  coding_sessions     │    │    │       TEAMS           │
│  └────────────┘     └──────────────────────┘    │    │                       │
│                                                   │    │  ┌──────────┐        │
└───────────────────────────────────────────────────┘    │  │  teams   │        │
                                                         │  │  (UUID)  │        │
┌───────────────────────────────────────────┐            │  └────┬─────┘        │
│           PIPELINES                        │            │       │              │
│                                            │            │  ┌────▼─────────┐   │
│  ┌───────────────────┐                    │            │  │team_members  │   │
│  │interview_pipelines│                    │            │  └──────────────┘   │
│  │     (UUID)        │                    │            └───────────────────────┘
│  └────────┬──────────┘                    │
│           │                               │
│  ┌────────▼──────────┐                    │
│  │ pipeline_stages   │                    │
│  │   (ordered)       │                    │
│  └────────┬──────────┘                    │
│           │                               │
│  ┌────────▼──────────────────┐            │
│  │  candidate_pipelines      │            │
│  │  (candidate + stage)      │            │
│  └────────┬──────────────────┘            │
│           │                               │
│  ┌────────▼──────────────────┐            │
│  │candidate_stage_progress   │            │
│  └───────────────────────────┘            │
└───────────────────────────────────────────┘
```

---

## All Entities (63 total)

### Auth & Users (11 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| User | `users` | id (UUID), firstName, lastName, email (unique), password (BCrypt), status, authProvider | → UserRole, RefreshToken, UserMfa, ApiKey |
| Role | `roles` | id, name (unique), description | → RolePermission, UserRole |
| Permission | `permissions` | id, name (unique), description | → RolePermission |
| UserRole | `user_roles` | userId, roleId | User ← → Role |
| RolePermission | `role_permissions` | roleId, permissionId | Role ← → Permission |
| RefreshToken | `refresh_tokens` | id, token (TEXT), tokenFamily, userId, expiresAt, revoked | → User |
| PasswordResetToken | `password_reset_tokens` | id, token, expiryTime, used, userId | → User |
| EmailVerificationToken | `email_verification_tokens` | id, token, expiryTime, used, userId | → User |
| UserMfa | `user_mfa` | id, userId (unique), secret, isEnabled, backupCodes (TEXT[]), verifiedAt | → User |
| ApiKey | `api_keys` | id, name, keyHash (SHA-256), prefix, userId, expiresAt, lastUsedAt | → User |
| UserProfile | `user_profiles` | id, userId, bio, designation, company, experienceYears, linkedinUrl, githubUrl | → User |

### Interviews (5 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| Interview | `interviews` | id, title, type (enum), status (enum), scheduledAt, duration, candidateId, scheduledBy, notes | → User (candidate, scheduler), InterviewInterviewer |
| InterviewInterviewer | `interview_interviewers` | interviewId, interviewerId | Interview ← → User |
| InterviewFeedback | `interview_feedback` | id, interviewId, interviewerId, rating, strengths, weaknesses, recommendation (enum), notes | → Interview, User |
| MeetingLink | `meeting_links` | id, interviewId, provider (enum), meetingUrl, hostUrl, password, expiresAt | → Interview |
| CodingSession | `coding_sessions` | id, interviewId, language, code, status, startedAt, endedAt | → Interview |

### Scheduling (4 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| InterviewerAvailability | `interviewer_availability` | id, interviewerId, dayOfWeek, startTime, endTime, timezone | → User |
| AvailabilitySlot | `availability_slots` | id, userId, dayOfWeek, startTime, endTime, recurring, specificDate | → User |
| InterviewReminder | `interview_reminders` | id, interviewId, userId, type (EMAIL/SMS/PUSH), scheduledAt, sent, sentAt | → Interview, User |
| CandidatePreferredSlot | `candidate_preferred_slots` | id, candidateId, interviewId, startTime, endTime, status, note | → User, Interview |

### Pipelines (4 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| InterviewPipeline | `interview_pipelines` | id, name, department, isActive, createdBy | → User, PipelineStage |
| PipelineStage | `pipeline_stages` | id, pipelineId, name, order, type (enum) | → InterviewPipeline |
| CandidatePipeline | `candidate_pipelines` | id, pipelineId, candidateId, currentStageId, status (enum) | → Pipeline, User, Stage |
| CandidateStageProgress | `candidate_stage_progress` | id, candidatePipelineId, stageId, enteredAt, completedAt, notes | → CandidatePipeline, Stage |

### Question Bank (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| QuestionCategory | `question_categories` | id (UUID, gen_random), name (unique), description | → Question |
| Question | `questions` | id, title, description, categoryId, difficulty (enum), type (enum), expectedAnswer, tags | → QuestionCategory |

### Templates (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| InterviewTemplate | `interview_templates` | id, title, description, type, mode, duration, evaluationCriteria, instructions | → TemplateQuestion |
| TemplateQuestion | `template_questions` | id, templateId, questionId, orderIndex, required | → Template, Question |

### Scoring (3 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| EvaluationCriteria | `evaluation_criteria` | id, name, description, interviewType, maxScore, weight, orderIndex, isActive | |
| EvaluationScorecard | `evaluation_scorecards` | id, interviewId, interviewerId, candidateId, overallScore, recommendation, notes | → Interview, User |
| ScorecardEntry | `scorecard_entries` | id, scorecardId, criteriaId, score, notes | → Scorecard, Criteria |

### Jobs (1 entity)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| JobPosition | `job_positions` | id, title, department, location, employmentType, experienceLevel, status, description, requirements, skills, salaryMin, salaryMax | |

### Documents (1 entity)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| Document | `documents` | id, fileName, originalFileName, contentType, fileSize, s3Bucket, s3Key (unique), documentType, entityType, entityId, uploadedBy | → User |

### Notifications (1 entity)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| Notification | `notifications` | id, userId, type, title, message, read, referenceId, referenceType, createdAt | → User |

### Collaboration (4 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| WhiteboardSession | `whiteboard_sessions` | id, interviewId, createdBy, status, snapshotUrl | → Interview, User |
| WhiteboardStroke | `whiteboard_strokes` | id, sessionId, userId, type, data (JSON), color, width | → WhiteboardSession, User |
| VideoRecording | `video_recordings` | id, interviewId, status, duration, fileSize, s3Key, startedAt, completedAt | → Interview |
| CandidateFeedback | `candidate_feedback` | id, interviewId, candidateId, overallRating, interviewerRating, processRating, comments, wouldRecommend | → Interview, User |

### Organizations & Teams (4 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| Organization | `organizations` | id, name, description, domain, plan, createdBy | → OrganizationMember |
| OrganizationMember | `organization_members` | id, organizationId, userId, role (OWNER/ADMIN/MEMBER) | → Organization, User |
| Team | `teams` | id, name, description, department, isActive, createdBy | → TeamMember |
| TeamMember | `team_members` | id, teamId, userId, role | → Team, User |

### Tags (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| Tag | `tags` | id, name, category, color | → EntityTag |
| EntityTag | `entity_tags` | id, tagId, entityType, entityId | → Tag |

### AI (1 entity)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| AiSuggestion | `ai_suggestions` | id, userId, type (enum), inputContext, outputContent, model, tokensUsed, confidenceScore, status, interviewId | → User |

### Webhooks (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| WebhookEndpoint | `webhook_endpoints` | id, userId, url, events (JSON), secret (HMAC), active | → User, WebhookDelivery |
| WebhookDelivery | `webhook_deliveries` | id, webhookId, event, payload, statusCode, success, deliveredAt, responseBody | → WebhookEndpoint |

### Activity & Export (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| ActivityEvent | `activity_events` | id, userId, action, entityType, entityId, description, metadata (JSON), createdAt | → User |
| ExportImportJob | `export_import_jobs` | id, userId, type (EXPORT/IMPORT), status, format, entityType, fileName, downloadUrl, totalRecords, processedRecords | → User |

### GDPR (2 entities)
| Entity | Table | Key Fields | Relations |
|--------|-------|-----------|-----------|
| UserConsent | `user_consents` | id, userId, consentType, granted, grantedAt, revokedAt | → User |
| DataErasureRequest | `data_erasure_requests` | id, userId, reason, status, requestedAt, processedAt | → User |

---

## API Endpoints by Controller (244 total)

| Controller | Base Path | Endpoints | Key Operations |
|-----------|-----------|-----------|----------------|
| AuthController | `/api/v1/auth` | 10 | register, login, refresh, logout, forgot/reset password, verify email |
| MfaController | `/api/v1/auth/mfa` | 5 | setup, verify, validate, disable, regenerate backup codes |
| OAuth2Controller | `/api/v1/auth/oauth2` | 1 | list providers |
| UserController | `/api/v1/users` | 16 | CRUD, profile, roles, permissions, search, status |
| RoleController | `/api/v1/roles` | 5 | CRUD |
| PermissionController | `/api/v1/permissions` | 5 | CRUD |
| RolePermissionController | `/api/v1/roles/*/permissions` | 3 | assign, list, remove |
| InterviewController | `/api/v1/interviews` | 22 | CRUD, status, feedback, filter, my-interviews |
| MeetingController | `/api/v1/interviews/*/meeting` | 2 | generate, get |
| CodingSessionController | `/api/v1/interviews/*/code` | 5 | start, get, save, end, history |
| CodeExecutionController | `/api/v1/code/execute` | 2 | execute, test-cases |
| SchedulingController | `/api/v1/scheduling` | 5 | availability CRUD, suggest |
| CalendarController | `/api/v1/calendar` | 4 | interviewer availability |
| CandidateSelfServiceController | `/api/v1/self-service` | 6 | preferred slots CRUD |
| ReminderController | `/api/v1/reminders` | 4 | create, cancel, get, my |
| PipelineController | `/api/v1/pipelines` | 14 | CRUD, candidates, advance, reject |
| JobPositionController | `/api/v1/job-positions` | 12 | CRUD, search, status, link interview |
| InterviewTemplateController | `/api/v1/templates` | 11 | CRUD, questions, create interview |
| QuestionBankController | `/api/v1/questions` | 8 | CRUD, categories, search |
| EvaluationScorecardController | `/api/v1/scorecards` | 13 | criteria CRUD, submit, get by interview/candidate |
| DashboardController | `/api/v1/dashboard` | 4 | admin, interviewer, candidate |
| AdvancedAnalyticsController | `/api/v1/analytics` | 4 | cohorts, leaderboard, realtime, retention |
| ReportController | `/api/v1/reports` | 7 | analytics, PDF, conversion, time-to-hire |
| SearchController | `/api/v1/search` | 1 | global full-text search |
| AiController | `/api/v1/ai` | 6 | suggest, parse resume, summary, history, status |
| DocumentController | `/api/v1/documents` | 10 | upload, download, metadata, delete |
| NotificationController | `/api/v1/notifications` | 5 | list, unread, count, mark read |
| TeamController | `/api/v1/teams` | 10 | CRUD, members, roles |
| TagController | `/api/v1/tags` | 9 | CRUD, tag/untag entities |
| OrganizationController | `/api/v1/organizations` | 9 | CRUD, members, roles |
| WebhookController | `/api/v1/webhooks` | 8 | CRUD, regenerate secret, deliveries, retry |
| ActivityController | `/api/v1/activities` | 5 | feed, by entity, by user, my, filter |
| CandidateFeedbackController | `/api/v1/candidate-feedback` | 4 | submit, by interview, summary, my |
| VideoRecordingController | `/api/v1/video-recordings` | 7 | start, complete, fail, get, delete, my |
| WhiteboardController | `/api/v1/whiteboards` | 8 | CRUD, strokes, snapshot, close |
| BulkOperationController | `/api/v1/bulk` | 3 | schedule, invite, export |
| ExportImportController | `/api/v1/export-import` | 5 | export, import, jobs, cancel |
| GdprController | `/api/v1/gdpr` | 7 | consent CRUD, export, erasure |
| AuditController | `/api/v1/audit` | 3 | logs by entity, by user |
| BillingController | `/api/v1/billing` | 5 | plans, checkout, subscription, cancel, webhook |
| ApiKeyController | `/api/v1/api-keys` | 3 | create, list, revoke |
| AdminController | `/api/v1/admin` | 1 | admin test endpoint |
| JwksController | `/.well-known/jwks.json` | 1 | public RSA key |
| InterviewSessionController | WebSocket STOMP | 6 | join, leave, chat, code, signal, status |

**Total REST: 238 endpoints + 6 WebSocket destinations = 244**
