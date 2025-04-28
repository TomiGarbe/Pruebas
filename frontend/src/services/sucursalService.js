import api from './api';

export const getSucursales = async () => {
  const response = await api.get('/api/sucursales/');
  return response.data;
};

export const getSucursal = async (id) => {
  const response = await api.get(`/api/sucursales/${id}`);
  return response.data;
};

export const createSucursal = async (sucursal) => {
  const response = await api.post('/api/sucursales/', sucursal);
  return response.data;
};

export const updateSucursal = async (id, sucursal) => {
  const response = await api.put(`/api/sucursales/${id}`, sucursal);
  return response.data;
};

export const deleteSucursal = async (id) => {
  const response = await api.delete(`/api/sucursales/${id}`);
  return response.data;
};