import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==========================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ==========================================
DATABASE = 'barbearia.db'

def conectar_banco():
    """Cria a conexão com o ficheiro do banco de dados SQLite."""
    return sqlite3.connect(DATABASE)

def criar_tabela():
    """Cria a tabela de agendamentos se ela ainda não existir."""
    conexao = conectar_banco()
    cursor = conexao.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agendamentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cliente TEXT,
            telefone TEXT,
            servico TEXT,
            data TEXT,
            hora TEXT,
            valor REAL
        )
    ''')
    conexao.commit()
    conexao.close()

# Executa a criação da tabela logo que o programa liga
criar_tabela()

# Lista de serviços fixa (Vitrine)
servicos_barbearia = [
    {"id": 1, "nome": "Corte de Cabelo", "preco": 40.00, "duracao_minutos": 30},
    {"id": 2, "nome": "Barba Tradicional", "preco": 35.00, "duracao_minutos": 20},
    {"id": 3, "nome": "Corte e Barba", "preco": 70.00, "duracao_minutos": 45},
    {"id": 4, "nome": "Sobrancelha", "preco": 20.00, "duracao_minutos": 15}
]

# ==========================================
# ROTAS DA APLICAÇÃO
# ==========================================

@app.route('/servicos', methods=['GET'])
def listar_servicos():
    return jsonify(servicos_barbearia)

@app.route('/agendar', methods=['POST'])
def criar_agendamento():
    dados = request.json
    telefone_cliente = dados.get('telefone')
    data_escolhida = dados.get('data')
    
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    # NOVO: 1. Verifica se já existe uma marcação para este número no mesmo dia
    cursor.execute('SELECT * FROM agendamentos WHERE telefone = ? AND data = ?', (telefone_cliente, data_escolhida))
    agendamento_existente = cursor.fetchone()
    
    # 2. Se encontrou um agendamento, bloqueia e avisa o JavaScript!
    if agendamento_existente:
        conexao.close()
        # O código 400 significa "Bad Request" (Pedido Inválido)
        return jsonify({"erro": "Você já possui um agendamento para este dia. Por favor, volte para (Nossos Serviços) e cancele o agendamento atual na opção abaixo antes de marcar um novo."}), 400

    # 3. Se não encontrou, insere a marcação normalmente
    cursor.execute('''
        INSERT INTO agendamentos (cliente, telefone, servico, data, hora, valor)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        dados.get('cliente'), 
        telefone_cliente, 
        dados.get('servico'), 
        data_escolhida, 
        dados.get('hora'), 
        dados.get('valor')
    ))
    conexao.commit()
    conexao.close()
    
    return jsonify({"mensagem": "Agendamento guardado no Banco de Dados!"}), 201

@app.route('/horarios-ocupados', methods=['GET'])
def buscar_horarios_ocupados():
    data_escolhida = request.args.get('data')
    
    # Busca horários no banco para a data selecionada
    conexao = conectar_banco()
    cursor = conexao.cursor()
    cursor.execute('SELECT hora FROM agendamentos WHERE data = ?', (data_escolhida,))
    resultados = cursor.fetchall()
    conexao.close()
    
    # Transforma o resultado numa lista simples de horas
    horarios_indisponiveis = [linha[0] for linha in resultados]
    return jsonify(horarios_indisponiveis)

@app.route('/agenda', methods=['GET'])
def ver_agenda():
    # Agora o Python verifica se enviamos uma data para filtrar
    data_filtro = request.args.get('data')
    
    conexao = conectar_banco()
    conexao.row_factory = sqlite3.Row 
    cursor = conexao.cursor()
    
    if data_filtro:
        # Se tem filtro, busca só os agendamentos desse dia
        cursor.execute('SELECT * FROM agendamentos WHERE data = ?', (data_filtro,))
    else:
        # Se não tem filtro, busca tudo
        cursor.execute('SELECT * FROM agendamentos')
        
    resultados = cursor.fetchall()
    conexao.close()
    
    lista_agendamentos = [dict(linha) for linha in resultados]
    return jsonify(lista_agendamentos)

# NOVA ROTA: Apaga um agendamento do banco de dados
@app.route('/editar/<int:id_agendamento>', methods=['PUT'])
def editar_agendamento(id_agendamento):
    dados = request.json
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    # Atualiza apenas a data e a hora do ID selecionado
    cursor.execute('''
        UPDATE agendamentos 
        SET data = ?, hora = ? 
        WHERE id = ?
    ''', (dados.get('data'), dados.get('hora'), id_agendamento))
    
    conexao.commit()
    conexao.close()
    return jsonify({"mensagem": "Atualizado com sucesso!"}), 200

# NOVA ROTA: Cancelamento automático pelo cliente
@app.route('/cancelar-telefone/<telefone>', methods=['DELETE'])
def cancelar_por_telefone(telefone):
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    # Verifica se a pessoa tem realmente um agendamento
    cursor.execute('SELECT * FROM agendamentos WHERE telefone = ?', (telefone,))
    agendamento = cursor.fetchone()
    
    if agendamento:
        # Se encontrou, apaga o registo
        cursor.execute('DELETE FROM agendamentos WHERE telefone = ?', (telefone,))
        conexao.commit()
        conexao.close()
        return jsonify({"mensagem": "Cancelado com sucesso!"}), 200
    else:
        conexao.close()
        return jsonify({"erro": "Nenhum agendamento encontrado."}), 404

# ==========================================
# NOVA ROTA: LOGIN SEGURO DO BARBEIRO
# ==========================================
@app.route('/login', methods=['POST'])
def verificar_login():
    dados = request.json
    usuario_digitado = dados.get('usuario')
    senha_digitada = dados.get('senha')
    
    # As credenciais verdadeiras agora estão protegidas no servidor!
    USUARIO_CORRETO = "fidel"
    SENHA_CORRETA = "barba123"
    
    if usuario_digitado == USUARIO_CORRETO and senha_digitada == SENHA_CORRETA:
        return jsonify({"sucesso": True}), 200 # 200 significa "OK"
    else:
        return jsonify({"sucesso": False}), 401 # 401 significa "Não Autorizado"

# ==========================================
# NOVA ROTA: CANCELAMENTO PELO PAINEL DO BARBEIRO
# ==========================================
@app.route('/cancelar/<int:id_agendamento>', methods=['DELETE'])
def cancelar_por_id(id_agendamento):
    """Recebe o ID do agendamento e apaga-o do banco de dados."""
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    # Executa o comando DELETE procurando pelo ID exato
    cursor.execute('DELETE FROM agendamentos WHERE id = ?', (id_agendamento,))
    
    conexao.commit()
    conexao.close()
    
    return jsonify({"mensagem": "Agendamento apagado com sucesso!"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# NOVA ROTA: Atualiza a data e a hora de um agendamento existente
@app.route('/editar/<int:id_agendamento>', methods=['PUT'])
def editar_agendamento(id_agendamento):
    """Recebe a nova data e hora e atualiza no banco de dados SQLite."""
    dados = request.json
    
    conexao = conectar_banco()
    cursor = conexao.cursor()
    
    # O comando UPDATE altera dados existentes onde o ID corresponder
    cursor.execute('''
        UPDATE agendamentos 
        SET data = ?, hora = ? 
        WHERE id = ?
    ''', (dados.get('data'), dados.get('hora'), id_agendamento))
    
    conexao.commit()
    conexao.close()
    
    return jsonify({"mensagem": "Agendamento atualizado com sucesso!"}), 200