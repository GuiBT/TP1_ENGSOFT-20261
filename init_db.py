import sqlite3
import os

def init_db():
    if os.path.exists('banco.db'):
        os.remove('banco.db')
        print("Banco de dados anterior removido.")

    conn = sqlite3.connect('banco.db')
    conn.execute("PRAGMA foreign_keys = ON;")
    cursor = conn.cursor()

    print("Criando tabela 'usuarios'...")
    cursor.execute('''
    CREATE TABLE usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        papel TEXT NOT NULL
    )
    ''')

    print("Criando tabela 'recursos'...")
    cursor.execute('''
    CREATE TABLE recursos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL
    )
    ''')

    print("Criando tabela 'salas'...")
    cursor.execute('''
    CREATE TABLE salas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        capacidade INTEGER NOT NULL
    )
    ''')

    print("Criando tabela 'sala_recursos'...")
    cursor.execute('''
    CREATE TABLE sala_recursos (
        sala_id INTEGER NOT NULL,
        recurso_id INTEGER NOT NULL,
        PRIMARY KEY (sala_id, recurso_id),
        FOREIGN KEY(sala_id) REFERENCES salas(id) ON DELETE CASCADE,
        FOREIGN KEY(recurso_id) REFERENCES recursos(id) ON DELETE CASCADE
    )
    ''')

    print("Criando tabela 'reservas'...")
    cursor.execute('''
    CREATE TABLE reservas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sala_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        horario_inicio TEXT NOT NULL,
        horario_fim TEXT NOT NULL,
        FOREIGN KEY(sala_id) REFERENCES salas(id) ON DELETE CASCADE,
        FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )
    ''')

    print("Populando o banco com dados iniciais (Seed)...")
    cursor.execute("INSERT INTO usuarios (nome, papel) VALUES ('admin', 'admin')") # ID 1
    cursor.execute("INSERT INTO usuarios (nome, papel) VALUES ('pedro', 'comum')") # ID 2
    cursor.execute("INSERT INTO usuarios (nome, papel) VALUES ('maria', 'comum')") # ID 3
    
    cursor.execute("INSERT INTO recursos (nome) VALUES ('Projetor')")            # ID 1
    cursor.execute("INSERT INTO recursos (nome) VALUES ('Ar Condicionado')")     # ID 2
    cursor.execute("INSERT INTO recursos (nome) VALUES ('Computadores')")        # ID 3
    cursor.execute("INSERT INTO recursos (nome) VALUES ('Quadro Branco')")       # ID 4
    
    cursor.execute("INSERT INTO salas (nome, capacidade) VALUES ('Sala 101', 30)") # ID 1
    cursor.execute("INSERT INTO salas (nome, capacidade) VALUES ('Laboratório de Informática', 20)") # ID 2
    
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (1, 1)")
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (1, 2)")
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (1, 4)")
    
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (2, 3)")
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (2, 1)")
    cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (2, 2)")
    
    cursor.execute("INSERT INTO reservas (sala_id, usuario_id, data, horario_inicio, horario_fim) VALUES (1, 2, '2026-03-25', '14:00', '16:00')")

    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print("Banco de dados 'banco.db' inicializado e recriado com sucesso!")
