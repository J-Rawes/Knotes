/*
Tests for forgotPassword.html and .js
Verifies existence and function of username field
Tests that blank entries are rejected
Tests that username exists
Tests for error responses
Tests for valid username
Tests security answer field
Tests response to valid and invalid security answers
Tests new password requirements
Tests successful reset of password
 */
describe('Forgot Password Page', () => {
    beforeEach(() => {
        cy.visit('http://localhost:8080/forgotPassword.html');
    });

    it('should verify username field', () => {
        cy.get('#username').should('exist');
        cy.get('#username').should('have.attr', 'required');
        cy.get('#username').type('TestUser123');
        cy.get('#username').should('have.value', 'TestUser123');
    });

    it('should not allow blank entries',() => {
        cy.get('#checkUsernameButton').click();
        cy.get('#message').should('have.text', 'Please enter your username.');
    });

    it('should verify that the username exists', () => {
        cy.get('#username').type('non-existent username');
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: false }),//simulate non-existent user
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');
        cy.get('#message').should('have.text', 'Username not found.');
    });

    it('should show a message when errors occur', () => {
        cy.get('#username').type('TestUser123');
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 500,
            body: 'This should cause an error',//simulate a server error
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');
        cy.get('#message').should('have.text', 'An error occurred. Please try again.');
    });

    it('should display security question when username is valid', () => {
        cy.get('#username').type('validUser123');

        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityQuestionForm').should('be.visible');
        cy.get('#securityQuestionLabel').should('have.text', 'what colour is your tip?');
    });

    it('should verify security answer field',() => {
        cy.get('#username').type('validUser123');

        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').should('be.visible');
        cy.get('#checkSecurityAnswerButton').click();
        cy.get('#message').should('have.text', 'Please enter your security answer.');
    });

    it('should not allow false answers',() => {
        cy.get('#username').type('validUser123');
        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').type('chartreuse');
        //simulate an incorrect answer response
        cy.intercept('POST', '/verifySecurityAnswer', {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Incorrect security answer' })
        }).as('verifySecurityAnswer');

        cy.get('#checkSecurityAnswerButton').click();
        cy.wait('@verifySecurityAnswer');
        cy.get('#message').should('have.text', 'Incorrect security answer.');
    });

    it('should allow correct answers',() => {
        cy.get('#username').type('validUser123');
        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').type('pink');
        //simulate a correct answer response
        cy.intercept('POST', '/verifySecurityAnswer', {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Security answer verified'  })
        }).as('verifySecurityAnswer');

        cy.get('#checkSecurityAnswerButton').click();
        cy.wait('@verifySecurityAnswer');
        cy.get('#newPassword').should('be.visible');
        cy.get('#confirmPassword').should('be.visible');
    });

    it('should enforce password requirements', () => {
        cy.get('#username').type('validUser123');
        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').type('pink');
        //simulate a correct answer response
        cy.intercept('POST', '/verifySecurityAnswer', {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Security answer verified'  })
        }).as('verifySecurityAnswer');

        cy.get('#checkSecurityAnswerButton').click();
        cy.wait('@verifySecurityAnswer');

        cy.get('#confirmPassword').type('short');
        cy.get('#newPassword').type('short');
        cy.get('#resetPasswordButton').click();
        cy.get('#message').should('contain','Password must be at least 8 characters long and include at least one capital letter and one number.');
    });

    it('should show error if passwords do not match', () => {
        cy.get('#username').type('validUser123');
        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({ exists: true, securityQuestion: 'what colour is your tip?' })
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').type('pink');
        //simulate a correct answer response
        cy.intercept('POST', '/verifySecurityAnswer', {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Security answer verified'  })
        }).as('verifySecurityAnswer');

        cy.get('#checkSecurityAnswerButton').click();
        cy.wait('@verifySecurityAnswer');

        cy.get('#newPassword').type('Password123');
        cy.get('#confirmPassword').type('Password124');

        cy.get('#resetPasswordButton').click();
        cy.get('#message').should('contain', 'Passwords do not match.');
    });

    it('should accept valid passwords and redirect to login page', () => {
        cy.get('#username').type('validUser123');
        //simulate a valid server response
        cy.intercept('POST', '/verifyUsername', {
            statusCode: 200,
            body: JSON.stringify({exists: true, securityQuestion: 'what colour is your tip?'})
        }).as('verifyUsername');

        cy.get('#checkUsernameButton').click();
        cy.wait('@verifyUsername');

        cy.get('#securityAnswer').type('pink');
        //simulate a correct answer response
        cy.intercept('POST', '/verifySecurityAnswer', {
            statusCode: 200,
            body: JSON.stringify({success: true, message: 'Security answer verified'})
        }).as('verifySecurityAnswer');

        cy.get('#checkSecurityAnswerButton').click();
        cy.wait('@verifySecurityAnswer');

        cy.get('#newPassword').type('Password123');
        cy.get('#confirmPassword').type('Password123');

        //simulate a successful server response
        cy.intercept('POST', '/resetPassword', {
            statusCode: 200,
            body: JSON.stringify({success: true, message: 'Password reset successfully'})
        }).as('resetPassword');

        cy.get('#resetPasswordButton').click();
        cy.wait('@resetPassword');
        cy.url().should('include', '/login.html');
    });
});