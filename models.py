from database import db


class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), unique=True, nullable=False)
    login = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    papel = db.Column(db.String(50), nullable=False, default='comum')

    reservas = db.relationship('Reserva', back_populates='usuario', cascade='all, delete-orphan')


class Recurso(db.Model):
    __tablename__ = 'recursos'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), unique=True, nullable=False)

    salas = db.relationship('Sala', secondary='sala_recursos', back_populates='recursos')


class Sala(db.Model):
    __tablename__ = 'salas'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), unique=True, nullable=False)
    capacidade = db.Column(db.Integer, nullable=False)

    recursos = db.relationship('Recurso', secondary='sala_recursos', back_populates='salas')
    reservas = db.relationship('Reserva', back_populates='sala', cascade='all, delete-orphan')


class SalaRecurso(db.Model):
    __tablename__ = 'sala_recursos'
    sala_id = db.Column(db.Integer, db.ForeignKey('salas.id', ondelete='CASCADE'), primary_key=True)
    recurso_id = db.Column(db.Integer, db.ForeignKey('recursos.id', ondelete='CASCADE'), primary_key=True)


class Reserva(db.Model):
    __tablename__ = 'reservas'
    id = db.Column(db.Integer, primary_key=True)
    sala_id = db.Column(db.Integer, db.ForeignKey('salas.id', ondelete='CASCADE'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id', ondelete='CASCADE'), nullable=False)
    data = db.Column(db.String(10), nullable=False)
    horario_inicio = db.Column(db.String(5), nullable=False)
    horario_fim = db.Column(db.String(5), nullable=False)

    sala = db.relationship('Sala', back_populates='reservas')
    usuario = db.relationship('Usuario', back_populates='reservas')
