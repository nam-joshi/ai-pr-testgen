describe('CSUF Homepage Smoke Test', () => {
  it('Visits CSUF homepage', () => {
    cy.visit('https://www.fullerton.edu/');
    cy.title().should('include', 'Fullerton');
  });
  it("checks that the search bar is visible on homepage", () => {
    cy.visit("https://www.fullerton.edu");
    cy.get("input[type='search'], #search, .search").should("exist");
  });
  it("should load the homepage", () => {
    cy.visit("https://csuf.edu");
    cy.contains("California State University").should("be.visible");
  });
});
