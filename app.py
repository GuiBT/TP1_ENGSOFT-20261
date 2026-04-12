from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('banco.db')
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')
    return conn

def _conflito_de_horario(inicio1, fim1, inicio2, fim2):
    fmt = '%H:%M'
    return datetime.strptime(inicio1, fmt) < datetime.strptime(fim2, fmt) and datetime.strptime(fim1, fmt) > datetime.strptime(inicio2, fmt)

@app.route('/usuarios', methods=['POST'])
def criar_usuario():
    dados = request.get_json()
    conn = get_db_connection()
    try:
        c = conn.cursor()
        c.execute('INSERT INTO usuarios (nome, papel) VALUES (?, ?)', (dados['nome'], dados['papel']))
        conn.commit()
        ret = (jsonify({'id': c.lastrowid, 'nome': dados['nome'], 'papel': dados['papel']}), 201)
    except sqlite3.IntegrityError:
        ret = (jsonify({'erro': 'Usuário ja existe.'}), 409)
    conn.close()
    return ret

@app.route('/salas', methods=['GET'])
def listar_salas():
    conn = get_db_connection()
    salas = conn.execute('SELECT id, nome, capacidade FROM salas').fetchall()
    conn.close()
    return (jsonify([dict(s) for s in salas]), 200)

@app.route('/salas/<int:id>', methods=['GET'])
def detalhar_sala(id):
    conn = get_db_connection()
    sala = conn.execute('SELECT * FROM salas WHERE id = ?', (id,)).fetchone()
    if not sala:
        conn.close()
        return (jsonify({'erro': 'Sala não encontrada'}), 404)
    rec = conn.execute('SELECT r.nome FROM recursos r JOIN sala_recursos sr ON r.id = sr.recurso_id WHERE sr.sala_id = ?', (id,)).fetchall()
    conn.close()
    s = dict(sala)
    s['recursos'] = [r['nome'] for r in rec]
    return (jsonify(s), 200)

@app.route('/salas', methods=['POST'])
def cadastrar_sala():
    dados = request.get_json()
    conn = get_db_connection()
    user = conn.execute('SELECT papel FROM usuarios WHERE id = ?', (dados['usuario_req_id'],)).fetchone()
    if not user or user['papel'] != 'admin':
        conn.close()
        return (jsonify({'erro': 'Apenas administradores podem cadastrar salas'}), 403)
    try:
        c = conn.cursor()
        c.execute('INSERT INTO salas (nome, capacidade) VALUES (?, ?)', (dados['nome'], dados['capacidade']))
        sid = c.lastrowid
        for rid in dados.get('recursos_ids', []):
            c.execute('INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (?, ?)', (sid, rid))
        conn.commit()
        ret = (jsonify({'id': sid, 'nome': dados['nome'], 'capacidade': dados['capacidade']}), 201)
    except sqlite3.IntegrityError:
        ret = (jsonify({'erro': 'Sala duplicada. Uma sala com esse nome já existe.'}), 409)
    conn.close()
    return ret

@app.route('/reservas', methods=['POST'])
def realizar_reserva():
    dados = request.get_json()
    conn = get_db_connection()
    if not conn.execute('SELECT id FROM salas WHERE id = ?', (dados['sala_id'],)).fetchone():
        conn.close()
        return (jsonify({'erro': 'Sala informada não existe no banco'}), 404)
    if not conn.execute('SELECT id FROM usuarios WHERE id = ?', (dados['usuario_id'],)).fetchone():
        conn.close()
        return (jsonify({'erro': 'Usuário informado não existe no banco'}), 404)
    for r in conn.execute('SELECT horario_inicio, horario_fim FROM reservas WHERE sala_id = ? AND data = ?', (dados['sala_id'], dados['data'])).fetchall():
        if _conflito_de_horario(dados['horario_inicio'], dados['horario_fim'], r['horario_inicio'], r['horario_fim']):
            conn.close()
            return (jsonify({'erro': 'Conflito de horário. A sala já possui reserva neste período.'}), 409)
    c = conn.cursor()
    c.execute('INSERT INTO reservas (sala_id, usuario_id, data, horario_inicio, horario_fim) VALUES (?, ?, ?, ?, ?)', (dados['sala_id'], dados['usuario_id'], dados['data'], dados['horario_inicio'], dados['horario_fim']))
    conn.commit()
    dados['id'] = c.lastrowid
    conn.close()
    return (jsonify(dados), 201)

@app.route('/reservas', methods=['GET'])
def listar_minhas_reservas():
    uid = request.args.get('usuario_id')
    conn = get_db_connection()
    reservas = conn.execute('SELECT * FROM reservas WHERE usuario_id = ?', (uid,)).fetchall()
    conn.close()
    return (jsonify([dict(r) for r in reservas]), 200)

@app.route('/reservas/<int:id>', methods=['DELETE'])
def cancelar_reserva(id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('DELETE FROM reservas WHERE id = ?', (id,))
    if c.rowcount == 0:
        conn.close()
        return (jsonify({'erro': 'Reserva não encontrada'}), 404)
    conn.commit()
    conn.close()
    return (jsonify({'mensagem': 'Reserva cancelada com sucesso'}), 200)
if __name__ == '__main__':
    app.run(debug=True, port=5000)