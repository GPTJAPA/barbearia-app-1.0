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