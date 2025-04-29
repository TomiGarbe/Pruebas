describe('Gestión de Sucursales', () => {
    beforeEach(() => {
      cy.visit('/sucursales'); // o /sucursales si usás rutas
    });
  
    it('debería abrir el modal al hacer clic en "Crear Sucursal"', () => {
      cy.contains('button', 'Crear Sucursal').click();
    });
  });
  