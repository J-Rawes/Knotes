describe('Register Page', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8080/upload.html');
    });

    it('should open file directory and allows image uploads', () => {
       cy.get('#imgButton').click();
       cy.get('input[type="file"]#fileUpload').attachFile('banner2.png');
       cy.get('#sourceImage')
            .should('have.attr', 'src')
            .and('include', 'data:image/png;base64');
    });

    it('should not allow invalid filetypes', () => {
        cy.get('#imgButton').click();
        cy.get('input[type="file"]#fileUpload').attachFile('invalidFileTest.txt');
        cy.get('#sourceImage').should('have.value', "");
    })

    it('back button should work', () => {
        cy.get('#backButton').click();
        cy.url().should('contain', '/homepage.html')
    });

    it('should bring up text box when text is selected', () => {
        cy.get('#imgButton').click();
        cy.get('input[type="file"]#fileUpload').attachFile('banner2.png');
        cy.get('#txtSelect').click({force: true});
        cy.get('#confirmButton').click();
        cy.get('#textModal').should('be.visible');
    });

    it('should bring up final upload page when upload clicked',  () => {
        cy.get('#imgButton').click();
        cy.get('input[type="file"]#fileUpload').attachFile('banner2.png');
        cy.get('#imgSelect').click({force: true});
        cy.get('#confirmButton').click();
        cy.get('#subN').click();
        cy.get('#uModal-c').should('be.visible');
        cy.get('#course').should('be.visible');
        cy.get('#title').should('be.visible');
    });

    it('should enforce course and title rules',  () => {
        cy.get('#imgButton').click();
        cy.get('input[type="file"]#fileUpload').attachFile('banner2.png');
        cy.get('#imgSelect').click({force: true});
        cy.get('#confirmButton').click();
        cy.get('#subN').click();
        cy.get('#title').type('placeholder');
        cy.get('#course').type('#<*&^%');
        cy.get('#uModal-c > #saveText').click({force: true});
        cy.get('#course').clear().type('placeholder');
        cy.get('#title').clear().type('<*^%^');
        cy.get('#uModal-c > #saveText').click();
        cy.get('#message').should('have.text', 'Note title cannot contain special characters: /\\|<>=&#');
    });

    it('should confirm successful uploads', () => {
        cy.get('#imgButton').click();
        cy.get('input[type="file"]#fileUpload').attachFile('banner2.png');
        cy.get('#imgSelect').click({force: true});
        cy.get('#confirmButton').click();
        cy.get('#subN').click();
        cy.get('#title').type('placeholder');
        cy.get('#course').type('placeholder');
        cy.intercept('POST', '/uploadNote', {
            statusCode: 200,
            body: JSON.stringify({message: 'Note uploaded successfully'}),
        }).as('uploadNote');
        cy.get('#uModal-c > #saveText').click();
        cy.wait('@uploadNote');
        cy.url().should('contain', '/');
    });
});