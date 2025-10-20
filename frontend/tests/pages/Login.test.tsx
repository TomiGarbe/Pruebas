import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../../src/pages/Login';
import { AuthContext } from '../../src/context/AuthContext';

describe('Página de Login', () => {
    
  const mockSignInWithGoogle = vi.fn();
  const mockLogOut = vi.fn();
  
  const defaultAuthContextValue = {
    verifying: false,
    logOut: mockLogOut,
    signInWithGoogle: mockSignInWithGoogle,
  };

  const renderWithContextAndRouter = (authValue, routeState = {}) => {
    const initialEntries = [{ pathname: '/login', state: routeState }];
    return render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Debería renderizar la página de login en su estado inicial', () => {
    renderWithContextAndRouter(defaultAuthContextValue);

    expect(screen.getByAltText('Inversur Logo')).toBeInTheDocument();
    const loginButton = screen.getByRole('button', { name: /Iniciar Sesión con Google/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).not.toBeDisabled();
    
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('Debería mostrar un spinner de carga cuando "verifying" es true', () => {
    renderWithContextAndRouter({ ...defaultAuthContextValue, verifying: true });

    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Verificamos que el contenido principal (el botón de login) no esté.
    expect(screen.queryByRole('button', { name: /Iniciar Sesión con Google/i })).toBeNull();
  });

  it('Debería llamar a signInWithGoogle al hacer clic en el botón', async () => {
    mockSignInWithGoogle.mockResolvedValueOnce();
    renderWithContextAndRouter(defaultAuthContextValue);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión con Google/i }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
    });
    
    expect(mockLogOut).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('Debería mostrar un error y llamar a logOut si signInWithGoogle falla', async () => {
    const errorMessage = 'Error de autenticación';
    mockSignInWithGoogle.mockRejectedValueOnce(new Error(errorMessage));
    renderWithContextAndRouter(defaultAuthContextValue);

    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión con Google/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(errorMessage);
    
    expect(mockLogOut).toHaveBeenCalledTimes(1);
  });

  it('Debería mostrar un error si se pasa a través del estado de la ruta', () => {
    const routeError = 'Acceso denegado, por favor inicie sesión.';
    renderWithContextAndRouter(defaultAuthContextValue, { error: routeError });

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(routeError);
  });
});