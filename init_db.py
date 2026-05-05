from app import create_app
from database import db
from models import Usuario, Recurso, Sala, SalaRecurso, Reserva
from werkzeug.security import generate_password_hash


def init_db():
    app = create_app()
    with app.app_context():
        db.create_all()

        if Usuario.query.first():
            print('Banco de dados já possui registros. Nenhum seed foi aplicado.')
            return

        admin = Usuario(nome='admin', login='admin', senha=generate_password_hash('admin123'), papel='admin')
        pedro = Usuario(nome='pedro', login='pedro', senha=generate_password_hash('1234'), papel='comum')
        maria = Usuario(nome='maria', login='maria', senha=generate_password_hash('1234'), papel='comum')

        projetor = Recurso(nome='Projetor')
        ar = Recurso(nome='Ar Condicionado')
        computadores = Recurso(nome='Computadores')
        quadro = Recurso(nome='Quadro Branco')

        sala1 = Sala(nome='Sala 101', capacidade=30)
        sala2 = Sala(nome='Laboratório de Informática', capacidade=20)

        db.session.add_all([admin, pedro, maria, projetor, ar, computadores, quadro, sala1, sala2])
        db.session.commit()

        sala1.recursos.extend([projetor, ar, quadro])
        sala2.recursos.extend([computadores, projetor, ar])

        reserva = Reserva(sala_id=sala1.id, usuario_id=pedro.id, data='2026-03-25', horario_inicio='14:00', horario_fim='16:00')
        db.session.add(reserva)
        db.session.commit()

        print('Banco de dados inicializado e preenchido com seed.')


if __name__ == '__main__':
    init_db()
