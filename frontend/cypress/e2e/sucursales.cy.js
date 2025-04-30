describe('Gestión de Sucursales', () => {
  beforeEach(() => {
    cy.visit('/sucursales');
  });

  it('Carga, edita y elimina correctamente una sucursal', () => {
    cy.contains('button', 'Crear Sucursal').click();
    cy.get('#nombre').type('Sucursal 1');
    cy.get('#zona').click();
    cy.get('.dropdown-item').click();
    cy.get('.mt-2 > #zona').type('Zona 1');
    cy.get('.mt-2 > .btn').click();
    cy.get('#direccion').type('Dirección 1');
    cy.get('#superficie').type('100');
    cy.get('form > .btn-primary').click();
    cy.get('tr:last-child > :nth-child(2)').should('have.text', 'NombreSucursal 1');
    cy.get('tr:last-child > :nth-child(3)').should('have.text', 'ZonaZona 1');
    cy.get('tr:last-child > :nth-child(4)').should('have.text', 'DirecciónDirección 1');
    cy.get('tr:last-child > :nth-child(5)').should('have.text', 'Superficie100');
    cy.get('tr:last-child > :nth-child(6) > .btn-warning').click();
    cy.get('#nombre').clear('Sucursal 1');
    cy.get('#nombre').type('Sucursal 2');
    cy.get('#direccion').clear('Dirección 1');
    cy.get('#direccion').type('Dirección 2');
    cy.get('#superficie').clear('100');
    cy.get('#superficie').type('200');
    cy.get('form > .btn').click();
    cy.get('tr:last-child > :nth-child(2)').should('have.text', 'NombreSucursal 2');
    cy.get('tr:last-child > :nth-child(4)').should('have.text', 'DirecciónDirección 2');
    cy.get('tr:last-child > :nth-child(5)').should('have.text', 'Superficie200');
    cy.get('tr:last-child > :nth-child(6) > .btn-danger').click();
    cy.contains('button', 'Crear Sucursal').click();
    cy.get('#zona').click();
    cy.get('.custom-option > .btn').click();
    cy.get('.btn-close').click();
  });
});
  