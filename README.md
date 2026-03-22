# TP1 - Sistema de Reserva de Salas

## Membros e Papéis
* **Guilherme Bacelar Teixeira** - [Papel: Backend] 
* **Pedro Henrique Egito Aguiar** - [Papel: Frontend] 

---

## Objetivo do Sistema
O sistema visa gerenciar o agendamento de espaços comuns, permitindo que usuários visualizem a disponibilidade e realizem reservas de forma autônoma. O foco é evitar conflitos de horários e facilitar a organização do uso dos espaços físicos da instituição. A aplicação será composta por uma API em Flask, interface Web em React e persistência de dados em SQLite.

---

## Tecnologias e Agentes de IA
* **Frontend:** React (Vite) 
* **Backend:** Flask (Python) 
* **Banco de Dados:** SQLite 
* **Agente de IA:** Gemini

---

## Histórias de Usuário
1.  **Visualizar Salas:** Como usuário, quero visualizar a lista de todas as salas cadastradas para saber quais opções estão disponíveis.
2.  **Consultar Detalhes:** Como usuário, quero ver a capacidade e os recursos de uma sala específica para decidir se ela atende à minha necessidade.
3.  **Verificar Disponibilidade:** Como usuário, quero consultar os horários ocupados de uma sala em uma data específica para encontrar um horário livre.
4.  **Realizar Reserva:** Como usuário, quero reservar uma sala informando a data e o intervalo de tempo desejado.
5.  **Meus Agendamentos:** Como usuário, quero visualizar uma lista com as minhas reservas confirmadas para conferir meus compromissos.
6.  **Cancelar Reserva:** Como usuário, quero poder cancelar uma reserva feita por mim caso eu não precise mais do espaço.
7.  **Cadastrar Sala (Admin):** Como administrador, quero cadastrar novas salas no sistema informando nome, identificação e capacidade.
8.  **Feedback de Conflito:** Como usuário, quero ser impedido de reservar uma sala em um horário que já possua outro agendamento ativo.

---

## Documentação UML
> *Os diagramas serão inseridos aqui conforme o avanço do projeto*