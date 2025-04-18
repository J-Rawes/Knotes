/*
Test for login.js and login.html
Tests that password and username fields exist and function
Tests that all fields are required
Tests that valid inputs work
Tests that invalid username or password shows error
Tests that long or invalid passwords are rejected
 */
describe('Login Page', () => {
    beforeEach(() => {
        cy.visit('https://knotes-3spt.onrender.com/login.html');
    });

    it('should verify username field', () => {
        // Check that the username field exists
        cy.get('#username').should('exist');

        // Type in the username and verify the value
        cy.get('#username').type('TestUser123');
        cy.get('#username').should('have.value', 'TestUser123');
    });

    it('should verify password field', () => {
        // Check that the password field exists
        cy.get('#password').should('exist');

        // Type in the password and verify the value
        cy.get('#password').type('ValidPass123');
        cy.get('#password').should('have.value', 'ValidPass123');
    });

    it('should make all fields required', () => {
        cy.get('#username').should('have.attr', 'required');
        cy.get('#password').should('have.attr', 'required');
    });

    it('submits valid input and handles success', () => {
        cy.get('#username').type('TestUser123');
        cy.get('#password').type('ValidPass1');

        cy.intercept('POST', '/login', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, token: "arbitrary", message: "Login successful", }),
        }).as('login');

        cy.get('#submit').click();
        cy.wait('@login');
        cy.url().should('include', 'homepage.html');
    });

    it('shows error if username does not exist', () => {
        cy.get('#username').type('NotExistingUser');
        cy.get('#password').type('PassWord123');

        cy.intercept('POST', '/login', {
            statusCode: 409,
            body: (JSON.stringify({ exists: false, message: "Incorrect password"})),
        }).as('login');

        cy.get('#submit').click();
        cy.wait('@login');
        cy.get('#message').should('contain', 'Incorrect Username or Password');
    });

    it('shows error if password is wrong', () => {
        cy.get('#username').type('ExistingUser');
        cy.get('#password').type('BadPassWord123');

        cy.intercept('POST', '/login', {
            statusCode: 409,
            body: (JSON.stringify({ exists: false, message: "Incorrect password"})),
        }).as('login');

        cy.get('#submit').click();
        cy.wait('@login');
        cy.get('#message').should('contain', 'Incorrect Username or Password');
    });

    it('should restrict password length', () => {
        cy.get('#username').type('ExistingUser');
        cy.get('#password').type('ExtremelyLongPasswordThatShouldNotWork42');
        cy.get('#submit').click();
        cy.get('#message').should('contain','Password cannot exceed 16 characters');
    });

    it('should not allow special characters', () => {
        cy.get('#username').type('ExistingUser');
        cy.get('#password').type('<script>');
        cy.get('#submit').click();
        cy.get('#message').should('contain','Password cannot contain special characters: /\\|<>=&#');
    });

});