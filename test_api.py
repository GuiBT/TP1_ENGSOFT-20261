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
print('INICIANDO TESTES')
print('====================================')
faz_requisicao('GET', '/salas')
faz_requisicao('GET', '/salas/1')
faz_requisicao('POST', '/usuarios', {'nome': 'Guilherme', 'papel': 'admin'})
faz_requisicao('POST', '/salas', {'usuario_req_id': 1, 'nome': 'Auditório', 'capacidade': 100, 'recursos_ids': [1]})
faz_requisicao('POST', '/reservas', {'sala_id': 1, 'usuario_id': 1, 'data': '2026-04-10', 'horario_inicio': '10:00', 'horario_fim': '12:00'})
faz_requisicao('GET', '/reservas?usuario_id=1')
faz_requisicao('DELETE', '/reservas/1')
print('\nTodos os testes finalizados com sucesso!')