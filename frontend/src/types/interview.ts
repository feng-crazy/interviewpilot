export interface InterviewCreateRequest {
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  process_requirement: string;
  constraint_info: string;
}

export interface InterviewResponse {
  interview_id: string;
  interviewer_url: string;
  candidate_url: string;
}

export interface InterviewConfig {
  id: string;
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  process_requirement: string;
  max_questions: number;
  max_duration: number;
  status: string;
  ai_managed: boolean;
  candidate_url: string;
  created_at: string;
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