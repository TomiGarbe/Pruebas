import { render, screen } from '@testing-library/react';
import AppNavbar from '../components/Navbar';
import { BrowserRouter } from 'react-router-dom';

describe('Navbar component', () => {
  test('renderiza el nombre de la app', () => {
    render(
      <BrowserRouter>
        <AppNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Inversur App')).toBeInTheDocument();
  });

  test('renderiza los links de navegación', () => {
    render(
      <BrowserRouter>
        <AppNavbar />
      </BrowserRouter>
    );

    const links = [
      'Home',
      'Usuarios',
      'Sucursales',
      'Cuadrillas',
      'Preventivos',
      'Mantenimientos Preventivos',
      'Mantenimientos Correctivos'
    ];

    links.forEach((linkText) => {
      expect(screen.getByText(linkText)).toBeInTheDocument();
    });
  });
});
