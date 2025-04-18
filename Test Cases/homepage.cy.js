/*
Tests for homepage.html
Tests for existence and functioning of course search, uploads, and my notes buttons
ADD TESTS FOR JS CODE ONCE PEOPLE FIX THEIR FUCKING CODE
 */
describe('Homepage', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8080/homepage.html');
    });
    it('should have functioning course search button', () => {
        cy.get('#courseSearch').should('be.visible');
        cy.get('#courseSearch').click();
        cy.url().should('include', '/coursesearch.html');
    });

    it('should have functioning upload button', () => {
        cy.get('#upload').should('be.visible');
        cy.get('#upload').click();
        cy.url().should('include', '/upload.html');
    });

    it('should have functioning My Notes button', () => {
        cy.get('#myNotes').should('be.visible');
        cy.get('#myNotes').click();
        cy.url().should('include', '/myUploadedNotes.html');
    });
});