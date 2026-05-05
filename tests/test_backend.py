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


def test_admin_can_promote_and_demote_user(client):
    response = client.post('/usuarios', json={
        'nome': 'Usuario Temp',
        'login': 'tempuser',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    user = response.get_json()

    token, _ = login(client, 'admin', 'admin123')
    promote_res = client.post(f"/usuarios/{user['id']}/promover", headers=auth_headers(token))
    assert promote_res.status_code == 200
    demote_res = client.post(f"/usuarios/{user['id']}/demote", headers=auth_headers(token))
    assert demote_res.status_code == 200


def test_admin_cannot_demote_self(client):
    token, user = login(client, 'admin', 'admin123')
    response = client.post(f"/usuarios/{user['id']}/demote", headers=auth_headers(token))
    assert response.status_code == 400
    assert response.get_json()['erro'] == 'Administradores não podem se despromover.'


def test_admin_can_delete_user(client):
    response = client.post('/usuarios', json={
        'nome': 'Usuario Remover',
        'login': 'removeuser',
        'senha': 'senha123'
    })
    assert response.status_code == 201
    user = response.get_json()

    token, _ = login(client, 'admin', 'admin123')
    delete_res = client.delete(f"/usuarios/{user['id']}", headers=auth_headers(token))
    assert delete_res.status_code == 200


def test_admin_cannot_delete_self(client):
    token, user = login(client, 'admin', 'admin123')
    response = client.delete(f"/usuarios/{user['id']}", headers=auth_headers(token))
    assert response.status_code == 400
    assert response.get_json()['erro'] == 'Administradores não podem excluir a si mesmos.'


def test_user_can_update_own_profile(client):
    response = client.post('/usuarios', json={
        'nome': 'usuario_temp',
        'login': 'usuario_temp',
        'senha': 'senha123'
    })
    assert response.status_code == 201

    token, user = login(client, 'usuario_temp', 'senha123')
    response = client.put('/me', headers={**auth_headers(token), 'Content-Type': 'application/json'}, json={
        'nome': 'Usuario Atualizado',
        'login': 'usuario_novo',
        'senha': 'novaSenha123'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['nome'] == 'Usuario Atualizado'
    assert data['login'] == 'usuario_novo'

    # Login com novo usuário e senha deve funcionar
    new_token, new_user = login(client, 'usuario_novo', 'novaSenha123')
    assert new_user['nome'] == 'Usuario Atualizado'


def test_user_cannot_update_to_existing_login(client):
    response = client.post('/usuarios', json={
        'nome': 'usuario_temp2',
        'login': 'usuario_temp2',
        'senha': 'senha123'
    })
    assert response.status_code == 201

    token, _ = login(client, 'usuario_temp2', 'senha123')
    response = client.put('/me', headers={**auth_headers(token), 'Content-Type': 'application/json'}, json={
        'login': 'admin'
    })
    assert response.status_code == 409
    assert 'Login já em uso' in response.get_json()['erro']


def test_admin_can_filter_reservations_by_date(client):
    token_user, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers={**auth_headers(token_user), 'Content-Type': 'application/json'}, json={
        'sala_id': 2,
        'data': '2026-07-01',
        'horario_inicio': '10:00',
        'horario_fim': '11:00'
    })
    assert response.status_code == 201

    token_admin, _ = login(client, 'admin', 'admin123')
    filter_res = client.get('/reservas/todas?data=2026-07-01', headers=auth_headers(token_admin))
    assert filter_res.status_code == 200
    reservas = filter_res.get_json()
    assert all(r['data'] == '2026-07-01' for r in reservas)
    assert any(r['usuario_id'] == 2 for r in reservas)


def test_admin_can_filter_reservations_by_room(client):
    token_user, _ = login(client, 'pedro', '1234')
    response = client.post('/reservas', headers={**auth_headers(token_user), 'Content-Type': 'application/json'}, json={
        'sala_id': 1,
        'data': '2026-07-02',
        'horario_inicio': '14:00',
        'horario_fim': '15:00'
    })
    assert response.status_code == 201

    token_admin, _ = login(client, 'admin', 'admin123')
    filter_res = client.get('/reservas/todas?sala_id=1', headers=auth_headers(token_admin))
    assert filter_res.status_code == 200
    reservas = filter_res.get_json()
    assert all(r['sala_id'] == 1 for r in reservas)
    assert any(r['data'] == '2026-07-02' for r in reservas)
