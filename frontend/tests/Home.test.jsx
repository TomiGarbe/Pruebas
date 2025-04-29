import { render, screen } from '@testing-library/react';
import Home from '../src/pages/Home';

describe('Home', () => {
  it('debería renderizar el título y el párrafo correctamente', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /Bienvenido a Inversur App/i })).toBeInTheDocument();
    expect(screen.getByText(/Esta es la página principal/i)).toBeInTheDocument();
  });
});
