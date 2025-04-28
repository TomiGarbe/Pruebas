import api from './api';

export const getPreventivos = async () => {
  const response = await api.get('/api/preventivos/');
  return response.data;
};

export const getPreventivo = async (id) => {
  const response = await api.get(`/api/preventivos/${id}`);
  return response.data;
};

export const createPreventivo = async (preventivo) => {
  const response = await api.post('/api/preventivos/', preventivo);
  return response.data;
};

export const updatePreventivo = async (id, preventivo) => {
  const response = await api.put(`/api/preventivos/${id}`, preventivo);
  return response.data;
};

export const deletePreventivo = async (id) => {
  const response = await api.delete(`/api/preventivos/${id}`);
  return response.data;
};