describe('Smoke Test', () => {
    it('Visits the Kitchen Sink example', () => {
      cy.visit('https://example.cypress.io')
      cy.contains('Kitchen Sink').should('be.visible')
    })
  })
  