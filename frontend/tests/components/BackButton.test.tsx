import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import BackButton from '../../src/components/BackButton';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('BackButton component', () => {
  test('navigates to provided path when "to" prop is set', () => {
    render(
      <MemoryRouter>
        <BackButton to="/home" label="Volver" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /volver/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  test('navigates back when no "to" prop is provided', () => {
    render(
      <MemoryRouter>
        <BackButton label="Regresar" />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /regresar/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});

