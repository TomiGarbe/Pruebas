import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import AppNavbar from '../../src/components/Navbar';
import { BrowserRouter } from 'react-router-dom';

describe('Navbar component', () => {
  beforeEach(() => {
    // Mock localStorage
    window.localStorage = {
      getItem: vi.fn(() => JSON.stringify({ nombre: 'Usuario' })),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renderiza los links de navegación', () => {
    render(
      <BrowserRouter>
        <AppNavbar />
      </BrowserRouter>
    );

    const links = [
      'Usuarios',
      'Sucursales',
      'Cuadrillas',
      'Preventivos',
      'Mantenimientos Preventivos',
      'Mantenimientos Correctivos',
      'Mapa',
      'Reportes',
    ];

    links.forEach((linkText) => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });
});