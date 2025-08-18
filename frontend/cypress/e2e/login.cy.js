describe('Autenticación', () => {
  it('redirecciona al login si no está autenticado', () => {
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('inicia el flujo de Google al hacer click en el botón de login', () => {
    cy.visit('/login');
    cy.contains('button', 'Iniciar Sesión con Google')
      .should('be.visible')
      .click();

    // verifica que el SDK de Google se haya agregado al DOM
    cy.get('script[src="https://accounts.google.com/gsi/client"]').should('exist');
  });
});