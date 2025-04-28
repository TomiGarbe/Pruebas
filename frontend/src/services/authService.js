const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const loginUser = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, contrasena: password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al iniciar sesión');
    }

    const data = await response.json();
    return data; // Devuelve { access_token, token_type, user }
  } catch (error) {
    throw new Error(error.message);
  }
};