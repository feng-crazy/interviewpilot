export interface InterviewCreateRequest {
  job_position_id: string;
  resume_text?: string;
  max_questions?: number;
  max_duration?: number;
}

export interface InterviewResponse {
  interview_id: string;
  interviewer_url: string;
  candidate_url: string;
}

export interface InterviewConfig {
  id: string;
  job_position_id: string;
  resume_text?: string;
  max_questions: number;
  max_duration: number;
  status: string;
  ai_managed: boolean;
  candidate_url: string;
  created_at: string;
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
}

export interface ChatMessage {
  id: string;
  sequence: number;
  role: 'ai' | 'interviewer' | 'candidate';
  content: string;
  source: 'ai_generated' | 'manual' | 'system';
  input_type?: 'text' | 'voice';
  created_at: string;
}

export interface InterviewReport {
  id: string;
  chat_summary?: string;
  ability_evaluation?: string;
  match_analysis?: string;
  pros_cons?: string;
  hiring_recommendation?: string;
  followup_questions?: string;
  final_decision?: string;
  overall_score?: number;
  created_at: string;
}

export interface InterviewDetail {
  config: InterviewConfig;
  messages: ChatMessage[];
  report?: InterviewReport;
}

export interface InterviewListItem {
  id: string;
  jd_text: string;
  interviewer_info: string;
  status: string;
  created_at: string;
  ended_at?: string;
}

export interface InterviewListResponse {
  items: InterviewListItem[];
  total: number;
}

export interface JobPosition {
  id: string;
  name: string;
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
  default_max_questions: number;
  default_max_duration: number;
  created_at: string;
  updated_at: string;
}

export interface JobPositionCreateRequest {
  name: string;
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  interview_scheme: string;
  default_max_questions?: number;
  default_max_duration?: number;
}

export interface JobPositionUpdateRequest {
  name?: string;
  jd_text?: string;
  company_info?: string;
  interviewer_info?: string;
  interview_scheme?: string;
  default_max_questions?: number;
  default_max_duration?: number;
}

export interface JobPositionListItem {
  id: string;
  name: string;
  jd_text_preview: string;  // First 100 chars
  created_at: string;
}

export interface JobPositionListResponse {
  items: JobPositionListItem[];
  total: number;
}

export interface ResumeParseResponse {
  text: string;
}