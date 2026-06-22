// Arquivo de suporte global do Cypress
// Importações e configurações globais podem ser feitas aqui

Cypress.Commands.add('loginAs', (login, senha) => {
  cy.intercept('POST', '/login', (req) => {
    if (req.body.login === login) {
      req.reply({
        statusCode: 200,
        body: {
          token: 'fake-token-' + login,
          user: {
            id: login === 'admin' ? 1 : 2,
            nome: login === 'admin' ? 'admin' : 'pedro',
            login: login,
            papel: login === 'admin' ? 'admin' : 'comum',
          },
        },
      });
    }
  }).as('loginRequest');

  cy.intercept('GET', '/me', {
    statusCode: 200,
    body: {
      id: login === 'admin' ? 1 : 2,
      nome: login === 'admin' ? 'admin' : 'pedro',
      login: login,
      papel: login === 'admin' ? 'admin' : 'comum',
    },
  }).as('meRequest');

  cy.visit('/');
  cy.get('input[placeholder="Digite seu login"]').type(login);
  cy.get('input[placeholder="Digite sua senha"]').type(senha);
  cy.get('button[type="submit"]').click();
  cy.wait('@loginRequest');
});
