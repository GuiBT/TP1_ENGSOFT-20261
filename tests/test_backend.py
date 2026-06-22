import pytest
from werkzeug.security import generate_password_hash


# ── Helpers ───────────────────────────────────────────────────────────────────

def login(client, login_val, senha):
    response = client.post('/login', json={'login': login_val, 'senha': senha})
    assert response.status_code == 200
    data = response.get_json()
    return data['token'], data['user']


def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}


def json_headers(token):
    return {**auth_headers(token), 'Content-Type': 'application/json'}


# ── Autenticação e autorização ────────────────────────────────────────────────

def test_login_admin_success(client):
    token, user = login(client, 'admin', 'admin123')
    assert user['nome'] == 'admin'
    assert user['papel'] == 'admin'
    assert token


def test_login_missing_fields(client):
    response = client.post('/login', json={})
    assert response.status_code == 400
    assert 'erro' in response.get_json()


def test_login_wrong_password(client):
    response = client.post('/login', json={'login': 'admin', 'senha': 'errada'})
    assert response.status_code == 401
    assert 'erro' in response.get_json()


def test_protected_route_requires_token(client):
    response = client.get('/usuarios')
    assert response.status_code == 401
    assert response.get_json()['erro']


def test_invalid_token_returns_401(client):
    response = client.get('/me', headers={'Authorization': 'Bearer token_invalido'})
    assert response.status_code == 401


# ── Usuários — CRUD e controle de acesso ──────────────────────────────────────

def test_register_user_without_token(client):
    response = client.post('/usuarios', json={
        'nome': 'Joao Teste',
        'login': 'joao',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    assert response.get_json()['login'] == 'joao'


def test_register_missing_fields(client):
    response = client.post('/usuarios', json={'nome': 'sem_login'})
    assert response.status_code == 400
    assert 'erro' in response.get_json()


def test_register_duplicate_login(client):
    response = client.post('/usuarios', json={'nome': 'duplicado', 'login': 'admin', 'senha': 'qualquer'})
    assert response.status_code == 409


def test_create_admin_requires_admin_token(client):
    response = client.post('/usuarios', json={
        'nome': 'Admin2',
        'login': 'admin2',
        'senha': 'senha123',
        'papel': 'admin'
    })
    assert response.status_code == 403


def test_admin_can_create_room_admin(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.post('/usuarios', headers=json_headers(token), json={
        'nome': 'roomadmin',
        'login': 'roomadmin',
        'senha': 'senha123',
        'papel': 'room_admin'
    })
    assert response.status_code == 201
    assert response.get_json()['papel'] == 'room_admin'


def test_regular_user_cannot_create_room_admin(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/usuarios', headers=json_headers(token), json={
        'nome': 'roomadmin2',
        'login': 'roomadmin2',
        'senha': 'senha123',
        'papel': 'room_admin'
    })
    assert response.status_code == 403


def test_admin_can_list_users(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.get('/usuarios', headers=auth_headers(token))
    assert response.status_code == 200
    assert any(u['login'] == 'admin' for u in response.get_json())


def test_common_user_cannot_list_users(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.get('/usuarios', headers=auth_headers(token))
    assert response.status_code == 403


def test_admin_can_promote_and_demote_user(client):
    response = client.post('/usuarios', json={
        'nome': 'Usuario Temp',
        'login': 'tempuser',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    user = response.get_json()

    token, _ = login(client, 'admin', 'admin123')
    assert client.post(f"/usuarios/{user['id']}/promover", headers=auth_headers(token)).status_code == 200
    assert client.post(f"/usuarios/{user['id']}/demote", headers=auth_headers(token)).status_code == 200


def test_admin_cannot_promote_nonexistent_user(client):
    token, _ = login(client, 'admin', 'admin123')
    assert client.post('/usuarios/99999/promover', headers=auth_headers(token)).status_code == 404


def test_admin_cannot_demote_self(client):
    token, user = login(client, 'admin', 'admin123')
    response = client.post(f"/usuarios/{user['id']}/demote", headers=auth_headers(token))
    assert response.status_code == 400
    assert response.get_json()['erro'] == 'Administradores não podem se despromover.'


def test_admin_cannot_demote_nonexistent_user(client):
    token, _ = login(client, 'admin', 'admin123')
    assert client.post('/usuarios/99999/demote', headers=auth_headers(token)).status_code == 404


def test_admin_cannot_demote_common_user(client):
    client.post('/usuarios', json={
        'nome': 'common_for_demote',
        'login': 'common_for_demote',
        'senha': '1234'
    })
    token, _ = login(client, 'admin', 'admin123')
    usuarios = client.get('/usuarios', headers=auth_headers(token)).get_json()
    user = next(u for u in usuarios if u['login'] == 'common_for_demote')
    response = client.post(f"/usuarios/{user['id']}/demote", headers=auth_headers(token))
    assert response.status_code == 400
    assert 'não é um administrador' in response.get_json()['erro']


def test_admin_can_delete_user(client):
    response = client.post('/usuarios', json={
        'nome': 'Usuario Remover',
        'login': 'removeuser',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    user = response.get_json()

    token, _ = login(client, 'admin', 'admin123')
    assert client.delete(f"/usuarios/{user['id']}", headers=auth_headers(token)).status_code == 200


def test_admin_cannot_delete_self(client):
    token, user = login(client, 'admin', 'admin123')
    response = client.delete(f"/usuarios/{user['id']}", headers=auth_headers(token))
    assert response.status_code == 400
    assert response.get_json()['erro'] == 'Administradores não podem excluir a si mesmos.'


def test_admin_cannot_delete_nonexistent_user(client):
    token, _ = login(client, 'admin', 'admin123')
    assert client.delete('/usuarios/99999', headers=auth_headers(token)).status_code == 404


# ── Perfil (/me) ──────────────────────────────────────────────────────────────

def test_get_me(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.get('/me', headers=auth_headers(token))
    assert response.status_code == 200
    data = response.get_json()
    assert data['login'] == 'admin'
    assert data['papel'] == 'admin'


def test_user_can_update_own_profile(client):
    client.post('/usuarios', json={
        'nome': 'usuario_temp',
        'login': 'usuario_temp',
        'senha': 'senha123'
    })
    token, user = login(client, 'usuario_temp', 'senha123')
    response = client.put('/me', headers=json_headers(token), json={
        'nome': 'Usuario Atualizado',
        'login': 'usuario_novo',
        'senha': 'novaSenha123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['nome'] == 'Usuario Atualizado'
    assert data['login'] == 'usuario_novo'

    new_token, new_user = login(client, 'usuario_novo', 'novaSenha123')
    assert new_user['nome'] == 'Usuario Atualizado'


def test_user_cannot_update_to_existing_login(client):
    client.post('/usuarios', json={
        'nome': 'usuario_temp2',
        'login': 'usuario_temp2',
        'senha': 'senha123'
    })
    token, _ = login(client, 'usuario_temp2', 'senha123')
    response = client.put('/me', headers=json_headers(token), json={'login': 'admin'})
    assert response.status_code == 409
    assert 'Login já em uso' in response.get_json()['erro']


def test_update_me_no_data(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.put('/me',
                          headers={**auth_headers(token), 'Content-Type': 'application/json'},
                          data='null',
                          content_type='application/json')
    assert response.status_code == 400


# ── Recursos ──────────────────────────────────────────────────────────────────

def test_list_recursos(client):
    response = client.get('/recursos')
    assert response.status_code == 200
    assert any(r['nome'] == 'Projetor' for r in response.get_json())


def test_room_admin_can_create_and_delete_recurso(client):
    token, _ = login(client, 'gerente_salas', '1234')
    create_res = client.post('/recursos', headers=json_headers(token), json={'nome': 'Recurso Temporário'})
    assert create_res.status_code == 201
    recurso_id = create_res.get_json()['id']

    assert client.delete(f'/recursos/{recurso_id}', headers=auth_headers(token)).status_code == 200


def test_create_recurso_missing_fields(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.post('/recursos', headers=json_headers(token), json={}).status_code == 400


def test_delete_recurso_not_found(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.delete('/recursos/99999', headers=auth_headers(token)).status_code == 404


def test_common_user_cannot_access_room_admin_route(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/recursos', headers=json_headers(token), json={'nome': 'Recurso Bloqueado'})
    assert response.status_code == 403


# ── Salas ─────────────────────────────────────────────────────────────────────

def test_list_salas(client):
    response = client.get('/salas')
    assert response.status_code == 200
    assert any(s['nome'] == 'Sala 101' for s in response.get_json())


def test_get_sala_detail(client):
    response = client.get('/salas/1')
    assert response.status_code == 200
    data = response.get_json()
    assert data['nome'] == 'Sala 101'
    assert data['capacidade'] == 30
    assert 'recursos' in data


def test_get_sala_not_found(client):
    assert client.get('/salas/99999').status_code == 404


def test_admin_can_create_room(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.post('/salas', headers=json_headers(token), json={
        'nome': 'Sala de Teste',
        'capacidade': 10,
        'recursos_ids': []
    })
    assert response.status_code == 201
    assert response.get_json()['nome'] == 'Sala de Teste'


def test_create_sala_missing_fields(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.post('/salas', headers=json_headers(token), json={'nome': 'sem capacidade'}).status_code == 400


def test_create_sala_with_recursos(client):
    token, _ = login(client, 'gerente_salas', '1234')
    response = client.post('/salas', headers=json_headers(token), json={
        'nome': 'Sala Com Recursos Extra',
        'capacidade': 10,
        'recursos_ids': [1, 2]
    })
    assert response.status_code == 201
    assert response.get_json()['nome'] == 'Sala Com Recursos Extra'


def test_room_admin_can_manage_sala_and_list_all_reservas(client):
    token_admin, _ = login(client, 'admin', 'admin123')
    client.post('/usuarios', headers=json_headers(token_admin), json={
        'nome': 'roomadminx',
        'login': 'roomadminx',
        'senha': 'senha123',
        'papel': 'room_admin'
    })

    token_ra, _ = login(client, 'roomadminx', 'senha123')
    assert client.post('/salas', headers=json_headers(token_ra), json={
        'nome': 'Sala Room Admin',
        'capacidade': 5,
        'recursos_ids': []
    }).status_code == 201

    assert client.get('/reservas/todas', headers=auth_headers(token_ra)).status_code == 200


def test_room_admin_can_update_sala(client):
    token, _ = login(client, 'gerente_salas', '1234')
    response = client.put('/salas/1', headers=json_headers(token), json={
        'nome': 'Sala 101',
        'capacidade': 30,
        'recursos_ids': [1, 2, 4]
    })
    assert response.status_code == 200


def test_update_sala_missing_fields(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.put('/salas/1', headers=json_headers(token), json={}).status_code == 400


def test_update_sala_not_found(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.put('/salas/99999', headers=json_headers(token), json={
        'nome': 'X', 'capacidade': 5
    }).status_code == 404


def test_room_admin_can_create_and_delete_sala(client):
    token, _ = login(client, 'gerente_salas', '1234')
    create_res = client.post('/salas', headers=json_headers(token), json={
        'nome': 'Sala Para Deletar',
        'capacidade': 5,
        'recursos_ids': []
    })
    assert create_res.status_code == 201
    sala_id = create_res.get_json()['id']

    assert client.delete(f'/salas/{sala_id}', headers=auth_headers(token)).status_code == 200


def test_delete_sala_not_found(client):
    token, _ = login(client, 'gerente_salas', '1234')
    assert client.delete('/salas/99999', headers=auth_headers(token)).status_code == 404


# ── Disponibilidade de salas ──────────────────────────────────────────────────

def test_busca_disponibilidade_sem_recursos(client):
    response = client.get('/salas/disponiveis?data=2026-03-25&horario_inicio=09:00&horario_fim=10:00')
    assert response.status_code == 200
    salas = response.get_json()
    assert any(s['nome'] == 'Sala 101' for s in salas)
    assert any(s['nome'] == 'Laboratório de Informática' for s in salas)


def test_busca_disponibilidade_com_conflito(client):
    # Sala 101 tem reserva em 2026-03-25 das 14:00-16:00 (criada no conftest)
    response = client.get('/salas/disponiveis?data=2026-03-25&horario_inicio=14:30&horario_fim=15:00')
    assert response.status_code == 200
    salas = response.get_json()
    assert not any(s['nome'] == 'Sala 101' for s in salas)
    assert any(s['nome'] == 'Laboratório de Informática' for s in salas)


def test_busca_disponibilidade_por_recursos(client):
    response = client.get('/salas/disponiveis?data=2026-03-25&horario_inicio=14:30&horario_fim=15:00&recursos_ids=3')
    assert response.status_code == 200
    salas = response.get_json()
    assert len(salas) == 1
    assert salas[0]['nome'] == 'Laboratório de Informática'


def test_busca_disponibilidade_missing_params(client):
    assert client.get('/salas/disponiveis?data=2026-09-01').status_code == 400


def test_busca_disponibilidade_horario_invalido(client):
    assert client.get(
        '/salas/disponiveis?data=2026-09-01&horario_inicio=16:00&horario_fim=09:00'
    ).status_code == 400


def test_verificar_disponibilidade_sala(client):
    response = client.get('/salas/1/disponibilidade?data=2026-03-25')
    assert response.status_code == 200
    data = response.get_json()
    assert data['sala_id'] == 1
    assert len(data['horarios_ocupados']) > 0


def test_disponibilidade_sala_missing_data_param(client):
    assert client.get('/salas/1/disponibilidade').status_code == 400


# ── Reservas ──────────────────────────────────────────────────────────────────

def test_user_can_create_reservation(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers=json_headers(token), json={
        'sala_id': 2,
        'data': '2026-12-15',
        'horario_inicio': '09:00',
        'horario_fim': '10:00'
    })
    assert response.status_code == 201
    assert response.get_json()['usuario_id'] == 2


def test_create_reservation_missing_fields(client):
    token, _ = login(client, 'pedro', '1234')
    assert client.post('/reservas', headers=json_headers(token), json={'sala_id': 1}).status_code == 400


def test_create_reservation_sala_not_found(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers=json_headers(token), json={
        'sala_id': 99999,
        'data': '2026-12-20',
        'horario_inicio': '10:00',
        'horario_fim': '11:00'
    })
    assert response.status_code == 404


def test_create_reservation_past_date(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers=json_headers(token), json={
        'sala_id': 1,
        'data': '2025-01-01',
        'horario_inicio': '10:00',
        'horario_fim': '11:00'
    })
    assert response.status_code == 400
    assert 'passada' in response.get_json()['erro']


def test_create_reservation_invalid_date_format(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers=json_headers(token), json={
        'sala_id': 1,
        'data': '25/12/2026',
        'horario_inicio': '10:00',
        'horario_fim': '11:00'
    })
    assert response.status_code == 400
    assert 'data inválido' in response.get_json()['erro']


def test_create_reservation_horario_conflict(client):
    token_pedro, _ = login(client, 'pedro', '1234')
    client.post('/reservas', headers=json_headers(token_pedro), json={
        'sala_id': 1,
        'data': '2026-12-28',
        'horario_inicio': '10:00',
        'horario_fim': '12:00'
    })
    token_maria, _ = login(client, 'maria', '1234')
    response = client.post('/reservas', headers=json_headers(token_maria), json={
        'sala_id': 1,
        'data': '2026-12-28',
        'horario_inicio': '11:00',
        'horario_fim': '13:00'
    })
    assert response.status_code == 409
    assert 'Conflito' in response.get_json()['erro']


def test_user_can_list_own_reservations(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.get('/reservas', headers=auth_headers(token))
    assert response.status_code == 200
    assert any(r['usuario_id'] == 2 for r in response.get_json())


def test_listar_reservas_denied_for_other_user(client):
    token_pedro, _ = login(client, 'pedro', '1234')
    _, user_maria = login(client, 'maria', '1234')
    response = client.get(f'/reservas?usuario_id={user_maria["id"]}', headers=auth_headers(token_pedro))
    assert response.status_code == 403


def test_user_can_cancel_own_reservation(client):
    token, _ = login(client, 'pedro', '1234')
    create_res = client.post('/reservas', headers=json_headers(token), json={
        'sala_id': 2,
        'data': '2026-11-10',
        'horario_inicio': '08:00',
        'horario_fim': '09:00'
    })
    assert create_res.status_code == 201
    reserva_id = create_res.get_json()['id']

    assert client.delete(f'/reservas/{reserva_id}', headers=auth_headers(token)).status_code == 200


def test_cancel_reservation_not_found(client):
    token, _ = login(client, 'pedro', '1234')
    assert client.delete('/reservas/99999', headers=auth_headers(token)).status_code == 404


def test_cancel_reservation_denied_for_other_user(client):
    token_pedro, _ = login(client, 'pedro', '1234')
    create_res = client.post('/reservas', headers=json_headers(token_pedro), json={
        'sala_id': 2,
        'data': '2026-11-20',
        'horario_inicio': '08:00',
        'horario_fim': '09:00'
    })
    assert create_res.status_code == 201
    reserva_id = create_res.get_json()['id']

    token_maria, _ = login(client, 'maria', '1234')
    assert client.delete(f'/reservas/{reserva_id}', headers=auth_headers(token_maria)).status_code == 403


def test_admin_can_filter_reservations_by_date(client):
    token_user, _ = login(client, 'pedro', '1234')
    client.post('/reservas', headers=json_headers(token_user), json={
        'sala_id': 2,
        'data': '2026-07-01',
        'horario_inicio': '10:00',
        'horario_fim': '11:00'
    })
    token_admin, _ = login(client, 'admin', 'admin123')
    filter_res = client.get('/reservas/todas?data=2026-07-01', headers=auth_headers(token_admin))
    assert filter_res.status_code == 200
    reservas = filter_res.get_json()
    assert all(r['data'] == '2026-07-01' for r in reservas)
    assert any(r['usuario_id'] == 2 for r in reservas)


def test_admin_can_filter_reservations_by_room(client):
    token_user, _ = login(client, 'pedro', '1234')
    client.post('/reservas', headers=json_headers(token_user), json={
        'sala_id': 1,
        'data': '2026-07-02',
        'horario_inicio': '14:00',
        'horario_fim': '15:00'
    })
    token_admin, _ = login(client, 'admin', 'admin123')
    filter_res = client.get('/reservas/todas?sala_id=1', headers=auth_headers(token_admin))
    assert filter_res.status_code == 200
    reservas = filter_res.get_json()
    assert all(r['sala_id'] == 1 for r in reservas)
    assert any(r['data'] == '2026-07-02' for r in reservas)


def test_listar_todas_reservas_invalid_sala_id(client):
    token, _ = login(client, 'admin', 'admin123')
    assert client.get('/reservas/todas?sala_id=abc', headers=auth_headers(token)).status_code == 400
