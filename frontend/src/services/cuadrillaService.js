import api from './api';

export const getCuadrillas = async () => {
  const response = await api.get('/api/cuadrillas/');
  return response.data;
};

export const getCuadrilla = async (id) => {
  const response = await api.get(`/api/cuadrillas/${id}`);
  return response.data;
};

export const createCuadrilla = async (cuadrilla) => {
  const response = await api.post('/api/cuadrillas/', cuadrilla);
  return response.data;
};

export const updateCuadrilla = async (id, cuadrilla) => {
  const response = await api.put(`/api/cuadrillas/${id}`, cuadrilla);
  return response.data;
};

export const deleteCuadrilla = async (id) => {
  const response = await api.delete(`/api/cuadrillas/${id}`);
  return response.data;
};