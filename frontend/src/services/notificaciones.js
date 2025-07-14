import api from './api';

export const saveToken = (token_data) => api.post('/fcm-token/', token_data);