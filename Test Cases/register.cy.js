/*
Tests register.html and register.js
Tests existence and attributes of fields
Tests password/username restrictions and requirements
Tests valid password message
 */

describe('Register Page', () => {
  beforeEach(() => {
    cy.visit('https://knotes-3spt.onrender.com/register.html');
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

    it('should verify confirm password field', () => {
      // Check that the confirm password field exists
      cy.get('#password2').should('exist');

      // Type in the confirm password and verify the value
      cy.get('#password2').type('ValidPass123');
      cy.get('#password2').should('have.value', 'ValidPass123');
    });

    it('should verify security question dropdown', () => {
      // Check that the security question dropdown exists
      cy.get('#questions').should('exist');

      // Select a security question
      cy.get('#questions').select('What is your dream job?');
      cy.get('#questions').should('have.value', 'dream_job');
    });

    it('should verify security answer field', () => {
      // Check that the security answer field exists
      cy.get('#securityAnswer').should('exist');

      // Type in the security answer and verify the value
      cy.get('#securityAnswer').type('Astronaut');
      cy.get('#securityAnswer').should('have.value', 'Astronaut');
    });

    it('should make all fields required', () => {
      cy.get('#submit').click();
      cy.get('#username').should('have.attr', 'required');
      cy.get('#password').should('have.attr', 'required');
      cy.get('#password2').should('have.attr', 'required');
      cy.get('#securityAnswer').should('have.attr', 'required');
    });

  it('should restrict password length', () => {
    cy.get('#username').type('ExistingUser');
    cy.get('#password').type('ExtremelyLongPasswordThatShouldNotWork42');
    cy.get('#password2').type('ExtremelyLongPasswordThatShouldNotWork42');
    cy.get('#questions').select('What is your dream job?');
    cy.get('#securityAnswer').type('Astronaut');
    cy.get('#submit').click();
    cy.get('#message').should('contain','Password cannot exceed 16 characters');
  });

  it('should not allow special characters', () => {
    cy.get('#username').type('ExistingUser');
    cy.get('#password').type('<script>');
    cy.get('#password2').type('<script>');
    cy.get('#questions').select('What is your dream job?');
    cy.get('#securityAnswer').type('Astronaut');
    cy.get('#submit').click();
    cy.get('#message').should('contain','Password cannot contain special characters: /\\|<>=&#');
  });

    it('should show error if passwords do not match', () => {
      cy.get('#username').type('UserTest');
      cy.get('#password').type('Password123');
      cy.get('#password2').type('Password124');
      cy.get('#questions').select('What was the name of your first pet?');
      cy.get('#securityAnswer').type('Fluffy');

      cy.get('#submit').click();
      cy.get('#message').should('contain', 'Passwords do not match');
    });

    it('should show error if no security question is selected', () => {
      cy.get('#username').type('UserTest');
      cy.get('#password').type('Password123');
      cy.get('#password2').type('Password123');
      cy.get('#securityAnswer').type('Fluffy');

     //select no security question
      cy.get('#submit').click();
     cy.get('#message').should('contain', 'Please select a security question');
    });

  it('submits valid input and handles success', () => {
      cy.get('#username').type('TestUser123');
      cy.get('#password').type('ValidPass1');
      cy.get('#password2').type('ValidPass1');
      cy.get('#questions').select('What is your favorite book?');
      cy.get('#securityAnswer').type('HarryPotter');


    cy.intercept('POST', '/register', {
        statusCode: 200,
        body: JSON.stringify({message: 'User registered successfully', token: "random"}),
      }).as('register');

      cy.get('#submit').click();
      cy.wait('@register');
    cy.url().should('include', 'homepage.html');
    });

    it('shows error if passwords do not match', () => {
      cy.get('#username').type('UserTest');
      cy.get('#password').type('Password1');
      cy.get('#password2').type('Password2');
      cy.get('#questions').select('What is your dream job?');
      cy.get('#securityAnswer').type('Engineer');

      cy.get('#submit').click();
      cy.get('#message').should('contain', 'Passwords do not match');
    });

    it('shows error for invalid security answer', () => {
      cy.get('#username').type('SecureUser');
      cy.get('#password').type('SecurePass1');
      cy.get('#password2').type('SecurePass1');
      cy.get('#questions').select('What was the name of your first pet?');
      cy.get('#securityAnswer').type('<script>');

      cy.get('#submit').click();
      cy.get('#message').should('contain', 'Security answer cannot contain special characters');
    });

    it('shows error if username already exists', () => {
      cy.get('#username').type('ExistingUser');
      cy.get('#password').type('PassWord123');
      cy.get('#password2').type('PassWord123');
      cy.get('#questions').select('What is your dream job?');
      cy.get('#securityAnswer').type('Astronaut');

      cy.intercept('POST', '/register', {
        statusCode: 409,
        body: JSON.stringify({message: 'Username already exists'}),
      }).as('register');

      cy.get('#submit').click();
      cy.wait('@register');
      cy.get('#message').should('contain', 'Username already exists. Please choose another.');
    });

});
