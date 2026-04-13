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

### 1. Diagrama de Entidade-Relacionamento (Banco de Dados)
O diagrama abaixo ilustra o esquema relacional do banco de dados `banco.db` (SQLite), exibindo as 5 entidades projetadas, seus atributos e as regras de Associação (Muitos para Muitos) adotadas para os Recursos.

```mermaid
erDiagram
    USUARIOS {
        int id PK
        string nome "UNIQUE"
        string papel
    }
    RECURSOS {
        int id PK
        string nome "UNIQUE"
    }
    SALAS {
        int id PK
        string nome "UNIQUE"
        int capacidade
    }
    SALA_RECURSOS {
        int sala_id PK, FK
        int recurso_id PK, FK
    }
    RESERVAS {
        int id PK
        int sala_id FK
        int usuario_id FK
        string data
        string horario_inicio
        string horario_fim
    }

    SALAS ||--o{ SALA_RECURSOS : "possui"
    RECURSOS ||--o{ SALA_RECURSOS : "pertence a"
    SALAS ||--o{ RESERVAS : "recebe"
    USUARIOS ||--o{ RESERVAS : "realiza"
```

### 2. Diagrama de Sequência (Fluxo da API)
Este diagrama detalha o processo rigoroso de validação de "Edge Cases" e conflitos que nossa API Flask realiza antes de autorizar uma nova gravação no banco de dados.

```mermaid
sequenceDiagram
    actor Usuario
    participant API as Flask API (/reservas)
    participant DB as SQLite (banco.db)

    Usuario->>API: POST /reservas (JSON: sala, usuario, horarios)
    API->>DB: SELECT id FROM usuarios
    DB-->>API: (Retorna True se existe)
    API->>DB: SELECT id FROM salas
    DB-->>API: (Retorna True se existe)
    API->>DB: SELECT horarios FROM reservas WHERE sala = X e data = Y
    DB-->>API: Lista de reservas já cadastradas hoje
    
    rect rgb(0, 0, 0)
        note right of API: Algoritmo lógico em Python intercepta e avalia cruzamento:<br>(novo_inicio < BD_fim AND novo_fim > BD_inicio)
    end
    
    alt Houve Conflito
        API-->>Usuario: 409 Conflict {"erro": "Conflito de horário"}
    else Sem Conflito
        API->>DB: INSERT INTO reservas (...)
        DB-->>API: (ID da Reserva gerado Auto-Incrementado)
        API-->>Usuario: 201 Created (Comprovante JSON)
    end
```

### 3. Diagrama de Classes (Estrutural)
Este diagrama apresenta a visão estática do domínio do sistema, de acordo com os padrões UML, ilustrando as entidades principais, seus atributos e os relacionamentos conceituais (Multiplicidade) entre elas.

```mermaid
classDiagram
    class Usuario {
        +int id
        +string nome
        +string papel
    }
    class Sala {
        +int id
        +string nome
        +int capacidade
    }
    class Recurso {
        +int id
        +string nome
    }
    class Reserva {
        +int id
        +string data
        +string horario_inicio
        +string horario_fim
        +int sala_id
        +int usuario_id
    }
    
    Usuario "1" -- "*" Reserva : realiza >
    Sala "1" -- "*" Reserva : recebe >
    Sala "*" -- "*" Recurso : possui >
```
