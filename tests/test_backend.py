import pytest


def login(client, login, senha):
    response = client.post('/login', json={
        'login': login,
        'senha': senha
    })
    assert response.status_code == 200
    data = response.get_json()
    return data['token'], data['user']


def auth_headers(token):
    return {'Authorization': f'Bearer {token}'}


def test_login_admin_success(client):
    token, user = login(client, 'admin', 'admin123')
    assert user['nome'] == 'admin'
    assert user['papel'] == 'admin'
    assert token


def test_protected_route_requires_token(client):
    response = client.get('/usuarios')
    assert response.status_code == 401
    assert response.get_json()['erro']


def test_admin_can_list_users(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.get('/usuarios', headers=auth_headers(token))
    assert response.status_code == 200
    users = response.get_json()
    assert any(u['login'] == 'admin' for u in users)


def test_register_user_without_token(client):
    response = client.post('/usuarios', json={
        'nome': 'Joao Teste',
        'login': 'joao',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    assert response.get_json()['login'] == 'joao'


def test_create_admin_requires_admin_token(client):
    response = client.post('/usuarios', json={
        'nome': 'Admin2',
        'login': 'admin2',
        'senha': 'senha123',
        'papel': 'admin'
    })
    assert response.status_code == 403


def test_admin_can_create_room(client):
    token, _ = login(client, 'admin', 'admin123')
    response = client.post('/salas', headers={**auth_headers(token), 'Content-Type': 'application/json'}, json={
        'nome': 'Sala de Teste',
        'capacidade': 10,
        'recursos_ids': []
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['nome'] == 'Sala de Teste'


def test_user_can_create_reservation(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers={**auth_headers(token), 'Content-Type': 'application/json'}, json={
        'sala_id': 2,
        'data': '2026-06-01',
        'horario_inicio': '09:00',
        'horario_fim': '10:00'
    })
    assert response.status_code == 201
    assert response.get_json()['usuario_id'] == 2


def test_user_can_list_own_reservations(client):
    token, _ = login(client, 'pedro', '1234')
    response = client.get('/reservas', headers=auth_headers(token))
    assert response.status_code == 200
    reservas = response.get_json()
    assert any(r['usuario_id'] == 2 for r in reservas)
