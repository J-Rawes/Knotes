describe('Course Display Page', () => {
    beforeEach(() => {
        cy.visit('https://knotes-3spt.onrender.com/login.html');
        cy.get('#username').type('validUser');
        cy.get('#password').type('Password123');
        cy.get('#submit').click();
        cy.get('.links-container > #courseSearch').click();
        cy.get('#button-container > :nth-child(1)').click();
    });

    it('search function should work', () => {
        cy.get('#search').type('notey', {delay: 100});
        cy.get('#button-container > :nth-child(1) > h1').should('contain', 'notey');
    });

    it('should be able to sort notes', () => {
        cy.wait(2000);
        cy.get('#sort-button').click();
        cy.get('#button-container > :nth-child(1) > h1').should('contain', 'Indexing Strategies');
        cy.get('#sort-options').select('Liked Notes');
        cy.get('#sort-button').click();
        cy.get('#button-container > :nth-child(1) > h1').should('contain', 'Test Note');
    });

    it('should be able to save courses', () => {
        cy.get('#save').click();
        cy.get('#save').should('contain', 'Saved');
    });

    it('should be able to select and view a note', () => {
        cy.get('#button-container > :nth-child(6) > h1').click();
        cy.get('#imgCanvas').should('be.visible');
        cy.get('#txtCanvas').should('exist');
        cy.get('#downloadBtn').should('be.visible');
        cy.get('#like-button').should('be.visible');
    });

});