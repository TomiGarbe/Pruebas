﻿describe('Modulo de Mantenimientos Preventivos - Integracion', () => {
  const adminEntity = {
    type: 'usuario',
    data: {
      id: 1,
      uid: 'test-uid',
      nombre: 'Test User',
      email: 'test@example.com',
      rol: 'Administrador',
    },
  };

  const setSession = (win) => {
    const token = 'e2e-token';
    win.localStorage.setItem('authToken', token);
    win.sessionStorage.setItem('authToken', token);
    win.localStorage.setItem('currentEntity', JSON.stringify(adminEntity));
    win.sessionStorage.setItem('currentEntity', JSON.stringify(adminEntity));
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.window().then(() => {});
  });

  it('carga la pagina y crea, edita y elimina un mantenimiento preventivo', () => {
    const baseFrecuencia = 'Mensual';
    const updatedFrecuencia = 'Trimestral';

    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Preventivos/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item-add', 'Agregar nuevo preventivo...', { timeout: 30000 }).click();
    cy.get('[name="id_sucursal"]', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('[name="frecuencia"]', { timeout: 30000 }).select(baseFrecuencia);
    cy.get('.custom-add-button', { timeout: 30000 }).should('be.enabled').click();
    cy.get('#id_cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2025-01-01');

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', 'Sucursal E2E - Mensual', { timeout: 30000 }).should('be.visible');
    cy.contains('td', 'Cuadrilla E2E', { timeout: 30000 }).should('be.visible');
    cy.contains('tr', 'Sucursal E2E - Mensual', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Editar"]').click();
    });

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');
    
    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal E2E - Mensual', { timeout: 30000 }).within(() => {
      cy.get('.custom-edit-button').click();
    });
    cy.get('[name="id_sucursal"]', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('[name="frecuencia"]', { timeout: 30000 }).select(updatedFrecuencia);
    cy.get('.custom-add-button', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();

    cy.contains('td', 'Sucursal E2E - Trimestral', { timeout: 30000 }).should('be.visible');

    cy.contains('tr', 'Sucursal E2E - Trimestral', { timeout: 30000 }).within(() => {
      cy.get('button[aria-label="Eliminar"]').click();
    });
    cy.wait(5000);
    cy.contains('td', 'Sucursal E2E - Trimestral', { timeout: 30000 }).should('not.exist');

    cy.contains('button', 'Agregar', { timeout: 30000 }).should('be.visible').click();

    cy.get('div.modal.show', { timeout: 30000 }).should('be.visible');

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal E2E - Trimestral', { timeout: 30000 }).within(() => {
      cy.get('.custom-delete-button').click();
    });

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item', 'Sucursal E2E - Trimestral', { timeout: 30000 }).should('not.exist');

    cy.get('#dropdown-preventivo').click();
    cy.contains('.custom-dropdown-item-add', 'Agregar nuevo preventivo...', { timeout: 30000 }).click();
    cy.get('[name="id_sucursal"]', { timeout: 30000 }).select('Sucursal E2E');
    cy.get('[name="frecuencia"]', { timeout: 30000 }).select(baseFrecuencia);
    cy.get('.custom-add-button', { timeout: 30000 }).should('be.enabled').click();
    cy.get('#id_cuadrilla', { timeout: 30000 }).select('Cuadrilla E2E');
    cy.get('#fecha_apertura').clear().type('2025-01-01');

    cy.contains('button', 'Guardar', { timeout: 30000 }).should('be.enabled').click();
    cy.wait(5000);
  });

  it('aplica filtros sobre los mantenimientos preventivos', () => {
    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Preventivos/i, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Filtros').should('be.visible').click();

    cy.get('select[name="cuadrilla"]').select('Cuadrilla E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="cuadrilla"]').select('');

    cy.get('select[name="sucursal"]').select('Sucursal E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="sucursal"]').select('');

    cy.get('select[name="zona"]').select('Zona E2E');
    cy.get('table tbody tr').should('have.length', 1);
    cy.get('select[name="zona"]').select('');
  });

  it('permite ocultar columnas mediante el selector', () => {
    cy.visit('/mantenimientos-preventivos', {
      onBeforeLoad: (win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
        setSession(win);
      },
    });

    cy.contains(/Mantenimientos Preventivos/i, { timeout: 30000 }).should('be.visible');
    cy.get('table thead th').should('contain', 'ID');

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').should('be.checked').uncheck({ force: true });
    cy.contains('button', 'Guardar').click();

    cy.get('table thead th').should(($ths) => {
      const texts = Array.from($ths, (th) => th.innerText.trim());
      expect(texts).to.not.include('ID');
    });

    cy.get('button[aria-label="Seleccionar columnas"]').click();

    cy.get('.column-selector-modal').should('be.visible');
    cy.get('input#col-id').check();
    cy.contains('button', 'Guardar').click();
  });
});
