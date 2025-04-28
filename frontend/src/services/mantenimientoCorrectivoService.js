import api from './api';

export const getMantenimientosCorrectivos = async () => {
  const response = await api.get('/api/mantenimientos-correctivos/');
  return response.data;
};

export const getMantenimientoCorrectivo = async (id) => {
  const response = await api.get(`/api/mantenimientos-correctivos/${id}`);
  return response.data;
};

export const createMantenimientoCorrectivo = async (mantenimiento) => {
  const response = await api.post('/api/mantenimientos-correctivos/', mantenimiento);
  return response.data;
};

export const updateMantenimientoCorrectivo = async (id, mantenimiento) => {
  const response = await api.put(`/api/mantenimientos-correctivos/${id}`, mantenimiento);
  return response.data;
};

export const deleteMantenimientoCorrectivo = async (id) => {
  const response = await api.delete(`/api/mantenimientos-correctivos/${id}`);
  return response.data;
};