# pyre-ignore-all-errors[21]
from flask import Flask, jsonify, request
# pyre-ignore-all-errors[21]
from flask_cors import CORS
from datetime import datetime
import sqlite3

app = Flask(__name__)
CORS(app)

DB_PATH = 'banco.db'

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    # Permite acessar colunas pelo nome (como um dicionário)
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# ROTAS PARA USUARIOS E RECURSOS
# ==========================================

@app.route('/usuarios', methods=['POST'])
def cadastrar_usuario():
    dados = request.json
    if not dados or "nome" not in dados or "papel" not in dados:
        return jsonify({"erro": "Parâmetros 'nome' e 'papel' são obrigatórios"}), 400
        
    conn = get_db_connection()
    
    usuario_existente = conn.execute("SELECT id FROM usuarios WHERE nome = ?", (dados["nome"],)).fetchone()
    if usuario_existente:
        conn.close()
        return jsonify({"erro": "Usuário ja existe."}), 409
        
    cursor = conn.cursor()
    cursor.execute("INSERT INTO usuarios (nome, papel) VALUES (?, ?)", (dados["nome"], dados["papel"]))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": user_id, "nome": dados["nome"], "papel": dados["papel"]}), 201

@app.route('/usuarios', methods=['GET'])
def listar_usuarios():
    conn = get_db_connection()
    usuarios = conn.execute("SELECT id, nome, papel FROM usuarios").fetchall()
    conn.close()
    return jsonify([dict(u) for u in usuarios]), 200

@app.route('/recursos', methods=['POST'])
def cadastrar_recurso():
    dados = request.json
    if not dados or "usuario_req_id" not in dados or "nome" not in dados:
        return jsonify({"erro": "Parâmetros 'usuario_req_id' e 'nome' são obrigatórios"}), 400
        
    conn = get_db_connection()
    
    # Checar se é admin
    user = conn.execute("SELECT papel FROM usuarios WHERE id = ?", (dados["usuario_req_id"],)).fetchone()
    if not user or user["papel"] != "admin":
        conn.close()
        return jsonify({"erro": "Apenas administradores podem cadastrar recursos"}), 403
        
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO recursos (nome) VALUES (?)", (dados["nome"],))
        conn.commit()
        rec_id = cursor.lastrowid
        conn.close()
        return jsonify({"id": rec_id, "nome": dados["nome"]}), 201
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"erro": "Recurso com esse nome já existe"}), 409

# ==========================================
# ROTAS PARA USUARIOS E RECURSOS
# ==========================================

@app.route('/recursos', methods=['GET'])
def listar_recursos():
    conn = get_db_connection()
    recursos = conn.execute("SELECT id, nome FROM recursos").fetchall()
    conn.close()
    return jsonify([dict(r) for r in recursos]), 200

@app.route('/recursos/<int:id>', methods=['DELETE'])
def deletar_recurso(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM sala_recursos WHERE recurso_id = ?", (id,))
    conn.execute("DELETE FROM recursos WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "Recurso removido com sucesso"}), 200

# ==========================================
# ROTAS DA API - SALAS
# ==========================================

@app.route('/salas', methods=['GET'])
def listar_salas():
    """História 1: Visualizar Salas (Resumo)"""
    conn = get_db_connection()
    salas = conn.execute("SELECT id, nome, capacidade FROM salas").fetchall()
    conn.close()
    return jsonify([dict(s) for s in salas]), 200

@app.route('/salas/<int:id>', methods=['GET'])
def detalhes_sala(id):
    """História 2: Consultar Detalhes (usando INNER JOIN para os recursos)"""
    conn = get_db_connection()
    sala = conn.execute("SELECT id, nome, capacidade FROM salas WHERE id = ?", (id,)).fetchone()
    if sala is None:
        conn.close()
        return jsonify({"erro": "Sala não encontrada"}), 404
        
    recursos_db = conn.execute('''
        SELECT r.nome FROM recursos r
        JOIN sala_recursos sr ON r.id = sr.recurso_id
        WHERE sr.sala_id = ?
    ''', (id,)).fetchall()
    conn.close()
    
    sala_dict = dict(sala)
    sala_dict["recursos"] = [r["nome"] for r in recursos_db]
    
    return jsonify(sala_dict), 200

@app.route('/salas', methods=['POST'])
def cadastrar_sala():
    """História 7: Cadastrar Sala (Admin)"""
    dados = request.json
    if not dados or "usuario_req_id" not in dados or "nome" not in dados or "capacidade" not in dados:
        return jsonify({"erro": "Parâmetros obrigatórios faltando"}), 400
        
    conn = get_db_connection()
    
    sala_existente = conn.execute("SELECT id FROM salas WHERE nome = ?", (dados["nome"],)).fetchone()
    if sala_existente:
        conn.close()
        return jsonify({"erro": "Sala duplicada. Uma sala com esse nome já existe."}), 409
    
    user = conn.execute("SELECT papel FROM usuarios WHERE id = ?", (dados["usuario_req_id"],)).fetchone()
    if not user or user["papel"] != "admin":
        conn.close()
        return jsonify({"erro": "Apenas administradores podem cadastrar salas"}), 403
        
    cursor = conn.cursor()
    cursor.execute("INSERT INTO salas (nome, capacidade) VALUES (?, ?)", (dados["nome"], dados["capacidade"]))
    sala_id = cursor.lastrowid
    
    recursos_ids = dados.get("recursos_ids", [])
    for rec_id in recursos_ids:
        # Cadastra o vínculo de Muitos Para Muitos
        cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (?, ?)", (sala_id, rec_id))
        
    conn.commit()
    conn.close()
    return jsonify({"id": sala_id, "nome": dados["nome"], "capacidade": dados["capacidade"]}), 201

@app.route('/salas/<int:id>', methods=['PUT'])
def atualizar_sala(id):
    dados = request.json
    if not dados or "nome" not in dados or "capacidade" not in dados:
        return jsonify({"erro": "Parâmetros obrigatórios faltando"}), 400
        
    conn = get_db_connection()
    sala = conn.execute("SELECT id FROM salas WHERE id = ?", (id,)).fetchone()
    if not sala:
        conn.close()
        return jsonify({"erro": "Sala não encontrada"}), 404
        
    cursor = conn.cursor()
    cursor.execute("UPDATE salas SET nome = ?, capacidade = ? WHERE id = ?", (dados["nome"], dados["capacidade"], id))
    
    if "recursos_ids" in dados:
        recursos_ids = dados["recursos_ids"]
        cursor.execute("DELETE FROM sala_recursos WHERE sala_id = ?", (id,))
        for rec_id in recursos_ids:
            cursor.execute("INSERT INTO sala_recursos (sala_id, recurso_id) VALUES (?, ?)", (id, rec_id))
            
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "Sala atualizada com sucesso"}), 200

@app.route('/salas/<int:id>', methods=['DELETE'])
def deletar_sala(id):
    conn = get_db_connection()
    sala = conn.execute("SELECT id FROM salas WHERE id = ?", (id,)).fetchone()
    if not sala:
        conn.close()
        return jsonify({"erro": "Sala não encontrada"}), 404
        
    conn.execute("DELETE FROM sala_recursos WHERE sala_id = ?", (id,))
    conn.execute("DELETE FROM reservas WHERE sala_id = ?", (id,))
    conn.execute("DELETE FROM salas WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "Sala removida com sucesso"}), 200

# ==========================================
# ROTAS DA API - RESERVAS
# ==========================================

@app.route('/salas/<int:id>/disponibilidade', methods=['GET'])
def verificar_disponibilidade(id):
    """História 3: Verificar Disponibilidade"""
    data_buscada = request.args.get('data')
    if not data_buscada:
        return jsonify({"erro": "O parâmetro 'data' (YYYY-MM-DD) é obrigatório"}), 400

    conn = get_db_connection()
    sala = conn.execute("SELECT id FROM salas WHERE id = ?", (id,)).fetchone()
    if not sala:
        conn.close()
        return jsonify({"erro": "Sala não encontrada"}), 404

    reservas_do_dia = conn.execute('''
        SELECT horario_inicio, horario_fim 
        FROM reservas 
        WHERE sala_id = ? AND data = ?
    ''', (id, data_buscada)).fetchall()
    conn.close()
    
    horarios_ocupados = [{"inicio": r["horario_inicio"], "fim": r["horario_fim"]} for r in reservas_do_dia]
        
    return jsonify({
        "sala_id": id,
        "data": data_buscada,
        "horarios_ocupados": horarios_ocupados
    }), 200

def _conflito_de_horario(inicio_novo_str, fim_novo_str, reservas_existentes):
    """Função auxiliar para verificar sobreposição de horários (História 8)."""
    FMT = "%H:%M"
    inicio_novo = datetime.strptime(inicio_novo_str, FMT).time()
    fim_novo = datetime.strptime(fim_novo_str, FMT).time()
    
    if inicio_novo >= fim_novo:
        return True

    for r in reservas_existentes:
        inicio_r = datetime.strptime(r["horario_inicio"], FMT).time()
        fim_r = datetime.strptime(r["horario_fim"], FMT).time()
        
        if inicio_novo < fim_r and fim_novo > inicio_r:
            return True
            
    return False

@app.route('/reservas', methods=['POST'])
def realizar_reserva():
    """História 4: Realizar Reserva e História 8"""
    dados = request.json
    campos = ["sala_id", "usuario_id", "data", "horario_inicio", "horario_fim"]
    if not dados or not all(c in dados for c in campos):
        return jsonify({"erro": "Dados obrigatórios faltando"}), 400
        
    conn = get_db_connection()
    
    # 1. Valida Usuário 
    user = conn.execute("SELECT id FROM usuarios WHERE id = ?", (dados["usuario_id"],)).fetchone()
    if not user:
        conn.close()
        return jsonify({"erro": "Usuário informado não existe no banco"}), 404

    # 2. Valida Sala
    sala = conn.execute("SELECT id FROM salas WHERE id = ?", (dados["sala_id"],)).fetchone()
    if not sala:
        conn.close()
        return jsonify({"erro": "Sala informada não existe no banco"}), 404

    # 3. Valida Conflito
    reservas_da_sala_no_dia = conn.execute('''
        SELECT horario_inicio, horario_fim FROM reservas 
        WHERE sala_id = ? AND data = ?
    ''', (dados["sala_id"], dados["data"])).fetchall()
    
    if _conflito_de_horario(dados["horario_inicio"], dados["horario_fim"], reservas_da_sala_no_dia):
        conn.close()
        return jsonify({"erro": "Conflito de horário. A sala já possui reserva neste período."}), 409
        
    # Salva
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO reservas (sala_id, usuario_id, data, horario_inicio, horario_fim)
        VALUES (?, ?, ?, ?, ?)
    ''', (dados["sala_id"], dados["usuario_id"], dados["data"], dados["horario_inicio"], dados["horario_fim"]))
    reserva_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        "id": reserva_id,
        "sala_id": dados["sala_id"],
        "usuario_id": dados["usuario_id"],
        "data": dados["data"],
        "horario_inicio": dados["horario_inicio"],
        "horario_fim": dados["horario_fim"]
    }), 201

@app.route('/reservas', methods=['GET'])
def listar_minhas_reservas():
    """História 5: Meus Agendamentos"""
    usuario_id = request.args.get('usuario_id')
    if not usuario_id:
        return jsonify({"erro": "O parâmetro 'usuario_id' é obrigatório"}), 400
        
    conn = get_db_connection()
    minhas_reservas = conn.execute("SELECT * FROM reservas WHERE usuario_id = ?", (usuario_id,)).fetchall()
    conn.close()
    
    return jsonify([dict(r) for r in minhas_reservas]), 200

@app.route('/reservas/<int:id>', methods=['DELETE'])
def cancelar_reserva(id):
    """História 6: Cancelar Reserva"""
    conn = get_db_connection()
    reserva = conn.execute("SELECT id FROM reservas WHERE id = ?", (id,)).fetchone()
    if not reserva:
        conn.close()
        return jsonify({"erro": "Reserva não encontrada"}), 404
        
    conn.execute("DELETE FROM reservas WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensagem": "Reserva cancelada com sucesso"}), 200

@app.route('/reservas/todas', methods=['GET'])
def listar_todas_reservas():
    """Lista todas as reservas"""
    conn = get_db_connection()
    minhas_reservas = conn.execute("SELECT * FROM reservas").fetchall()
    conn.close()
    return jsonify([dict(r) for r in minhas_reservas]), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
