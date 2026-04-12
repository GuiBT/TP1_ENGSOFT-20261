import sqlite3, os

def init_db():
    if os.path.exists('banco.db'):
        os.remove('banco.db')
    conn = sqlite3.connect('banco.db')
    conn.execute('PRAGMA foreign_keys = ON;')
    c = conn.cursor()
    c.execute('CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, papel TEXT NOT NULL)')
    c.execute('CREATE TABLE recursos (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL)')
    c.execute('CREATE TABLE salas (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, capacidade INTEGER NOT NULL)')
    c.execute('CREATE TABLE sala_recursos (sala_id INTEGER NOT NULL, recurso_id INTEGER NOT NULL, PRIMARY KEY (sala_id, recurso_id), FOREIGN KEY(sala_id) REFERENCES salas(id) ON DELETE CASCADE, FOREIGN KEY(recurso_id) REFERENCES recursos(id) ON DELETE CASCADE)')
    c.execute('CREATE TABLE reservas (id INTEGER PRIMARY KEY AUTOINCREMENT, sala_id INTEGER NOT NULL, usuario_id INTEGER NOT NULL, data TEXT NOT NULL, horario_inicio TEXT NOT NULL, horario_fim TEXT NOT NULL, FOREIGN KEY(sala_id) REFERENCES salas(id) ON DELETE CASCADE, FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE)')
    c.execute("INSERT INTO usuarios (nome, papel) VALUES ('admin', 'admin'), ('pedro', 'comum'), ('maria', 'comum')")
    c.execute("INSERT INTO recursos (nome) VALUES ('Projetor'), ('Ar Condicionado'), ('Computadores'), ('Quadro Branco')")
    c.execute("INSERT INTO salas (nome, capacidade) VALUES ('Sala 101', 30), ('Laboratório de Informática', 20)")
    c.execute('INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (1, 1), (1, 2), (1, 4), (2, 3), (2, 1), (2, 2)')
    c.execute("INSERT INTO reservas (sala_id, usuario_id, data, horario_inicio, horario_fim) VALUES (1, 2, '2026-03-25', '14:00', '16:00')")
    conn.commit()
    conn.close()
if __name__ == '__main__':
    init_db()