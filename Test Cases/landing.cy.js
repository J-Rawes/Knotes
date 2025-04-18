/*This test is for landingpage.html and landingpage.js
Tests for existence of login link
Tests that login link works
Tests canvas resizing to different screen sizes
 */
describe('Landing Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8080');
  });

  it('should have login link', () => {
    cy.get('a').eq(0).should('have.attr', 'href', 'login.html');
  });

  it('should navigate to login page on click', () => {
    cy.get('a').contains('Login').click();
    cy.url().should('include', 'login.html');
  });

  it('should resize the canvas on window resize', () => {
    cy.get('canvas').then(($canvas) => {
      const initialWidth = $canvas[0].width;
      const initialHeight = $canvas[0].height;

      cy.viewport(800, 600); // Simulate smaller screen

      cy.get('canvas').should(($updatedCanvas) => {
        expect($updatedCanvas[0].width).to.not.equal(initialWidth);
        expect($updatedCanvas[0].height).to.not.equal(initialHeight);
      });
    });
  });

});
