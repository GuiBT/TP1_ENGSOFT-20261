from itsdangerous import URLSafeTimedSerializer as Serializer, BadSignature, SignatureExpired
from flask import request, jsonify
from functools import wraps
from config import Config


def generate_token(user_id, papel):
    serializer = Serializer(Config.SECRET_KEY)
    token = serializer.dumps({"id": user_id, "papel": papel})
    return token.decode('utf-8') if isinstance(token, bytes) else token


def verify_token(token, max_age=3600):
    serializer = Serializer(Config.SECRET_KEY)
    try:
        return serializer.loads(token, max_age=max_age)
    except SignatureExpired:
        return None
    except BadSignature:
        return None


def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({"erro": "Token de autenticação ausente ou inválido."}), 401

        token = auth_header.split(' ', 1)[1]
        user = verify_token(token)
        if not user:
            return jsonify({"erro": "Token inválido ou expirado."}), 401

        request.user = user
        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    @wraps(f)
    @auth_required
    def wrapper(*args, **kwargs):
        if request.user.get('papel') != 'admin':
            return jsonify({"erro": "Apenas administradores podem acessar este recurso."}), 403
        return f(*args, **kwargs)
    return wrapper


def room_admin_required(f):
    @wraps(f)
    @auth_required
    def wrapper(*args, **kwargs):
        if request.user.get('papel') not in ('admin', 'room_admin'):
            return jsonify({"erro": "Apenas administradores de salas podem acessar este recurso."}), 403
        return f(*args, **kwargs)
    return wrapper
