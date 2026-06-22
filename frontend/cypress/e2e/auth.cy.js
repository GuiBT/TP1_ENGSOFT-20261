describe('E2E 1 - Login com sucesso', () => {
  beforeEach(() => {
    // Mock do endpoint /login
    cy.intercept('POST', 'http://127.0.0.1:5000/login', {
      statusCode: 200,
      body: {
        token: 'fake-jwt-token',
        user: { id: 1, nome: 'admin', login: 'admin', papel: 'admin' },
      },
    }).as('loginRequest');

    // Mock do endpoint /me (usado pelo App para restaurar sessão)
    cy.intercept('GET', 'http://127.0.0.1:5000/me', {
      statusCode: 401,
      body: { erro: 'Token ausente' },
    }).as('meRequest');
  });

  it('deve exibir a tela de login por padrão', () => {
    cy.visit('/');
    cy.contains('Login').should('be.visible');
    cy.get('input[placeholder="Digite seu login"]').should('be.visible');
    cy.get('input[placeholder="Digite sua senha"]').should('be.visible');
  });

  it('deve autenticar e redirecionar para a Home após login válido', () => {
    cy.visit('/');
    cy.get('input[placeholder="Digite seu login"]').type('admin');
    cy.get('input[placeholder="Digite sua senha"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
    // Após login, o formulário some e a navbar aparece
    cy.get('nav, header, [class*="navbar"], [class*="Navbar"]').should('exist');
    cy.get('input[placeholder="Digite seu login"]').should('not.exist');
  });
});

describe('E2E 2 - Login com credenciais inválidas', () => {
  beforeEach(() => {
    cy.intercept('POST', 'http://127.0.0.1:5000/login', {
      statusCode: 401,
      body: { erro: 'Login ou senha inválidos.' },
    }).as('loginFailed');

    cy.intercept('GET', 'http://127.0.0.1:5000/me', {
      statusCode: 401,
      body: { erro: 'Token ausente' },
    });
  });

  it('deve exibir mensagem de erro com credenciais inválidas', () => {
    cy.visit('/');
    cy.get('input[placeholder="Digite seu login"]').type('admin');
    cy.get('input[placeholder="Digite sua senha"]').type('senha_errada');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginFailed');
    cy.contains('Login ou senha inválidos.').should('be.visible');
    // O formulário de login deve permanecer visível
    cy.get('input[placeholder="Digite seu login"]').should('be.visible');
  });
});
