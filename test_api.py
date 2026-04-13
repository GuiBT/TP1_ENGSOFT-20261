import json
from app import app
cliente = app.test_client()

def faz_requisicao(metodo, rota, dados=None):
    print(f'\n--- {metodo} {rota} ---')
    if dados:
        print(f'Enviando: {dados}')
        res = cliente.open(rota, method=metodo, json=dados)
    else:
        res = cliente.open(rota, method=metodo)
    status = res.status_code
    try:
        corpo = res.get_json()
        print(f'Status: {status} | Resposta: {json.dumps(corpo, indent=2, ensure_ascii=False)}')
    except:
        print(f"Status: {status} | Resposta: {res.data.decode('utf-8')}")
print('====================================')
print('INICIANDO TESTES (CASOS NORMAIS)')
print('====================================')
faz_requisicao('GET', '/salas')
faz_requisicao('GET', '/salas/1')
faz_requisicao('POST', '/usuarios', {'nome': 'Joãozinho', 'papel': 'comum'})
faz_requisicao('POST', '/salas', {'usuario_req_id': 1, 'nome': 'Laboratório de Robótica', 'capacidade': 15, 'recursos_ids': [3]})
faz_requisicao('POST', '/reservas', {'sala_id': 3, 'usuario_id': 4, 'data': '2026-03-26', 'horario_inicio': '08:00', 'horario_fim': '10:00'})
faz_requisicao('GET', '/reservas?usuario_id=4')
faz_requisicao('DELETE', '/reservas/2')
print('\n====================================')
print('INICIANDO TESTES (EDGE CASES)')
print('====================================')
faz_requisicao('POST', '/usuarios', {'nome': 'Joãozinho', 'papel': 'comum'})
faz_requisicao('POST', '/salas', {'usuario_req_id': 1, 'nome': 'Sala 101', 'capacidade': 50, 'recursos_ids': []})
faz_requisicao('POST', '/salas', {'usuario_req_id': 2, 'nome': 'Sala Privada do Pedro', 'capacidade': 5, 'recursos_ids': []})
faz_requisicao('POST', '/reservas', {'sala_id': 1, 'usuario_id': 3, 'data': '2026-03-25', 'horario_inicio': '15:00', 'horario_fim': '17:00'})
faz_requisicao('POST', '/reservas', {'sala_id': 999, 'usuario_id': 2, 'data': '2026-03-30', 'horario_inicio': '10:00', 'horario_fim': '12:00'})
faz_requisicao('POST', '/reservas', {'sala_id': 1, 'usuario_id': 999, 'data': '2026-03-30', 'horario_inicio': '10:00', 'horario_fim': '12:00'})
print('\nTodos os testes finalizados com sucesso!')