import api from './api';

export const getZonas = async () => {
  const response = await api.get('/api/zonas/');
  return response.data;
};

export const getZona = async (id) => {
  const response = await api.get(`/api/zonas/${id}`);
  return response.data;
};

export const createZona = async (zona) => {
  const response = await api.post('/api/zonas/', zona);
  return response.data;
};

export const updateZona = async (id, zona) => {
  const response = await api.put(`/api/zonas/${id}`, zona);
  return response.data;
};

export const deleteZona = async (id) => {
  const response = await api.delete(`/api/zonas/${id}`);
  return response.data;
};