describe('Smoke Test', () => {

  it('Visits the Kitchen Sink example', () => {
      cy.visit('https://example.cypress.io')
      cy.contains('Kitchen Sink').should('be.visible')
  })

  it('Checks page title', () => {
    cy.visit('https://example.cypress.io/')
    cy.title().should('include', 'Kitchen Sink')
  })

})
