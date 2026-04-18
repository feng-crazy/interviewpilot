import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createInterview = async (data: {
  jd_text: string;
  company_info: string;
  interviewer_info: string;
  process_requirement: string;
  constraint_info: string;
}) => {
  const response = await api.post('/interview/create', data);
  return response.data;
};

export const getInterviewConfig = async (id: string) => {
  const response = await api.get(`/interview/${id}`);
  return response.data;
};

export const getInterviewHistory = async (limit = 50, offset = 0) => {
  const response = await api.get(`/interview/history`, { params: { limit, offset } });
  return response.data;
};

export const getInterviewDetail = async (id: string) => {
  const response = await api.get(`/interview/${id}/detail`);
  return response.data;
};

export const toggleAiManaged = async (id: string, aiManaged: boolean) => {
  const response = await api.post(`/control/toggle/${id}`, { ai_managed: aiManaged });
  return response.data;
};

export const endInterview = async (id: string) => {
  const response = await api.post(`/control/end/${id}`);
  return response.data;
};

export const generateReport = async (id: string) => {
  const response = await api.post(`/report/generate/${id}`);
  return response.data;
};

export const getReport = async (id: string) => {
  const response = await api.get(`/report/${id}`);
  return response.data;
};