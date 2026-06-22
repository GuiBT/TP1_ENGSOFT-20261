describe('E2E 3 - Cadastro de novo usuário', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://127.0.0.1:5000/me', {
      statusCode: 401,
      body: { erro: 'Token ausente' },
    });
  });

  it('deve navegar para o formulário de criação de conta', () => {
    cy.visit('/');
    cy.contains('Criar uma nova conta').click();
    cy.contains('Criar Conta').should('be.visible');
    cy.get('input[placeholder="Digite seu nome"]').should('be.visible');
    cy.get('input[placeholder="Escolha um login"]').should('be.visible');
  });

  it('deve cadastrar novo usuário e voltar para login com mensagem de sucesso', () => {
    const novoLogin = `usuario_${Date.now()}`;

    cy.intercept('POST', 'http://127.0.0.1:5000/usuarios', {
      statusCode: 201,
      body: { id: 99, nome: 'Novo Usuário', login: novoLogin, papel: 'comum' },
    }).as('createUser');

    cy.visit('/');
    cy.contains('Criar uma nova conta').click();

    cy.get('input[placeholder="Digite seu nome"]').type('Novo Usuário');
    cy.get('input[placeholder="Escolha um login"]').type(novoLogin);
    cy.get('input[placeholder="Digite sua senha"]').type('senha123');
    cy.get('input[placeholder="Repita sua senha"]').type('senha123');
    cy.get('button[type="submit"]').click();

    cy.wait('@createUser');
    cy.contains('Usuário criado com sucesso').should('be.visible');
    // Volta ao modo login automaticamente
    cy.get('input[placeholder="Digite seu login"]').should('be.visible');
  });

  it('deve exibir erro ao tentar cadastrar com senhas diferentes', () => {
    cy.visit('/');
    cy.contains('Criar uma nova conta').click();

    cy.get('input[placeholder="Digite seu nome"]').type('Teste');
    cy.get('input[placeholder="Escolha um login"]').type('login_teste');
    cy.get('input[placeholder="Digite sua senha"]').type('senha123');
    cy.get('input[placeholder="Repita sua senha"]').type('senha_diferente');
    cy.get('button[type="submit"]').click();

    cy.contains('As senhas não coincidem').should('be.visible');
  });
});
