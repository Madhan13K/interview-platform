// ─── Common Types ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Interview Types ────────────────────────────────────────────────────────

export type InterviewStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type InterviewType =
  | "TECHNICAL"
  | "BEHAVIORAL"
  | "SYSTEM_DESIGN"
  | "CODING"
  | "HR"
  | "CASE_STUDY";

export interface InterviewResponse {
  id: string;
  title: string;
  description?: string;
  type: InterviewType;
  status: InterviewStatus;
  scheduledAt: string;
  duration: number;
  candidateId: string;
  candidateName?: string;
  interviewerIds: string[];
  interviewerNames?: string[];
  jobPositionId?: string;
  meetingLink?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewRequest {
  title: string;
  description?: string;
  type: InterviewType;
  scheduledAt: string;
  duration: number;
  candidateId: string;
  interviewerIds?: string[];
  jobPositionId?: string;
  notes?: string;
}

export interface InterviewFeedbackRequest {
  rating: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: "STRONG_HIRE" | "HIRE" | "NO_HIRE" | "STRONG_NO_HIRE";
  notes?: string;
}

export interface InterviewFeedbackResponse {
  id: string;
  interviewId: string;
  interviewerId: string;
  interviewerName?: string;
  rating: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: string;
  notes?: string;
  createdAt: string;
}

// ─── Dashboard Types ────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalInterviews: number;
  scheduledInterviews: number;
  completedInterviews: number;
  cancelledInterviews: number;
  totalCandidates: number;
  totalInterviewers: number;
  averageRating: number;
  hireRate: number;
}

export interface InterviewerDashboardStats {
  totalInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  averageRating: number;
  pendingFeedback: number;
}

export interface CandidateDashboardStats {
  totalInterviews: number;
  upcomingInterviews: number;
  completedInterviews: number;
  offersReceived: number;
}

// ─── Scheduling Types ───────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  specificDate?: string;
}

export interface CreateAvailabilityRequest {
  dayOfWeek?: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
  specificDate?: string;
}

export interface TimeSuggestion {
  startTime: string;
  endTime: string;
  interviewerIds: string[];
  score: number;
}

// ─── Notification Types ─────────────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export interface NotificationCount {
  unreadCount: number;
}

// ─── Report Types ───────────────────────────────────────────────────────────

export interface AnalyticsReport {
  totalInterviews: number;
  completionRate: number;
  averageRating: number;
  hireRate: number;
  interviewsByType: Record<string, number>;
  interviewsByStatus: Record<string, number>;
  monthlyTrend: { month: string; count: number }[];
}

export interface ConversionMetrics {
  applied: number;
  screened: number;
  interviewed: number;
  offered: number;
  hired: number;
  conversionRates: Record<string, number>;
}

export interface TimeToHireMetrics {
  averageDays: number;
  medianDays: number;
  byDepartment: Record<string, number>;
  byPosition: Record<string, number>;
}

// ─── Document Types ─────────────────────────────────────────────────────────

export type DocumentType = "RESUME" | "COVER_LETTER" | "PORTFOLIO" | "CERTIFICATE" | "OTHER";

export interface DocumentResponse {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  documentType: DocumentType;
  entityType?: string;
  entityId?: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
}

export interface DocumentUploadRequest {
  file: File;
  documentType: DocumentType;
  entityType?: string;
  entityId?: string;
}

// ─── Scorecard Types ────────────────────────────────────────────────────────

export interface EvaluationCriteria {
  id: string;
  name: string;
  description?: string;
  category: string;
  interviewType: InterviewType;
  maxScore: number;
  weight: number;
}

export interface CreateCriteriaRequest {
  name: string;
  description?: string;
  category: string;
  interviewType: InterviewType;
  maxScore: number;
  weight: number;
}

export interface ScorecardResponse {
  id: string;
  interviewId: string;
  interviewerId: string;
  candidateId: string;
  scores: ScorecardScore[];
  overallScore: number;
  overallRating: number;
  recommendation: string;
  notes?: string;
  createdAt: string;
}

export interface ScorecardScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxScore: number;
  notes?: string;
}

export interface SubmitScorecardRequest {
  interviewId: string;
  candidateId: string;
  scores: { criteriaId: string; score: number; notes?: string }[];
  recommendation: string;
  notes?: string;
}

// ─── Template Types ─────────────────────────────────────────────────────────

export interface TemplateResponse {
  id: string;
  name: string;
  description?: string;
  type: InterviewType;
  duration: number;
  questions: TemplateQuestion[];
  createdBy: string;
  createdAt: string;
}

export interface TemplateQuestion {
  id: string;
  questionId: string;
  questionText: string;
  order: number;
  required: boolean;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: InterviewType;
  duration: number;
}

// ─── Question Bank Types ────────────────────────────────────────────────────

export type QuestionDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuestionCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export interface QuestionResponse {
  id: string;
  text: string;
  type: InterviewType;
  difficulty: QuestionDifficulty;
  categoryId: string;
  categoryName?: string;
  expectedAnswer?: string;
  hints?: string[];
  tags?: string[];
  createdBy: string;
  createdAt: string;
}

export interface CreateQuestionRequest {
  text: string;
  type: InterviewType;
  difficulty: QuestionDifficulty;
  categoryId: string;
  expectedAnswer?: string;
  hints?: string[];
  tags?: string[];
}

// ─── Team Types ─────────────────────────────────────────────────────────────

export interface TeamResponse {
  id: string;
  name: string;
  description?: string;
  department: string;
  leadId?: string;
  leadName?: string;
  memberCount: number;
  members?: TeamMember[];
  active: boolean;
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  department: string;
  leadId?: string;
}

// ─── Pipeline Types ─────────────────────────────────────────────────────────

export interface PipelineResponse {
  id: string;
  name: string;
  description?: string;
  department: string;
  stages: PipelineStage[];
  active: boolean;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  type: string;
}

export interface CreatePipelineRequest {
  name: string;
  description?: string;
  department: string;
  stages: { name: string; order: number; type: string }[];
}

export interface CandidatePipelineResponse {
  id: string;
  pipelineId: string;
  pipelineName: string;
  candidateId: string;
  candidateName: string;
  currentStageId: string;
  currentStageName: string;
  status: "ACTIVE" | "REJECTED" | "HIRED" | "WITHDRAWN";
  startedAt: string;
  updatedAt: string;
}

// ─── Job Position Types ─────────────────────────────────────────────────────

export type JobPositionStatus = "OPEN" | "CLOSED" | "ON_HOLD" | "DRAFT";

export interface JobPositionResponse {
  id: string;
  title: string;
  description?: string;
  department: string;
  location?: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experienceLevel: string;
  status: JobPositionStatus;
  openings: number;
  requirements?: string[];
  skills?: string[];
  salaryRange?: { min: number; max: number; currency: string };
  createdBy: string;
  createdAt: string;
}

export interface CreateJobPositionRequest {
  title: string;
  description?: string;
  department: string;
  location?: string;
  type: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  experienceLevel: string;
  openings: number;
  requirements?: string[];
  skills?: string[];
  salaryRange?: { min: number; max: number; currency: string };
}

// ─── Webhook Types ──────────────────────────────────────────────────────────

export interface WebhookResponse {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
  lastDeliveryAt?: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: string;
  statusCode?: number;
  success: boolean;
  deliveredAt: string;
  responseBody?: string;
}

// ─── Activity Types ─────────────────────────────────────────────────────────

export interface ActivityResponse {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Candidate Feedback Types ───────────────────────────────────────────────

export interface CandidateFeedbackResponse {
  id: string;
  interviewId: string;
  candidateId: string;
  overallRating: number;
  interviewerRating: number;
  processRating: number;
  comments?: string;
  wouldRecommend: boolean;
  createdAt: string;
}

export interface SubmitCandidateFeedbackRequest {
  interviewId: string;
  overallRating: number;
  interviewerRating: number;
  processRating: number;
  comments?: string;
  wouldRecommend: boolean;
}

// ─── Whiteboard Types ───────────────────────────────────────────────────────

export interface WhiteboardSession {
  id: string;
  interviewId: string;
  createdBy: string;
  status: "ACTIVE" | "CLOSED";
  snapshotUrl?: string;
  createdAt: string;
}

export interface WhiteboardStroke {
  id: string;
  sessionId: string;
  userId: string;
  type: "PEN" | "ERASER" | "SHAPE" | "TEXT";
  data: string;
  color?: string;
  width?: number;
  timestamp: string;
}

// ─── Video Recording Types ──────────────────────────────────────────────────

export interface VideoRecordingResponse {
  id: string;
  interviewId: string;
  status: "RECORDING" | "COMPLETED" | "FAILED";
  duration?: number;
  fileSize?: number;
  url?: string;
  startedAt: string;
  completedAt?: string;
}

// ─── AI Types ───────────────────────────────────────────────────────────────

export interface AISuggestionRequest {
  interviewType: InterviewType;
  skills?: string[];
  experienceLevel?: string;
  count?: number;
}

export interface AIResumeParseRequest {
  resumeText: string;
}

export interface AISuggestionResponse {
  id: string;
  interviewId?: string;
  type: string;
  content: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

export interface AIResumeParseResponse {
  name?: string;
  email?: string;
  phone?: string;
  skills: string[];
  experience: { company: string; role: string; duration: string }[];
  education: { institution: string; degree: string; year: string }[];
}

// ─── Organization Types ─────────────────────────────────────────────────────

export interface OrganizationResponse {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  logoUrl?: string;
  plan?: string;
  memberCount: number;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  domain?: string;
}

export interface OrganizationMember {
  userId: string;
  userName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

// ─── Tag Types ──────────────────────────────────────────────────────────────

export interface TagResponse {
  id: string;
  name: string;
  category?: string;
  color?: string;
  usageCount: number;
}

export interface CreateTagRequest {
  name: string;
  category?: string;
  color?: string;
}

// ─── Self-Service Types ─────────────────────────────────────────────────────

export interface PreferredSlotResponse {
  id: string;
  candidateId: string;
  interviewId?: string;
  jobPositionId?: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  note?: string;
  createdAt: string;
}

export interface SubmitPreferredSlotsRequest {
  interviewId?: string;
  jobPositionId?: string;
  slots: { startTime: string; endTime: string; note?: string }[];
}

// ─── Reminder Types ─────────────────────────────────────────────────────────

export interface ReminderResponse {
  id: string;
  interviewId: string;
  userId: string;
  type: "EMAIL" | "SMS" | "IN_APP";
  scheduledAt: string;
  sent: boolean;
  sentAt?: string;
}

// ─── Audit Types ────────────────────────────────────────────────────────────

export interface AuditLogResponse {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// ─── GDPR Types ─────────────────────────────────────────────────────────────

export interface ConsentResponse {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  grantedAt: string;
  revokedAt?: string;
}

export interface ErasureRequest {
  id: string;
  userId: string;
  userEmail: string;
  reason?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  requestedAt: string;
  processedAt?: string;
}

// ─── MFA Types ──────────────────────────────────────────────────────────────

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
  backupCodes?: string[];
}

export interface MFAVerifyRequest {
  code: string;
}

// ─── API Key Types ──────────────────────────────────────────────────────────

export interface ApiKeyResponse {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  expiresAt?: string;
}

export interface ApiKeyCreatedResponse extends ApiKeyResponse {
  key: string; // Only returned on creation
}

// ─── Export/Import Types ────────────────────────────────────────────────────

export type ExportFormat = "CSV" | "JSON" | "PDF";

export interface ExportJobResponse {
  id: string;
  type: "EXPORT" | "IMPORT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  format: ExportFormat;
  entityType: string;
  fileName?: string;
  downloadUrl?: string;
  totalRecords?: number;
  processedRecords?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// ─── Code Editor Types ──────────────────────────────────────────────────────

export interface CodeSessionResponse {
  id: string;
  interviewId: string;
  language: string;
  code: string;
  status: "ACTIVE" | "ENDED";
  startedAt: string;
  endedAt?: string;
}

export interface CodeSnapshotRequest {
  code: string;
  language: string;
}

// ─── Meeting Types ──────────────────────────────────────────────────────────

export interface MeetingResponse {
  id: string;
  interviewId: string;
  provider: string;
  meetingUrl: string;
  hostUrl?: string;
  password?: string;
  createdAt: string;
}
