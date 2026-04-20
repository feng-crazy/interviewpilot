import axios from 'axios';
import type { InterviewCreateRequest, JobPositionCreateRequest, JobPositionUpdateRequest } from '../types/interview';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createInterview = async (data: InterviewCreateRequest) => {
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

export const optimizeContent = async (
  fieldType: string,
  fieldContent: string,
  context: Record<string, string>
) => {
  const response = await api.post('/optimize', {
    field_type: fieldType,
    field_content: fieldContent,
    context,
  });
  return response.data;
};

export const createJobPosition = async (data: JobPositionCreateRequest) => {
  const response = await api.post('/job-position/create', data);
  return response.data;
};

export const getJobPositionList = async (limit = 50, offset = 0) => {
  const response = await api.get('/job-position/list', { params: { limit, offset } });
  return response.data;
};

export const getJobPosition = async (id: string) => {
  const response = await api.get(`/job-position/${id}`);
  return response.data;
};

export const updateJobPosition = async (id: string, data: JobPositionUpdateRequest) => {
  const response = await api.put(`/job-position/${id}`, data);
  return response.data;
};

export const deleteJobPosition = async (id: string) => {
  const response = await api.delete(`/job-position/${id}`);
  return response.data;
};

export const parseResume = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteInterview = async (id: string) => {
  const response = await api.delete(`/interview/${id}`);
  return response.data;
};