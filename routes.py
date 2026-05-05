from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from database import db
from models import Usuario, Recurso, Sala, SalaRecurso, Reserva
from auth import generate_token, auth_required, admin_required

main_bp = Blueprint('main', __name__)


@main_bp.route('/usuarios', methods=['POST'])
def cadastrar_usuario():
    dados = request.json
    if not dados or 'nome' not in dados or 'login' not in dados or 'senha' not in dados:
        return jsonify({'erro': "Parâmetros 'nome', 'login' e 'senha' são obrigatórios"}), 400

    papel = dados.get('papel', 'comum')
    if papel == 'admin':
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'erro': 'Apenas administradores podem criar administradores.'}), 403

        token = auth_header.split(' ', 1)[1]
        requestor = None
        from auth import verify_token
        requestor = verify_token(token)
        if not requestor or requestor.get('papel') != 'admin':
            return jsonify({'erro': 'Apenas administradores podem criar administradores.'}), 403

    if Usuario.query.filter((Usuario.nome == dados['nome']) | (Usuario.login == dados['login'])).first():
        return jsonify({'erro': 'Nome ou login já existe.'}), 409

    usuario = Usuario(
        nome=dados['nome'],
        login=dados['login'],
        senha=generate_password_hash(dados['senha']),
        papel=papel
    )

    db.session.add(usuario)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'erro': 'Nome ou login já existe.'}), 409

    return jsonify({'id': usuario.id, 'nome': usuario.nome, 'login': usuario.login, 'papel': usuario.papel}), 201


@main_bp.route('/usuarios', methods=['GET'])
@admin_required
def listar_usuarios():
    usuarios = Usuario.query.with_entities(Usuario.id, Usuario.nome, Usuario.login, Usuario.papel).all()
    return jsonify([{
        'id': u.id,
        'nome': u.nome,
        'login': u.login,
        'papel': u.papel
    } for u in usuarios]), 200


@main_bp.route('/login', methods=['POST'])
def login_usuario():
    dados = request.json
    if not dados or 'login' not in dados or 'senha' not in dados:
        return jsonify({'erro': 'Login e senha são obrigatórios.'}), 400

    user = Usuario.query.filter_by(login=dados['login']).first()
    if not user or not check_password_hash(user.senha, dados['senha']):
        return jsonify({'erro': 'Login ou senha inválidos.'}), 401

    token = generate_token(user.id, user.papel)
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'nome': user.nome,
            'login': user.login,
            'papel': user.papel
        }
    }), 200


@main_bp.route('/me', methods=['GET'])
@auth_required
def me():
    user = Usuario.query.with_entities(Usuario.id, Usuario.nome, Usuario.login, Usuario.papel).filter_by(id=request.user['id']).first()
    if not user:
        return jsonify({'erro': 'Usuário não encontrado.'}), 404

    return jsonify({'id': user.id, 'nome': user.nome, 'login': user.login, 'papel': user.papel}), 200


@main_bp.route('/usuarios/<int:id>/promover', methods=['POST'])
@admin_required
def promover_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({'erro': 'Usuário não encontrado.'}), 404

    usuario.papel = 'admin'
    db.session.commit()
    return jsonify({'mensagem': 'Usuário promovido a administrador com sucesso.'}), 200


@main_bp.route('/recursos', methods=['POST'])
@admin_required
def cadastrar_recurso():
    dados = request.json
    if not dados or 'nome' not in dados:
        return jsonify({'erro': "Parâmetro 'nome' é obrigatório"}), 400

    recurso = Recurso(nome=dados['nome'])
    db.session.add(recurso)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'erro': 'Recurso com esse nome já existe'}), 409

    return jsonify({'id': recurso.id, 'nome': recurso.nome}), 201


@main_bp.route('/recursos', methods=['GET'])
def listar_recursos():
    recursos = Recurso.query.with_entities(Recurso.id, Recurso.nome).all()
    return jsonify([{'id': r.id, 'nome': r.nome} for r in recursos]), 200


@main_bp.route('/recursos/<int:id>', methods=['DELETE'])
@admin_required
def deletar_recurso(id):
    recurso = Recurso.query.get(id)
    if not recurso:
        return jsonify({'erro': 'Recurso não encontrado'}), 404

    db.session.delete(recurso)
    db.session.commit()
    return jsonify({'mensagem': 'Recurso removido com sucesso'}), 200


@main_bp.route('/salas', methods=['GET'])
def listar_salas():
    salas = Sala.query.with_entities(Sala.id, Sala.nome, Sala.capacidade).all()
    return jsonify([{'id': s.id, 'nome': s.nome, 'capacidade': s.capacidade} for s in salas]), 200


@main_bp.route('/salas/<int:id>', methods=['GET'])
def detalhes_sala(id):
    sala = Sala.query.get(id)
    if not sala:
        return jsonify({'erro': 'Sala não encontrada'}), 404

    return jsonify({
        'id': sala.id,
        'nome': sala.nome,
        'capacidade': sala.capacidade,
        'recursos': [re.nome for re in sala.recursos]
    }), 200


@main_bp.route('/salas', methods=['POST'])
@admin_required
def cadastrar_sala():
    dados = request.json
    if not dados or 'nome' not in dados or 'capacidade' not in dados:
        return jsonify({'erro': 'Parâmetros obrigatórios faltando'}), 400

    sala = Sala(nome=dados['nome'], capacidade=dados['capacidade'])
    db.session.add(sala)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({'erro': 'Sala duplicada. Uma sala com esse nome já existe.'}), 409

    recursos_ids = dados.get('recursos_ids', [])
    for rec_id in recursos_ids:
        sala_rec = SalaRecurso(sala_id=sala.id, recurso_id=rec_id)
        db.session.add(sala_rec)

    db.session.commit()
    return jsonify({'id': sala.id, 'nome': sala.nome, 'capacidade': sala.capacidade}), 201


@main_bp.route('/salas/<int:id>', methods=['PUT'])
@admin_required
def atualizar_sala(id):
    dados = request.json
    if not dados or 'nome' not in dados or 'capacidade' not in dados:
        return jsonify({'erro': 'Parâmetros obrigatórios faltando'}), 400

    sala = Sala.query.get(id)
    if not sala:
        return jsonify({'erro': 'Sala não encontrada'}), 404

    sala.nome = dados['nome']
    sala.capacidade = dados['capacidade']

    if 'recursos_ids' in dados:
        sala.recursos = Recurso.query.filter(Recurso.id.in_(dados['recursos_ids'])).all()

    db.session.commit()
    return jsonify({'mensagem': 'Sala atualizada com sucesso'}), 200


@main_bp.route('/salas/<int:id>', methods=['DELETE'])
@admin_required
def deletar_sala(id):
    sala = Sala.query.get(id)
    if not sala:
        return jsonify({'erro': 'Sala não encontrada'}), 404

    db.session.delete(sala)
    db.session.commit()
    return jsonify({'mensagem': 'Sala removida com sucesso'}), 200


@main_bp.route('/salas/<int:id>/disponibilidade', methods=['GET'])
def verificar_disponibilidade(id):
    data_buscada = request.args.get('data')
    if not data_buscada:
        return jsonify({'erro': "O parâmetro 'data' (YYYY-MM-DD) é obrigatório"}), 400

    reservas_do_dia = Reserva.query.filter_by(sala_id=id, data=data_buscada).all()
    horarios_ocupados = [{'inicio': r.horario_inicio, 'fim': r.horario_fim} for r in reservas_do_dia]
    return jsonify({'sala_id': id, 'data': data_buscada, 'horarios_ocupados': horarios_ocupados}), 200


def _conflito_de_horario(inicio_novo_str, fim_novo_str, reservas_existentes):
    FMT = '%H:%M'
    inicio_novo = datetime.strptime(inicio_novo_str, FMT).time()
    fim_novo = datetime.strptime(fim_novo_str, FMT).time()

    if inicio_novo >= fim_novo:
        return True

    for r in reservas_existentes:
        inicio_r = datetime.strptime(r.horario_inicio, FMT).time()
        fim_r = datetime.strptime(r.horario_fim, FMT).time()
        if inicio_novo < fim_r and fim_novo > inicio_r:
            return True
    return False


@main_bp.route('/reservas', methods=['POST'])
@auth_required
def realizar_reserva():
    dados = request.json
    campos = ['sala_id', 'data', 'horario_inicio', 'horario_fim']
    if not dados or not all(c in dados for c in campos):
        return jsonify({'erro': 'Dados obrigatórios faltando'}), 400

    sala = Sala.query.get(dados['sala_id'])
    if not sala:
        return jsonify({'erro': 'Sala informada não existe no banco'}), 404

    try:
        data_reserva = datetime.strptime(dados['data'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'erro': 'Formato de data inválido. Use YYYY-MM-DD.'}), 400

    if data_reserva < datetime.today().date():
        return jsonify({'erro': 'Não é possível reservar para uma data passada.'}), 400

    reservas_da_sala_no_dia = Reserva.query.filter_by(sala_id=dados['sala_id'], data=dados['data']).all()
    if _conflito_de_horario(dados['horario_inicio'], dados['horario_fim'], reservas_da_sala_no_dia):
        return jsonify({'erro': 'Conflito de horário. A sala já possui reserva neste período.'}), 409

    reserva = Reserva(
        sala_id=dados['sala_id'],
        usuario_id=request.user['id'],
        data=dados['data'],
        horario_inicio=dados['horario_inicio'],
        horario_fim=dados['horario_fim']
    )
    db.session.add(reserva)
    db.session.commit()

    return jsonify({
        'id': reserva.id,
        'sala_id': reserva.sala_id,
        'usuario_id': reserva.usuario_id,
        'data': reserva.data,
        'horario_inicio': reserva.horario_inicio,
        'horario_fim': reserva.horario_fim
    }), 201


@main_bp.route('/reservas', methods=['GET'])
@auth_required
def listar_minhas_reservas():
    usuario_id = request.args.get('usuario_id')
    if usuario_id:
        if request.user['papel'] != 'admin' and int(usuario_id) != request.user['id']:
            return jsonify({'erro': 'Acesso negado.'}), 403
    else:
        usuario_id = request.user['id']

    reservas = Reserva.query.filter_by(usuario_id=usuario_id).all()
    return jsonify([{
        'id': r.id,
        'sala_id': r.sala_id,
        'usuario_id': r.usuario_id,
        'data': r.data,
        'horario_inicio': r.horario_inicio,
        'horario_fim': r.horario_fim
    } for r in reservas]), 200


@main_bp.route('/reservas/<int:id>', methods=['DELETE'])
@auth_required
def cancelar_reserva(id):
    reserva = Reserva.query.get(id)
    if not reserva:
        return jsonify({'erro': 'Reserva não encontrada'}), 404

    if request.user['papel'] != 'admin' and reserva.usuario_id != request.user['id']:
        return jsonify({'erro': 'Apenas o dono da reserva ou um admin pode cancelar.'}), 403

    db.session.delete(reserva)
    db.session.commit()
    return jsonify({'mensagem': 'Reserva cancelada com sucesso'}), 200


@main_bp.route('/reservas/todas', methods=['GET'])
@admin_required
def listar_todas_reservas():
    reservas = Reserva.query.all()
    return jsonify([{
        'id': r.id,
        'sala_id': r.sala_id,
        'usuario_id': r.usuario_id,
        'data': r.data,
        'horario_inicio': r.horario_inicio,
        'horario_fim': r.horario_fim
    } for r in reservas]), 200
