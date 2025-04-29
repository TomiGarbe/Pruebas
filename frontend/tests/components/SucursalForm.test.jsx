import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SucursalForm from '../../src/components/SucursalForm';
import * as sucursalService from '../../src/services/sucursalService';
import * as zonaService from '../../src/services/zonaService';

jest.mock('../../src/services/sucursalService');
jest.mock('../../src/services/zonaService');
jest.mock('../../src/services/api'); 

describe('SucursalForm', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    zonaService.getZonas.mockResolvedValue({ data: [] });
  });

  it('debería renderizar el formulario de creación', async () => {
    render(<SucursalForm sucursal={null} onClose={onCloseMock} />);

    expect(await screen.findByText('Crear Sucursal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Zona/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dirección/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Superficie/i)).toBeInTheDocument();
  });

  it('debería permitir completar y enviar el formulario para crear', async () => {
    sucursalService.createSucursal.mockResolvedValue({});

    render(<SucursalForm sucursal={null} onClose={onCloseMock} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Test' } });
    fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Calle Falsa 123' } });
    fireEvent.change(screen.getByLabelText(/Superficie/i), { target: { value: '100' } });

    // Como la zona es solo lectura, no lo seteamos manualmente acá en el input (dependería del dropdown).

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    await waitFor(() => {
      expect(sucursalService.createSucursal).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('debería mostrar error si falla la creación', async () => {
    sucursalService.createSucursal.mockRejectedValue(new Error('Error interno'));

    render(<SucursalForm sucursal={null} onClose={onCloseMock} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Sucursal Test' } });
    fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Calle Falsa 123' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    expect(await screen.findByText(/Error al guardar la sucursal/i)).toBeInTheDocument();
  });

  it('debería renderizar el formulario de edición', async () => {
    const sucursal = { id: 1, nombre: 'Sucursal Existente', zona: 'Norte', direccion: 'Calle 1', superficie: '50' };

    render(<SucursalForm sucursal={sucursal} onClose={onCloseMock} />);

    expect(await screen.findByDisplayValue('Sucursal Existente')).toBeInTheDocument();
    expect(screen.getByText('Editar Sucursal')).toBeInTheDocument();
  });
});
