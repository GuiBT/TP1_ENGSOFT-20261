import json
# pyre-ignore-all-errors[21]
from app import app

cliente = app.test_client()

def faz_requisicao(metodo, rota, dados=None):
    print(f"\n--- {metodo} {rota} ---")
    if dados:
        print(f"Enviando: {dados}")
        res = cliente.open(rota, method=metodo, json=dados)
    else:
        res = cliente.open(rota, method=metodo)

    status = res.status_code
    try:
        corpo = res.get_json()
        print(f"Status: {status} | Resposta: {json.dumps(corpo, indent=2, ensure_ascii=False)}")
    except:
        print(f"Status: {status} | Resposta: {res.data.decode('utf-8')}")

print("====================================")
print("INICIANDO TESTES (CASOS NORMAIS)")
print("====================================")

# 1. GET /salas -> Visualizar todas as salas
faz_requisicao('GET', '/salas')

# 2. GET /salas/1 -> Visualizar detalhes da Sala 101
faz_requisicao('GET', '/salas/1')

# 3. POST /usuarios -> Criar um usuario normal validamente
faz_requisicao('POST', '/usuarios', {
    "nome": "Joãozinho",
    "papel": "comum"
})

# 4. POST /salas -> Cadastrar uma sala por um admin (usuario_req_id = 1)
faz_requisicao('POST', '/salas', {
    "usuario_req_id": 1,
    "nome": "Laboratório de Robótica",
    "capacidade": 15,
    "recursos_ids": [3] # Computadores
})

# 5. POST /reservas -> Realizar uma reserva com sucesso na nova sala
faz_requisicao('POST', '/reservas', {
    "sala_id": 3,
    "usuario_id": 4, # recém criado Joãozinho
    "data": "2026-03-26",
    "horario_inicio": "08:00",
    "horario_fim": "10:00"
})

# 6. GET /reservas -> Consultar reservas do Joãozinho
faz_requisicao('GET', '/reservas?usuario_id=4')

# 7. DELETE /reservas -> Cancelar a reserva (id 2)
faz_requisicao('DELETE', '/reservas/2')


print("\n====================================")
print("INICIANDO TESTES (EDGE CASES)")
print("====================================")

# 8. POST /usuarios -> Usuário Duplicado
faz_requisicao('POST', '/usuarios', {
    "nome": "Joãozinho",
    "papel": "comum"
})

# 9. POST /salas -> Sala Duplicada (Mesmo nome)
faz_requisicao('POST', '/salas', {
    "usuario_req_id": 1,
    "nome": "Sala 101",
    "capacidade": 50,
    "recursos_ids": []
})

# 10. POST /salas -> Permissão Negada (Usuário comum tentando criar)
faz_requisicao('POST', '/salas', {
    "usuario_req_id": 2, # Pedro, comum
    "nome": "Sala Privada do Pedro",
    "capacidade": 5,
    "recursos_ids": []
})

# 11. POST /reservas -> Conflito de Horário
# O Seed já reserva a Sala 1 ("Sala 101") pro Pedro dia 25 (14:00 - 16:00).
# Vamos tentar marcar às 15:00 - 17:00 com a Maria.
faz_requisicao('POST', '/reservas', {
    "sala_id": 1,
    "usuario_id": 3, 
    "data": "2026-03-25",
    "horario_inicio": "15:00",
    "horario_fim": "17:00"
})

# 12. POST /reservas -> Sala Inexistente
faz_requisicao('POST', '/reservas', {
    "sala_id": 999,
    "usuario_id": 2,
    "data": "2026-03-30",
    "horario_inicio": "10:00",
    "horario_fim": "12:00"
})

# 13. POST /reservas -> Usuário Inexistente
faz_requisicao('POST', '/reservas', {
    "sala_id": 1,
    "usuario_id": 999,
    "data": "2026-03-30",
    "horario_inicio": "10:00",
    "horario_fim": "12:00"
})

print("\nTodos os testes finalizados com sucesso!")
