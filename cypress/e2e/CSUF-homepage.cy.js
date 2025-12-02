describe('CSUF Homepage Smoke Test', () => {
  it('Visits CSUF homepage', () => {
    cy.visit('https://www.fullerton.edu/');
    cy.title().should('include', 'Fullerton');
  });
});
