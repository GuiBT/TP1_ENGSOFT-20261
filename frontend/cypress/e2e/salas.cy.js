/**
 * E2E 4 - Busca de salas disponíveis e reserva
 * Verifica que um usuário autenticado consegue buscar salas
 * disponíveis e realizar uma reserva com sucesso.
 */
describe('E2E 4 - Busca de salas e realização de reserva', () => {
  const mockUser = { id: 2, nome: 'pedro', login: 'pedro', papel: 'comum' };
  const mockSalas = [
    { id: 1, nome: 'Sala 101', capacidade: 30 },
    { id: 2, nome: 'Laboratório de Informática', capacidade: 20 },
  ];
  const mockRecursos = [
    { id: 1, nome: 'Projetor' },
    { id: 2, nome: 'Ar Condicionado' },
  ];
  const mockSalaDetalhe = {
    id: 1,
    nome: 'Sala 101',
    capacidade: 30,
    recursos: ['Projetor', 'Ar Condicionado', 'Quadro Branco'],
  };

  beforeEach(() => {
    // Simula sessão já autenticada via localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake-jwt-token');
    });

    cy.intercept('GET', 'http://127.0.0.1:5000/me', {
      statusCode: 200,
      body: mockUser,
    }).as('meRequest');

    cy.intercept('GET', 'http://127.0.0.1:5000/salas', {
      statusCode: 200,
      body: mockSalas,
    }).as('listSalas');

    cy.intercept('GET', 'http://127.0.0.1:5000/recursos', {
      statusCode: 200,
      body: mockRecursos,
    }).as('listRecursos');
  });

  it('deve exibir lista de salas na tela Home após login', () => {
    cy.visit('/');
    cy.wait('@meRequest');
    cy.wait('@listSalas');

    cy.contains('Sala 101').should('be.visible');
    cy.contains('Laboratório de Informática').should('be.visible');
  });

  it('deve buscar salas disponíveis por data e horário', () => {
    const mockDisponiveis = [
      {
        id: 2,
        nome: 'Laboratório de Informática',
        capacidade: 20,
        recursos: ['Computadores', 'Projetor'],
      },
    ];

    cy.intercept('GET', 'http://127.0.0.1:5000/salas/disponiveis*', {
      statusCode: 200,
      body: mockDisponiveis,
    }).as('buscarDisponiveis');

    cy.visit('/');
    cy.wait('@meRequest');
    cy.wait('@listSalas');

    // Preenche o formulário de busca (há 1 input date e 2 inputs time na tela de busca)
    cy.get('input[type="date"]').first().type('2026-12-15');
    cy.get('input[type="time"]').first().type('09:00');
    cy.get('input[type="time"]').last().type('11:00');

    // Botão real no Home.jsx: "Buscar Salas Livres"
    cy.contains('button', 'Buscar Salas Livres').click();

    cy.wait('@buscarDisponiveis');
    cy.contains('Laboratório de Informática').should('be.visible');
    // Sala 101 não deve aparecer pois não está nos resultados filtrados
    cy.contains('Sala 101').should('not.exist');
  });

  it('deve abrir modal de detalhes e realizar reserva com sucesso', () => {
    cy.intercept('GET', 'http://127.0.0.1:5000/salas/1', {
      statusCode: 200,
      body: mockSalaDetalhe,
    }).as('getSalaDetalhe');

    cy.intercept('POST', 'http://127.0.0.1:5000/reservas', {
      statusCode: 201,
      body: {
        id: 10,
        sala_id: 1,
        usuario_id: 2,
        data: '2026-12-15',
        horario_inicio: '09:00',
        horario_fim: '10:00',
      },
    }).as('criarReserva');

    cy.visit('/');
    cy.wait('@meRequest');
    cy.wait('@listSalas');

    // Clica no botão "Verificar Disponibilidade" do card Sala 101 (primeiro card)
    cy.contains('button', 'Verificar Disponibilidade').first().click();
    cy.wait('@getSalaDetalhe');

    // Modal aberto: preenche o formulário de reserva
    // No modal há 1 input[type="date"] e 2 inputs[type="time"]
    // O formulário de busca some do DOM quando o modal está sobre a página?
    // Não — o modal usa position:fixed. Então teremos 2 date e 4 time inputs no total.
    // Usamos .last() para pegar os inputs dentro do modal.
    cy.get('input[type="date"]').last().type('2026-12-15');
    cy.get('input[type="time"]').eq(-2).type('09:00');
    cy.get('input[type="time"]').last().type('10:00');

    cy.contains('button', 'Confirmar Agendamento').click();
    cy.wait('@criarReserva');

    cy.contains('Reserva confirmada com sucesso').should('be.visible');
  });
});
