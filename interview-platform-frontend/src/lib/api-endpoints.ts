/**
 * All backend API endpoints mapped to the Spring Boot backend at localhost:8080.
 * Base URL is configured via NEXT_PUBLIC_API_URL env variable.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  register: "/api/v1/auth/register",
  registerInterviewer: "/api/v1/auth/register/interviewer",
  adminCreateUser: "/api/v1/auth/admin/create-user",
  login: "/api/v1/auth/login",
  signup: "/api/v1/auth/register",
  google: "/api/v1/auth/google",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",
  verifyEmail: "/api/v1/auth/verify-email",
  resendVerification: "/api/v1/auth/resend-verification",
  oauthProviders: "/api/v1/auth/oauth2/providers",
} as const;

// ─── MFA ─────────────────────────────────────────────────────────────────────
export const MFA_ENDPOINTS = {
  setup: "/api/v1/auth/mfa/setup",
  verify: "/api/v1/auth/mfa/verify",
  validate: "/api/v1/auth/mfa/validate",
  disable: "/api/v1/auth/mfa/disable",
  regenerateBackupCodes: "/api/v1/auth/mfa/backup-codes/regenerate",
} as const;

// ─── API Keys ────────────────────────────────────────────────────────────────
export const API_KEY_ENDPOINTS = {
  create: "/api/v1/api-keys",
  getAll: "/api/v1/api-keys",
  revoke: (id: string) => `/api/v1/api-keys/${id}`,
} as const;

// ─── OAuth (redirect-based) ─────────────────────────────────────────────────
export const OAUTH_URLS = {
  google: `${API_BASE}/oauth2/authorization/google`,
  github: `${API_BASE}/oauth2/authorization/github`,
  microsoft: `${API_BASE}/oauth2/authorization/microsoft`,
} as const;

// ─── Users ───────────────────────────────────────────────────────────────────
export const USER_ENDPOINTS = {
  create: "/api/v1/users",
  me: "/api/v1/users/me",
  getAll: "/api/v1/users",
  getById: (userId: string) => `/api/v1/users/${userId}`,
  update: (userId: string) => `/api/v1/users/${userId}`,
  delete: (userId: string) => `/api/v1/users/${userId}`,
  updateProfile: (userId: string) => `/api/v1/users/${userId}/profile`,
  getProfile: (userId: string) => `/api/v1/users/${userId}/profile`,
  getPermissions: (userId: string) => `/api/v1/users/${userId}/permissions`,
  assignRole: (userId: string) => `/api/v1/users/${userId}/roles`,
  getRoles: (userId: string) => `/api/v1/users/${userId}/roles`,
  removeRole: (userId: string, roleId: string) => `/api/v1/users/${userId}/roles/${roleId}`,
  getAllRoles: "/api/v1/users/roles",
  changePassword: (userId: string) => `/api/v1/users/${userId}/change-password`,
  search: "/api/v1/users/search",
  updateStatus: (userId: string) => `/api/v1/users/${userId}/status`,
} as const;

// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLE_ENDPOINTS = {
  create: "/api/v1/roles",
  getAll: "/api/v1/roles",
  getById: (roleId: string) => `/api/v1/roles/${roleId}`,
  update: (roleId: string) => `/api/v1/roles/${roleId}`,
  delete: (roleId: string) => `/api/v1/roles/${roleId}`,
  assignPermission: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
  getPermissions: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
  removePermission: (rolePermissionId: string) => `/api/v1/roles/permissions/${rolePermissionId}`,
} as const;

// ─── Permissions ─────────────────────────────────────────────────────────────
export const PERMISSION_ENDPOINTS = {
  create: "/api/v1/permissions",
  getAll: "/api/v1/permissions",
  getById: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
  update: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
  delete: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
} as const;

// ─── Interviews ──────────────────────────────────────────────────────────────
export const INTERVIEW_ENDPOINTS = {
  create: "/api/v1/interviews",
  getById: (id: string) => `/api/v1/interviews/${id}`,
  getAll: "/api/v1/interviews",
  getPaginated: "/api/v1/interviews/paginated",
  update: (id: string) => `/api/v1/interviews/${id}`,
  delete: (id: string) => `/api/v1/interviews/${id}`,
  cancel: (id: string) => `/api/v1/interviews/${id}/cancel`,
  updateStatus: (id: string) => `/api/v1/interviews/${id}/status`,
  myCandidate: "/api/v1/interviews/my/candidate",
  myCandidatePaginated: "/api/v1/interviews/my/candidate/paginated",
  myInterviewer: "/api/v1/interviews/my/interviewer",
  myInterviewerPaginated: "/api/v1/interviews/my/interviewer/paginated",
  addInterviewer: (interviewId: string, interviewerId: string) =>
    `/api/v1/interviews/${interviewId}/interviewers/${interviewerId}`,
  removeInterviewer: (interviewId: string, interviewerId: string) =>
    `/api/v1/interviews/${interviewId}/interviewers/${interviewerId}`,
  submitFeedback: (id: string) => `/api/v1/interviews/${id}/feedback`,
  getFeedback: (id: string) => `/api/v1/interviews/${id}/feedback`,
  getFeedbackByInterviewer: (interviewId: string, interviewerId: string) =>
    `/api/v1/interviews/${interviewId}/feedback/interviewer/${interviewerId}`,
  getAllFeedbackByInterviewer: (interviewerId: string) =>
    `/api/v1/interviews/feedback/interviewer/${interviewerId}`,
  filterByStatus: "/api/v1/interviews/filter/status",
  filterByStatusPaginated: "/api/v1/interviews/filter/status/paginated",
  filterByDateRange: "/api/v1/interviews/filter/date-range",
  filterByDateRangePaginated: "/api/v1/interviews/filter/date-range/paginated",
  presence: (id: string) => `/api/v1/interviews/${id}/presence`,
  // Aliases for backward compatibility
  list: "/api/v1/interviews",
  start: (id: string) => `/api/v1/interviews/${id}/status`,
  submit: (id: string) => `/api/v1/interviews/${id}/status`,
  feedback: (id: string) => `/api/v1/interviews/${id}/feedback`,
} as const;

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const DASHBOARD_ENDPOINTS = {
  admin: "/api/v1/dashboard/admin",
  interviewer: "/api/v1/dashboard/interviewer",
  interviewerById: (id: string) => `/api/v1/dashboard/interviewer/${id}`,
  candidate: "/api/v1/dashboard/candidate",
  // Aliases
  stats: "/api/v1/dashboard/admin",
  recentSessions: "/api/v1/dashboard/admin",
  progress: "/api/v1/dashboard/candidate",
} as const;

// ─── Meetings ────────────────────────────────────────────────────────────────
export const MEETING_ENDPOINTS = {
  generate: (interviewId: string) => `/api/v1/interviews/${interviewId}/meeting`,
  get: (interviewId: string) => `/api/v1/interviews/${interviewId}/meeting`,
} as const;

// ─── Scheduling ──────────────────────────────────────────────────────────────
export const SCHEDULING_ENDPOINTS = {
  addAvailability: "/api/v1/scheduling/availability",
  getMyAvailability: "/api/v1/scheduling/availability/my",
  getUserAvailability: (userId: string) => `/api/v1/scheduling/availability/user/${userId}`,
  deleteSlot: (slotId: string) => `/api/v1/scheduling/availability/${slotId}`,
  suggest: "/api/v1/scheduling/suggest",
} as const;

// ─── Calendar ────────────────────────────────────────────────────────────────
export const CALENDAR_ENDPOINTS = {
  addAvailability: (interviewerId: string) =>
    `/api/v1/calendar/interviewers/${interviewerId}/availability`,
  getAvailability: (interviewerId: string) =>
    `/api/v1/calendar/interviewers/${interviewerId}/availability`,
  checkAvailability: (interviewerId: string) =>
    `/api/v1/calendar/interviewers/${interviewerId}/availability/check`,
  deleteAvailability: (interviewerId: string, availabilityId: string) =>
    `/api/v1/calendar/interviewers/${interviewerId}/availability/${availabilityId}`,
} as const;

// ─── Notifications ───────────────────────────────────────────────────────────
export const NOTIFICATION_ENDPOINTS = {
  getAll: "/api/v1/notifications",
  getUnread: "/api/v1/notifications/unread",
  getCount: "/api/v1/notifications/count",
  markRead: (id: string) => `/api/v1/notifications/${id}/read`,
  markAllRead: "/api/v1/notifications/read-all",
} as const;

// ─── Reports ─────────────────────────────────────────────────────────────────
export const REPORT_ENDPOINTS = {
  analytics: "/api/v1/reports/analytics",
  interviewerPerformance: (id: string) => `/api/v1/reports/analytics/interviewer/${id}`,
  pdfAnalytics: "/api/v1/reports/pdf/analytics",
  pdfInterviewer: (id: string) => `/api/v1/reports/pdf/interviewer/${id}`,
  pdfJobPosition: (id: string) => `/api/v1/reports/pdf/job-position/${id}`,
  conversionMetrics: "/api/v1/reports/metrics/conversion",
  timeToHire: "/api/v1/reports/metrics/time-to-hire",
} as const;

// ─── Documents ───────────────────────────────────────────────────────────────
export const DOCUMENT_ENDPOINTS = {
  upload: "/api/v1/documents",
  getById: (id: string) => `/api/v1/documents/${id}`,
  getByEntity: (entityType: string, entityId: string) =>
    `/api/v1/documents/entity/${entityType}/${entityId}`,
  getMy: "/api/v1/documents/my",
  getMyPaginated: "/api/v1/documents/my/paginated",
  getByType: (type: string) => `/api/v1/documents/type/${type}`,
  getDownloadUrl: (id: string) => `/api/v1/documents/${id}/download-url`,
  presignedUpload: "/api/v1/documents/presigned-upload",
  delete: (id: string) => `/api/v1/documents/${id}`,
  update: (id: string) => `/api/v1/documents/${id}`,
} as const;

// ─── Bulk Operations ─────────────────────────────────────────────────────────
export const BULK_ENDPOINTS = {
  scheduleInterviews: "/api/v1/bulk/interviews/schedule",
  inviteCandidates: "/api/v1/bulk/candidates/invite",
  export: "/api/v1/bulk/export",
} as const;

// ─── Export/Import ───────────────────────────────────────────────────────────
export const EXPORT_IMPORT_ENDPOINTS = {
  startExport: "/api/v1/export-import/export",
  startImport: "/api/v1/export-import/import",
  getJobs: "/api/v1/export-import/jobs",
  getJob: (id: string) => `/api/v1/export-import/jobs/${id}`,
  cancelJob: (id: string) => `/api/v1/export-import/jobs/${id}`,
} as const;

// ─── Scorecards ──────────────────────────────────────────────────────────────
export const SCORECARD_ENDPOINTS = {
  createCriteria: "/api/v1/scorecards/criteria",
  getAllCriteria: "/api/v1/scorecards/criteria",
  getCriteriaByType: (type: string) => `/api/v1/scorecards/criteria/type/${type}`,
  getCriteriaById: (id: string) => `/api/v1/scorecards/criteria/${id}`,
  updateCriteria: (id: string) => `/api/v1/scorecards/criteria/${id}`,
  deleteCriteria: (id: string) => `/api/v1/scorecards/criteria/${id}`,
  submit: "/api/v1/scorecards",
  getById: (id: string) => `/api/v1/scorecards/${id}`,
  getByInterview: (interviewId: string) => `/api/v1/scorecards/interview/${interviewId}`,
  getByInterviewAndInterviewer: (interviewId: string, interviewerId: string) =>
    `/api/v1/scorecards/interview/${interviewId}/interviewer/${interviewerId}`,
  getByInterviewer: (interviewerId: string) => `/api/v1/scorecards/interviewer/${interviewerId}`,
  getByCandidate: (candidateId: string) => `/api/v1/scorecards/candidate/${candidateId}`,
  getSummary: (interviewId: string) => `/api/v1/scorecards/interview/${interviewId}/summary`,
} as const;

// ─── Templates ───────────────────────────────────────────────────────────────
export const TEMPLATE_ENDPOINTS = {
  create: "/api/v1/templates",
  getById: (id: string) => `/api/v1/templates/${id}`,
  getAll: "/api/v1/templates",
  getPaginated: "/api/v1/templates/paginated",
  filterByType: "/api/v1/templates/filter/type",
  search: "/api/v1/templates/search",
  update: (id: string) => `/api/v1/templates/${id}`,
  delete: (id: string) => `/api/v1/templates/${id}`,
  addQuestion: (id: string) => `/api/v1/templates/${id}/questions`,
  removeQuestion: (templateId: string, questionId: string) =>
    `/api/v1/templates/${templateId}/questions/${questionId}`,
  createInterview: "/api/v1/templates/create-interview",
} as const;

// ─── Code Editor ─────────────────────────────────────────────────────────────
export const CODE_EDITOR_ENDPOINTS = {
  start: (interviewId: string) => `/api/v1/interviews/${interviewId}/code/start`,
  getActive: (interviewId: string) => `/api/v1/interviews/${interviewId}/code`,
  save: (interviewId: string) => `/api/v1/interviews/${interviewId}/code/save`,
  end: (interviewId: string) => `/api/v1/interviews/${interviewId}/code/end`,
  getHistory: (interviewId: string) => `/api/v1/interviews/${interviewId}/code/history`,
} as const;

// ─── Question Bank ───────────────────────────────────────────────────────────
export const QUESTION_ENDPOINTS = {
  createCategory: "/api/v1/questions/categories",
  getCategories: "/api/v1/questions/categories",
  create: "/api/v1/questions",
  getById: (id: string) => `/api/v1/questions/${id}`,
  update: (id: string) => `/api/v1/questions/${id}`,
  delete: (id: string) => `/api/v1/questions/${id}`,
  search: "/api/v1/questions/search",
  byCategory: (categoryId: string) => `/api/v1/questions/category/${categoryId}`,
  // Aliases
  list: "/api/v1/questions/search",
  random: "/api/v1/questions/search",
} as const;

// ─── Teams ───────────────────────────────────────────────────────────────────
export const TEAM_ENDPOINTS = {
  create: "/api/v1/teams",
  getById: (id: string) => `/api/v1/teams/${id}`,
  getAll: "/api/v1/teams",
  getByDepartment: (dept: string) => `/api/v1/teams/department/${dept}`,
  getMy: "/api/v1/teams/my",
  update: (id: string) => `/api/v1/teams/${id}`,
  delete: (id: string) => `/api/v1/teams/${id}`,
  addMember: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`,
  removeMember: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`,
  updateMemberRole: (teamId: string, userId: string) =>
    `/api/v1/teams/${teamId}/members/${userId}/role`,
} as const;

// ─── Pipelines ───────────────────────────────────────────────────────────────
export const PIPELINE_ENDPOINTS = {
  create: "/api/v1/pipelines",
  getById: (id: string) => `/api/v1/pipelines/${id}`,
  getAll: "/api/v1/pipelines",
  getByDepartment: (dept: string) => `/api/v1/pipelines/department/${dept}`,
  update: (id: string) => `/api/v1/pipelines/${id}`,
  delete: (id: string) => `/api/v1/pipelines/${id}`,
  addCandidate: "/api/v1/pipelines/candidates",
  getCandidatePipeline: (id: string) => `/api/v1/pipelines/candidates/${id}`,
  getCandidatesInPipeline: (pipelineId: string) => `/api/v1/pipelines/${pipelineId}/candidates`,
  getCandidatePipelines: (candidateId: string) => `/api/v1/pipelines/candidates/user/${candidateId}`,
  advance: (candidatePipelineId: string) =>
    `/api/v1/pipelines/candidates/${candidatePipelineId}/advance`,
  reject: (candidatePipelineId: string) =>
    `/api/v1/pipelines/candidates/${candidatePipelineId}/reject`,
  updateStage: (candidatePipelineId: string, stageId: string) =>
    `/api/v1/pipelines/candidates/${candidatePipelineId}/stages/${stageId}`,
  updateCandidateStatus: (candidatePipelineId: string) =>
    `/api/v1/pipelines/candidates/${candidatePipelineId}/status`,
} as const;

// ─── Job Positions ───────────────────────────────────────────────────────────
export const JOB_POSITION_ENDPOINTS = {
  create: "/api/v1/job-positions",
  getById: (id: string) => `/api/v1/job-positions/${id}`,
  getAll: "/api/v1/job-positions",
  getPaginated: "/api/v1/job-positions/paginated",
  search: "/api/v1/job-positions/search",
  filterByStatus: "/api/v1/job-positions/filter/status",
  getMy: "/api/v1/job-positions/my",
  update: (id: string) => `/api/v1/job-positions/${id}`,
  updateStatus: (id: string) => `/api/v1/job-positions/${id}/status`,
  delete: (id: string) => `/api/v1/job-positions/${id}`,
  linkInterview: (positionId: string, interviewId: string) =>
    `/api/v1/job-positions/${positionId}/interviews/${interviewId}`,
  unlinkInterview: (interviewId: string) => `/api/v1/job-positions/interviews/${interviewId}`,
} as const;

// ─── Webhooks ────────────────────────────────────────────────────────────────
export const WEBHOOK_ENDPOINTS = {
  create: "/api/v1/webhooks",
  getAll: "/api/v1/webhooks",
  getById: (id: string) => `/api/v1/webhooks/${id}`,
  update: (id: string) => `/api/v1/webhooks/${id}`,
  delete: (id: string) => `/api/v1/webhooks/${id}`,
  regenerateSecret: (id: string) => `/api/v1/webhooks/${id}/regenerate-secret`,
  getDeliveries: (id: string) => `/api/v1/webhooks/${id}/deliveries`,
  retryDelivery: (deliveryId: string) => `/api/v1/webhooks/deliveries/${deliveryId}/retry`,
} as const;

// ─── Activity Feed ───────────────────────────────────────────────────────────
export const ACTIVITY_ENDPOINTS = {
  getAll: "/api/v1/activities",
  getByEntity: (entityType: string, entityId: string) =>
    `/api/v1/activities/entity/${entityType}/${entityId}`,
  getByUser: (userId: string) => `/api/v1/activities/user/${userId}`,
  getMy: "/api/v1/activities/my",
  filter: "/api/v1/activities/filter",
} as const;

// ─── Candidate Feedback ──────────────────────────────────────────────────────
export const CANDIDATE_FEEDBACK_ENDPOINTS = {
  submit: "/api/v1/candidate-feedback",
  getByInterview: (interviewId: string) => `/api/v1/candidate-feedback/interview/${interviewId}`,
  getSummary: "/api/v1/candidate-feedback/summary",
  getMy: "/api/v1/candidate-feedback/my",
} as const;

// ─── Whiteboard ──────────────────────────────────────────────────────────────
export const WHITEBOARD_ENDPOINTS = {
  create: "/api/v1/whiteboards",
  getById: (id: string) => `/api/v1/whiteboards/${id}`,
  getByInterview: (interviewId: string) => `/api/v1/whiteboards/interview/${interviewId}`,
  addStroke: (id: string) => `/api/v1/whiteboards/${id}/strokes`,
  getStrokes: (id: string) => `/api/v1/whiteboards/${id}/strokes`,
  saveSnapshot: (id: string) => `/api/v1/whiteboards/${id}/snapshot`,
  close: (id: string) => `/api/v1/whiteboards/${id}/close`,
  delete: (id: string) => `/api/v1/whiteboards/${id}`,
} as const;

// ─── Video Recordings ────────────────────────────────────────────────────────
export const VIDEO_ENDPOINTS = {
  start: "/api/v1/video-recordings/start",
  complete: (id: string) => `/api/v1/video-recordings/${id}/complete`,
  fail: (id: string) => `/api/v1/video-recordings/${id}/fail`,
  getByInterview: (interviewId: string) => `/api/v1/video-recordings/interview/${interviewId}`,
  getById: (id: string) => `/api/v1/video-recordings/${id}`,
  delete: (id: string) => `/api/v1/video-recordings/${id}`,
  getMy: "/api/v1/video-recordings/my",
} as const;

// ─── AI ──────────────────────────────────────────────────────────────────────
export const AI_ENDPOINTS = {
  suggestQuestions: "/api/v1/ai/suggest-questions",
  parseResume: "/api/v1/ai/parse-resume",
  interviewSummary: "/api/v1/ai/interview-summary",
  getSuggestions: "/api/v1/ai/suggestions",
  getSuggestionsByInterview: (interviewId: string) =>
    `/api/v1/ai/suggestions/interview/${interviewId}`,
  updateSuggestionStatus: (id: string) => `/api/v1/ai/suggestions/${id}/status`,
} as const;

// ─── Organizations ───────────────────────────────────────────────────────────
export const ORGANIZATION_ENDPOINTS = {
  create: "/api/v1/organizations",
  getById: (id: string) => `/api/v1/organizations/${id}`,
  update: (id: string) => `/api/v1/organizations/${id}`,
  delete: (id: string) => `/api/v1/organizations/${id}`,
  getMy: "/api/v1/organizations/my",
  addMember: (id: string) => `/api/v1/organizations/${id}/members`,
  removeMember: (id: string, userId: string) => `/api/v1/organizations/${id}/members/${userId}`,
  getMembers: (id: string) => `/api/v1/organizations/${id}/members`,
  updateMemberRole: (id: string, userId: string) =>
    `/api/v1/organizations/${id}/members/${userId}/role`,
} as const;

// ─── Tags ────────────────────────────────────────────────────────────────────
export const TAG_ENDPOINTS = {
  create: "/api/v1/tags",
  getAll: "/api/v1/tags",
  getByCategory: (category: string) => `/api/v1/tags/category/${category}`,
  search: "/api/v1/tags/search",
  delete: (tagId: string) => `/api/v1/tags/${tagId}`,
  tagEntity: (tagId: string, entityType: string, entityId: string) =>
    `/api/v1/tags/${tagId}/entities/${entityType}/${entityId}`,
  untagEntity: (tagId: string, entityType: string, entityId: string) =>
    `/api/v1/tags/${tagId}/entities/${entityType}/${entityId}`,
  getEntityTags: (entityType: string, entityId: string) =>
    `/api/v1/tags/entities/${entityType}/${entityId}`,
  getEntitiesByTag: (tagId: string, entityType: string) =>
    `/api/v1/tags/${tagId}/entities/${entityType}`,
} as const;

// ─── Self-Service ────────────────────────────────────────────────────────────
export const SELF_SERVICE_ENDPOINTS = {
  submitSlots: "/api/v1/self-service/preferred-slots",
  getMySlots: "/api/v1/self-service/preferred-slots/my",
  getByInterview: (interviewId: string) =>
    `/api/v1/self-service/preferred-slots/interview/${interviewId}`,
  getByJobPosition: (jobPositionId: string) =>
    `/api/v1/self-service/preferred-slots/job-position/${jobPositionId}`,
  updateSlotStatus: (slotId: string) => `/api/v1/self-service/preferred-slots/${slotId}/status`,
  deleteSlot: (slotId: string) => `/api/v1/self-service/preferred-slots/${slotId}`,
} as const;

// ─── Reminders ───────────────────────────────────────────────────────────────
export const REMINDER_ENDPOINTS = {
  create: (interviewId: string) => `/api/v1/reminders/interview/${interviewId}`,
  cancel: (interviewId: string) => `/api/v1/reminders/interview/${interviewId}`,
  getByInterview: (interviewId: string) => `/api/v1/reminders/interview/${interviewId}`,
  getMy: "/api/v1/reminders/my",
} as const;

// ─── Audit ───────────────────────────────────────────────────────────────────
export const AUDIT_ENDPOINTS = {
  getAll: "/api/v1/audit",
  getByEntity: (entityType: string, entityId: string) =>
    `/api/v1/audit/entity/${entityType}/${entityId}`,
  getByUser: (email: string) => `/api/v1/audit/user/${email}`,
} as const;

// ─── GDPR ────────────────────────────────────────────────────────────────────
export const GDPR_ENDPOINTS = {
  recordConsent: "/api/v1/gdpr/consent",
  getConsents: "/api/v1/gdpr/consent",
  revokeConsent: (consentType: string) => `/api/v1/gdpr/consent/${consentType}`,
  exportData: "/api/v1/gdpr/export",
  requestErasure: "/api/v1/gdpr/erasure",
  getErasureRequests: "/api/v1/gdpr/erasure/requests",
  processErasure: (requestId: string) => `/api/v1/gdpr/erasure/${requestId}/process`,
} as const;

// ─── Advanced Analytics ──────────────────────────────────────────────────────
export const ANALYTICS_ENDPOINTS = {
  cohorts: "/api/v1/analytics/cohorts",
  leaderboard: "/api/v1/analytics/leaderboard",
  realtime: "/api/v1/analytics/realtime",
  retention: "/api/v1/analytics/retention",
} as const;

// ─── Code Execution ──────────────────────────────────────────────────────────
export const CODE_EXECUTION_ENDPOINTS = {
  execute: "/api/v1/code/execute",
  executeWithTestCases: "/api/v1/code/execute/test-cases",
} as const;

// ─── Global Search ───────────────────────────────────────────────────────────
export const SEARCH_ENDPOINTS = {
  search: "/api/v1/search",
} as const;

// ─── SSO/SAML ────────────────────────────────────────────────────────────────
export const SSO_ENDPOINTS = {
  create: "/api/v1/sso",
  update: (configId: string) => `/api/v1/sso/${configId}`,
  getById: (configId: string) => `/api/v1/sso/${configId}`,
  getByTenant: (tenantId: string) => `/api/v1/sso/tenant/${tenantId}`,
  toggle: (configId: string) => `/api/v1/sso/${configId}/toggle`,
  delete: (configId: string) => `/api/v1/sso/${configId}`,
  getLoginUrls: (tenantId: string) => `/api/v1/sso/tenant/${tenantId}/login-urls`,
} as const;

// ─── Account Security ────────────────────────────────────────────────────────
export const SECURITY_ENDPOINTS = {
  getLockoutStatus: (email: string) => `/api/v1/security/lockout/${email}`,
  unlockAccount: (email: string) => `/api/v1/security/lockout/${email}/unlock`,
  getBlockedIps: "/api/v1/security/blocked-ips",
  blockIp: "/api/v1/security/block-ip",
  unblockIp: (ipAddress: string) => `/api/v1/security/unblock-ip/${ipAddress}`,
  getLoginAttempts: (email: string) => `/api/v1/security/login-attempts/${email}`,
} as const;

// ─── WebSocket ───────────────────────────────────────────────────────────────
export const WEBSOCKET_CONFIG = {
  endpoint: `${API_BASE}/ws`,
  topics: {
    interview: (interviewId: string) => `/topic/interview/${interviewId}`,
    code: (interviewId: string) => `/topic/interview/${interviewId}/code`,
    signal: (interviewId: string) => `/topic/interview/${interviewId}/signal`,
  },
  destinations: {
    join: (interviewId: string) => `/app/interview/${interviewId}/join`,
    leave: (interviewId: string) => `/app/interview/${interviewId}/leave`,
    chat: (interviewId: string) => `/app/interview/${interviewId}/chat`,
    code: (interviewId: string) => `/app/interview/${interviewId}/code`,
    signal: (interviewId: string) => `/app/interview/${interviewId}/signal`,
    status: (interviewId: string) => `/app/interview/${interviewId}/status`,
  },
} as const;

// ─── Messaging / Chat ────────────────────────────────────────────────────────
export const MESSAGING_ENDPOINTS = {
  createConversation: "/api/v1/messaging/conversations",
  getConversations: "/api/v1/messaging/conversations",
  sendMessage: (conversationId: string) => `/api/v1/messaging/conversations/${conversationId}/messages`,
  getMessages: (conversationId: string) => `/api/v1/messaging/conversations/${conversationId}/messages`,
  markAsRead: (conversationId: string) => `/api/v1/messaging/conversations/${conversationId}/read`,
  getThreadReplies: (messageId: string) => `/api/v1/messaging/messages/${messageId}/replies`,
  deleteMessage: (messageId: string) => `/api/v1/messaging/messages/${messageId}`,
} as const;

// ─── Background Checks ──────────────────────────────────────────────────────
export const BACKGROUND_CHECK_ENDPOINTS = {
  initiate: "/api/v1/background-checks/initiate",
  getStatus: (checkId: string) => `/api/v1/background-checks/${checkId}/status`,
} as const;

// ─── ATS Integration ────────────────────────────────────────────────────────
export const ATS_ENDPOINTS = {
  syncCandidates: (provider: string) => `/api/v1/integrations/ats/${provider}/sync`,
  pushCandidate: (provider: string) => `/api/v1/integrations/ats/${provider}/push`,
} as const;

// ─── Job Board Posting ──────────────────────────────────────────────────────
export const JOB_BOARD_ENDPOINTS = {
  postToAll: "/api/v1/job-boards/post-all",
  postToBoard: (board: string) => `/api/v1/job-boards/post/${board}`,
} as const;

// ─── Recruiter SLA Tracking ─────────────────────────────────────────────────
export const SLA_ENDPOINTS = {
  getMetrics: "/api/v1/sla/metrics",
  getWorkload: "/api/v1/sla/workload",
  getBottlenecks: "/api/v1/sla/bottlenecks",
} as const;

// ─── Feature Flags ──────────────────────────────────────────────────────────
export const FEATURE_FLAG_ENDPOINTS = {
  getAll: "/api/v1/feature-flags",
  getFlag: (flagKey: string) => `/api/v1/feature-flags/${flagKey}`,
  setFlag: (flagKey: string) => `/api/v1/feature-flags/${flagKey}`,
} as const;

// ─── Billing / Stripe ───────────────────────────────────────────────────────
export const BILLING_ENDPOINTS = {
  createCustomer: "/api/v1/billing/customers",
  createCheckout: "/api/v1/billing/checkout",
  getSubscription: (subscriptionId: string) => `/api/v1/billing/subscriptions/${subscriptionId}`,
  cancelSubscription: (subscriptionId: string) => `/api/v1/billing/subscriptions/${subscriptionId}/cancel`,
  createPortal: "/api/v1/billing/portal",
} as const;

// ─── Predictive Analytics ───────────────────────────────────────────────────
export const PREDICTION_ENDPOINTS = {
  candidateSuccess: (candidateId: string) => `/api/v1/predictions/candidate/${candidateId}/success`,
  interviewerBias: (interviewerId: string) => `/api/v1/predictions/interviewer/${interviewerId}/bias`,
  timeToHire: "/api/v1/predictions/time-to-hire",
} as const;

// ─── Candidate Chatbot ──────────────────────────────────────────────────────
export const CHATBOT_ENDPOINTS = {
  sendMessage: "/api/v1/chatbot/message",
} as const;

// ─── WebRTC Video ───────────────────────────────────────────────────────────
export const WEBRTC_ENDPOINTS = {
  joinRoom: (roomId: string) => `/api/v1/video/webrtc/rooms/${roomId}/join`,
  leaveRoom: (roomId: string) => `/api/v1/video/webrtc/rooms/${roomId}/leave`,
  getRoomStatus: (roomId: string) => `/api/v1/video/webrtc/rooms/${roomId}/status`,
  getIceServers: "/api/v1/video/webrtc/ice-servers",
} as const;

// ─── Plagiarism Detection ───────────────────────────────────────────────────
export const PLAGIARISM_ENDPOINTS = {
  check: "/api/v1/plagiarism/check",
  compare: "/api/v1/plagiarism/compare",
} as const;

// ─── Test Case Validation ───────────────────────────────────────────────────
export const TEST_CASE_ENDPOINTS = {
  validate: "/api/v1/test-cases/validate",
} as const;

// ─── Data Residency ─────────────────────────────────────────────────────────
export const DATA_RESIDENCY_ENDPOINTS = {
  getRegion: "/api/v1/data-residency/region",
  validateTransfer: "/api/v1/data-residency/validate-transfer",
  getCompliance: "/api/v1/data-residency/compliance",
} as const;

// ─── AI Interview Scoring ───────────────────────────────────────────────────
export const AI_SCORING_ENDPOINTS = {
  analyze: "/api/v1/ai-scoring/analyze",
} as const;

// ─── Assessment Marketplace ─────────────────────────────────────────────────
export const MARKETPLACE_ENDPOINTS = {
  getProviders: "/api/v1/marketplace/assessments/providers",
  getAssessments: (providerId: string) => `/api/v1/marketplace/assessments/providers/${providerId}/assessments`,
  orderAssessment: "/api/v1/marketplace/assessments/order",
  getResult: (orderId: string) => `/api/v1/marketplace/assessments/orders/${orderId}/result`,
} as const;

// ─── IP Whitelisting ────────────────────────────────────────────────────────
export const IP_WHITELIST_ENDPOINTS = {
  getWhitelist: (orgId: string) => `/api/v1/organizations/${orgId}/ip-whitelist`,
  addEntry: (orgId: string) => `/api/v1/organizations/${orgId}/ip-whitelist`,
  removeEntry: (orgId: string, entryId: string) => `/api/v1/organizations/${orgId}/ip-whitelist/${entryId}`,
  checkIp: (orgId: string) => `/api/v1/organizations/${orgId}/ip-whitelist/check`,
} as const;
