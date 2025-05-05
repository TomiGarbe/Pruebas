describe('Gestión de Sucursales', () => {
  beforeEach(() => {
    cy.visit('/sucursales');
  });

  it('Carga correctamente una zona', () => {
    cy.contains('button', 'Crear Sucursal').click();
    cy.wait(1000);
    cy.get('#zona').click();
    cy.wait(1000);
    cy.get('.dropdown-item').click();
    cy.wait(1000);
    cy.get('.mt-2 > #zona').type('Zona 1');
    cy.get('.mt-2 > .btn').click();
    cy.wait(4000);
    cy.get('.btn-close').click();
    cy.wait(1000);
  });

  it('Carga correctamente una sucursal', () => {
    cy.contains('button', 'Crear Sucursal').click();
    cy.get('#nombre').type('Sucursal 1');
    cy.wait(1000);
    cy.get('#zona').click();
    cy.wait(4000);
    cy.get('.custom-option').contains('Zona 1').click();
    cy.wait(1000);
    cy.get('#direccion').type('Dirección 1');
    cy.get('#superficie').type('100');
    cy.wait(1000);
    cy.get('form > .btn-primary').click();
    cy.wait(4000);
    cy.get('tr:last-child > :nth-child(2)').should('have.text', 'NombreSucursal 1');
    cy.get('tr:last-child > :nth-child(3)').should('have.text', 'ZonaZona 1');
    cy.get('tr:last-child > :nth-child(4)').should('have.text', 'DirecciónDirección 1');
    cy.get('tr:last-child > :nth-child(5)').should('have.text', 'Superficie100');
    cy.wait(1000);
  });

  it('Edita correctamente una sucursal', () => {
    cy.get('tr:last-child > :nth-child(6) > .btn-warning').click();
    cy.get('#nombre').clear('Sucursal 1');
    cy.get('#nombre').type('Sucursal 2');
    cy.get('#direccion').clear('Dirección 1');
    cy.get('#direccion').type('Dirección 2');
    cy.get('#superficie').clear('100');
    cy.get('#superficie').type('200');
    cy.wait(1000);
    cy.get('form > .btn').click();
    cy.wait(4000);
    cy.get('tr:last-child > :nth-child(2)').should('have.text', 'NombreSucursal 2');
    cy.get('tr:last-child > :nth-child(4)').should('have.text', 'DirecciónDirección 2');
    cy.get('tr:last-child > :nth-child(5)').should('have.text', 'Superficie200');
    cy.wait(1000);
  });

  it('Elimina correctamente una sucursal', () => {
    cy.get('tr:last-child > :nth-child(6) > .btn-danger').click();
    cy.wait(1000);
    cy.get('table').find('tbody tr').should('not.exist');
    cy.wait(1000);
  });

  it('Elimina correctamente una zona', () => {
    cy.contains('button', 'Crear Sucursal').click();
    cy.wait(1000);
    cy.get('#zona').click();
    cy.wait(4000);
    cy.get('.custom-option').contains('Zona 1').click();
    cy.wait(4000);
    cy.get('.btn-close').click();
  });
});
  