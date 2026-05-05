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

        admin = Usuario(nome='Admin Geral', login='admin', senha=generate_password_hash('admin123'), papel='admin')
        room_admin1 = Usuario(nome='Gerente de Salas 1', login='room_admin1', senha=generate_password_hash('1234'), papel='room_admin')
        room_admin2 = Usuario(nome='Gerente de Salas 2', login='room_admin2', senha=generate_password_hash('1234'), papel='room_admin')

        user1 = Usuario(nome='Pedro', login='pedro', senha=generate_password_hash('1234'), papel='comum')
        user2 = Usuario(nome='Maria', login='maria', senha=generate_password_hash('1234'), papel='comum')
        user3 = Usuario(nome='João', login='joao', senha=generate_password_hash('1234'), papel='comum')
        user4 = Usuario(nome='Ana', login='ana', senha=generate_password_hash('1234'), papel='comum')
        user5 = Usuario(nome='Lucas', login='lucas', senha=generate_password_hash('1234'), papel='comum')

        projetor = Recurso(nome='Projetor')
        ar = Recurso(nome='Ar Condicionado')
        computadores = Recurso(nome='Computadores')
        quadro = Recurso(nome='Quadro Branco')
        videoconferencia = Recurso(nome='Videoconferência')

        sala1 = Sala(nome='Sala 101', capacidade=30)
        sala2 = Sala(nome='Laboratório de Informática', capacidade=20)
        sala3 = Sala(nome='Sala de Reuniões', capacidade=12)
        sala4 = Sala(nome='Sala 102', capacidade=25)
        sala5 = Sala(nome='Sala 103', capacidade=18)
        sala6 = Sala(nome='Sala 104', capacidade=22)
        sala7 = Sala(nome='Sala 105', capacidade=16)
        sala8 = Sala(nome='Sala 106', capacidade=28)
        sala9 = Sala(nome='Sala 201', capacidade=20)
        sala10 = Sala(nome='Sala 202', capacidade=24)
        sala11 = Sala(nome='Sala 203', capacidade=14)
        sala12 = Sala(nome='Sala 204', capacidade=26)
        sala13 = Sala(nome='Sala 205', capacidade=30)
        sala14 = Sala(nome='Sala 301', capacidade=18)
        sala15 = Sala(nome='Sala 302', capacidade=16)
        sala16 = Sala(nome='Sala 303', capacidade=20)
        sala17 = Sala(nome='Sala Plena', capacidade=12)
        sala18 = Sala(nome='Sala Multiuso', capacidade=40)

        db.session.add_all([
            admin, room_admin1, room_admin2,
            user1, user2, user3, user4, user5,
            projetor, ar, computadores, quadro, videoconferencia,
            sala1, sala2, sala3, sala4, sala5, sala6, sala7, sala8, sala9, sala10,
            sala11, sala12, sala13, sala14, sala15, sala16, sala17, sala18
        ])
        db.session.commit()

        sala1.recursos.extend([projetor, ar, quadro])
        sala2.recursos.extend([computadores, projetor, ar])
        sala3.recursos.extend([videoconferencia, ar, quadro])
        sala4.recursos.extend([projetor, ar])
        sala5.recursos.extend([computadores, quadro])
        sala6.recursos.extend([ar, quadro])
        sala7.recursos.extend([projetor, videoconferencia])
        sala8.recursos.extend([computadores, ar])
        sala9.recursos.extend([projetor, quadro])
        sala10.recursos.extend([ar, videoconferencia])
        sala11.recursos.extend([computadores, projetor])
        sala12.recursos.extend([ar, quadro])
        sala13.recursos.extend([videoconferencia, ar])
        sala14.recursos.extend([projetor, computadores])
        sala15.recursos.extend([ar, quadro])
        sala16.recursos.extend([projetor, ar])
        sala17.recursos.extend([quadro, videoconferencia])
        sala18.recursos.extend([projetor, computadores, ar])

        db.session.commit()

        reservas = [
            Reserva(sala_id=sala1.id, usuario_id=user1.id, data='2026-05-01', horario_inicio='09:00', horario_fim='10:30'),
            Reserva(sala_id=sala1.id, usuario_id=user2.id, data='2026-05-02', horario_inicio='11:00', horario_fim='12:00'),
            Reserva(sala_id=sala2.id, usuario_id=user3.id, data='2026-05-03', horario_inicio='13:00', horario_fim='14:30'),
            Reserva(sala_id=sala3.id, usuario_id=user4.id, data='2026-05-04', horario_inicio='10:00', horario_fim='11:00'),
            Reserva(sala_id=sala1.id, usuario_id=user5.id, data='2026-05-05', horario_inicio='14:00', horario_fim='15:30'),
            Reserva(sala_id=sala2.id, usuario_id=user1.id, data='2026-05-06', horario_inicio='08:00', horario_fim='09:30'),
            Reserva(sala_id=sala3.id, usuario_id=user2.id, data='2026-05-07', horario_inicio='15:00', horario_fim='16:30'),
            Reserva(sala_id=sala1.id, usuario_id=user3.id, data='2026-05-08', horario_inicio='11:30', horario_fim='12:30'),
            Reserva(sala_id=sala2.id, usuario_id=user4.id, data='2026-05-09', horario_inicio='09:00', horario_fim='10:00'),
            Reserva(sala_id=sala3.id, usuario_id=user5.id, data='2026-05-10', horario_inicio='13:00', horario_fim='14:00'),
            Reserva(sala_id=sala1.id, usuario_id=user1.id, data='2026-05-11', horario_inicio='16:00', horario_fim='17:00'),
            Reserva(sala_id=sala2.id, usuario_id=user2.id, data='2026-05-12', horario_inicio='10:00', horario_fim='11:30'),
            Reserva(sala_id=sala3.id, usuario_id=user3.id, data='2026-05-13', horario_inicio='14:30', horario_fim='15:30'),
            Reserva(sala_id=sala1.id, usuario_id=user4.id, data='2026-05-14', horario_inicio='12:00', horario_fim='13:00'),
            Reserva(sala_id=sala2.id, usuario_id=user5.id, data='2026-05-15', horario_inicio='15:00', horario_fim='16:00')
        ]

        extra_dates = [f'2026-05-{day:02d}' for day in range(16, 32)] + [f'2026-06-{day:02d}' for day in range(1, 25)]
        time_slots = [
            ('08:00', '09:00'),
            ('09:30', '10:30'),
            ('11:00', '12:00'),
            ('13:00', '14:00'),
            ('14:30', '15:30'),
            ('16:00', '17:00')
        ]
        rooms = [sala1, sala2, sala3, sala4, sala5, sala6, sala7, sala8, sala9, sala10, sala11, sala12, sala13, sala14, sala15, sala16, sala17, sala18]
        users = [user1, user2, user3, user4, user5]

        for idx, date in enumerate(extra_dates[:40]):
            room = rooms[idx % len(rooms)]
            user = users[idx % len(users)]
            start, end = time_slots[idx % len(time_slots)]
            reservas.append(Reserva(sala_id=room.id, usuario_id=user.id, data=date, horario_inicio=start, horario_fim=end))

        db.session.add_all(reservas)
        db.session.commit()

        print('Banco de dados inicializado e preenchido com seed.')


if __name__ == '__main__':
    init_db()
