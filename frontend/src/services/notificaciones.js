import api from './api';

export const saveToken = (token_data) => api.post('/fcm-token/', token_data);
export const get_notificaciones_correctivos = (firebase_uid) => api.get(`/notificaciones/correctivos/${firebase_uid}`);
export const get_notificaciones_preventivos = (firebase_uid) => api.get(`/notificaciones/preventivos/${firebase_uid}`);
export const correctivo_leido = (id_notificacion) => api.put(`/notificaciones/correctivos/${id_notificacion}`);
export const preventivo_leido = (id_notificacion) => api.put(`/notificaciones/preventivos/${id_notificacion}`);
export const delete_notificaciones = (firebase_uid) => api.delete(`/notificaciones/${firebase_uid}`);