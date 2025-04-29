import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sucursales from '../../src/pages/Sucursales';
import * as sucursalService from '../../src/services/sucursalService';
import * as zonaService from '../../src/services/zonaService';

jest.mock('../../src/services/sucursalService');
jest.mock('../../src/services/zonaService');
jest.mock('../../src/services/api'); 

describe('Sucursales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    zonaService.getZonas.mockResolvedValue({ data: [] });
  });

  it('debería renderizar la tabla de sucursales', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [
        { id: 1, nombre: 'Sucursal 1', zona: 'Norte', direccion: 'Av 1', superficie: '100' },
      ],
    });

    render(<Sucursales />);

    expect(await screen.findByText('Sucursal 1')).toBeInTheDocument();
    expect(screen.getByText('Norte')).toBeInTheDocument();
  });

  it('debería abrir el formulario de creación', async () => {
    sucursalService.getSucursales.mockResolvedValue({ data: [] });

    render(<Sucursales />);

    const crearButton = screen.getByRole('button', { name: 'Crear Sucursal' });
    fireEvent.click(crearButton);

    const elements = await screen.findAllByText('Crear Sucursal');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('debería eliminar una sucursal', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [{ id: 1, nombre: 'Sucursal 1', zona: 'Norte', direccion: 'Av 1', superficie: '100' }],
    });
    sucursalService.deleteSucursal.mockResolvedValue({});

    render(<Sucursales />);

    const eliminarButton = await screen.findByRole('button', { name: /Eliminar/i });
    fireEvent.click(eliminarButton);

    await waitFor(() => {
      expect(sucursalService.deleteSucursal).toHaveBeenCalledWith(1);
    });
  });

  it('debería editar una sucursal', async () => {
    sucursalService.getSucursales.mockResolvedValue({
      data: [{ id: 1, nombre: 'Sucursal Edit', zona: 'Sur', direccion: 'Av 2', superficie: '200' }],
    });

    render(<Sucursales />);

    const editarButton = await screen.findByRole('button', { name: /Editar/i });
    fireEvent.click(editarButton);

    expect(await screen.findByDisplayValue('Sucursal Edit')).toBeInTheDocument();
  });
});
