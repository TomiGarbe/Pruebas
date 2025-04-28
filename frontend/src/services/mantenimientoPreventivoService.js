import api from './api';

export const getMantenimientosPreventivos = async () => {
  const response = await api.get('/api/mantenimientos-preventivos/');
  return response.data;
};

export const getMantenimientoPreventivo = async (id) => {
  const response = await api.get(`/api/mantenimientos-preventivos/${id}`);
  return response.data;
};

export const createMantenimientoPreventivo = async (mantenimiento) => {
  const response = await api.post('/api/mantenimientos-preventivos/', mantenimiento);
  return response.data;
};

export const updateMantenimientoPreventivo = async (id, mantenimiento) => {
  const response = await api.put(`/api/mantenimientos-preventivos/${id}`, mantenimiento);
  return response.data;
};

export const deleteMantenimientoPreventivo = async (id) => {
  const response = await api.delete(`/api/mantenimientos-preventivos/${id}`);
  return response.data;
};