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
  messages?: ChatMessage[];
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

export interface WebSocketMessage {
  type: 'chat_sync' | 'streaming_sync' | 'streaming_end' | 'control_update' | 'interview_ended' | 'error';
  
  // chat_sync - 完整消息同步 (候选人/面试官消息)
  message?: ChatMessage;
  
  // streaming_sync - AI流式token
  message_id?: string;
  content?: string;
  is_start?: boolean;
  
  // streaming_end - 流式结束
  final_message?: ChatMessage;
  
  // control_update - 控制状态更新
  ai_managed?: boolean;
  
  // error - 错误消息
  error_message?: string;
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
  jd_text: string;
  created_at: string;
}

export interface JobPositionListResponse {
  items: JobPositionListItem[];
  total: number;
}

export interface ResumeParseResponse {
  text: string;
}