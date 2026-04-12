from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
app = Flask(__name__)
CORS(app)
salas = [{'id': 1, 'nome': 'Sala 101', 'capacidade': 30, 'recursos': ['Projetor', 'Ar Condicionado', 'Quadro Branco']}, {'id': 2, 'nome': 'Laboratório de Informática', 'capacidade': 20, 'recursos': ['Computadores', 'Projetor', 'Ar Condicionado']}]
reservas = []
next_sala_id = 3
next_reserva_id = 1

def _conflito_de_horario(inicio1, fim1, inicio2, fim2):
    fmt = '%H:%M'
    return datetime.strptime(inicio1, fmt) < datetime.strptime(fim2, fmt) and datetime.strptime(fim1, fmt) > datetime.strptime(inicio2, fmt)

@app.route('/salas', methods=['GET'])
def listar_salas():
    return (jsonify([{'id': s['id'], 'nome': s['nome'], 'capacidade': s['capacidade']} for s in salas]), 200)

@app.route('/salas/<int:id>', methods=['GET'])
def detalhar_sala(id):
    for sala in salas:
        if sala['id'] == id:
            return (jsonify(sala), 200)
    return (jsonify({'erro': 'Sala não encontrada'}), 404)

@app.route('/salas', methods=['POST'])
def cadastrar_sala():
    global next_sala_id
    dados = request.get_json()
    if not dados.get('usuario_req_id') == 1:
        return (jsonify({'erro': 'Apenas administradores podem cadastrar salas'}), 403)
    nova_sala = {'id': next_sala_id, 'nome': dados['nome'], 'capacidade': dados['capacidade'], 'recursos': dados.get('recursos', [])}
    salas.append(nova_sala)
    next_sala_id += 1
    return (jsonify(nova_sala), 201)

@app.route('/reservas', methods=['POST'])
def realizar_reserva():
    global next_reserva_id
    dados = request.get_json()
    if not any((sala['id'] == dados['sala_id'] for sala in salas)):
        return (jsonify({'erro': 'Sala informada não existe'}), 404)
    for r in reservas:
        if r['sala_id'] == dados['sala_id'] and r['data'] == dados['data']:
            if _conflito_de_horario(dados['horario_inicio'], dados['horario_fim'], r['horario_inicio'], r['horario_fim']):
                return (jsonify({'erro': 'Conflito de horário. A sala já possui reserva neste período.'}), 409)
    nova_reserva = {'id': next_reserva_id, 'sala_id': dados['sala_id'], 'usuario_id': dados['usuario_id'], 'data': dados['data'], 'horario_inicio': dados['horario_inicio'], 'horario_fim': dados['horario_fim']}
    reservas.append(nova_reserva)
    next_reserva_id += 1
    return (jsonify(nova_reserva), 201)

@app.route('/reservas', methods=['GET'])
def listar_minhas_reservas():
    return (jsonify([r for r in reservas if str(r['usuario_id']) == str(request.args.get('usuario_id'))]), 200)

@app.route('/reservas/<int:id>', methods=['DELETE'])
def cancelar_reserva(id):
    global reservas
    tmp = [r for r in reservas if r['id'] != id]
    if len(tmp) == len(reservas):
        return (jsonify({'erro': 'Reserva não encontrada'}), 404)
    reservas = tmp
    return (jsonify({'mensagem': 'Reserva cancelada com sucesso'}), 200)
if __name__ == '__main__':
    app.run(debug=True, port=5000)