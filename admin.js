// ==========================================
// 1. VARIÁVEIS GLOBAIS (Memória do Sistema)
// ==========================================
// Guardam os dados do cliente que estamos a editar neste momento
let telefoneClienteEditando = "";
let nomeClienteEditando = "";

// ==========================================
// 2. FUNÇÕES DE UTILIDADE
// ==========================================

// Função para formatar a data (De: AAAA-MM-DD Para: DD/MM/AAAA)
function formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// ==========================================
// 3. LÓGICA PRINCIPAL DA AGENDA (LER DADOS)
// ==========================================

async function carregarAgenda() {
    const dataFiltro = document.getElementById("filtro-data") ? document.getElementById("filtro-data").value : "";
    
    let url = "https://Fidelbarbearia.pythonanywhere.com/agenda";
    if (dataFiltro) {
        url = url + `?data=${dataFiltro}`;
    }

    try {
        const resposta = await fetch(url);
        const agendamentos = await resposta.json();
        
        const corpoTabela = document.getElementById("corpo-tabela");
        if (!corpoTabela) return;
        
        corpoTabela.innerHTML = ""; 
        
        if (agendamentos.length === 0) {
            corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align: center;">Nenhum agendamento para mostrar.</td></tr>`;
            return;
        }
        
        agendamentos.forEach(agendamento => {
            const dataAmigavel = formatarDataBR(agendamento.data);
            
            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${agendamento.id}</td>
                <td><strong>${agendamento.cliente}</strong></td>
                <td>${agendamento.telefone}</td>
                <td>${agendamento.servico}</td>
                <td>${dataAmigavel}</td>
                <td>${agendamento.hora}</td>
                <td style="color: #27ae60; font-weight: bold;">R$ ${agendamento.valor.toFixed(2)}</td>
                <td>
                    <!-- Botão de Editar: Agora envia o Telefone e o Cliente para a memória -->
                    <button onclick="abrirModalEdicao(${agendamento.id}, '${agendamento.data}', '${agendamento.hora}', '${agendamento.telefone}', '${agendamento.cliente}')" 
                            style="background-color: #f1c40f; color: black; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold; margin-right: 5px;">
                        Editar
                    </button>
                    <!-- Botão de Cancelar -->
                    <button onclick="cancelar(${agendamento.id}, '${agendamento.telefone}', '${agendamento.cliente}', '${agendamento.data}', '${agendamento.hora}')" 
                            style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                        Cancelar
                    </button>
                </td>
            `;
            corpoTabela.appendChild(linha);
        });
        
    } catch (erro) {
        console.error("Erro ao carregar agenda:", erro);
        const corpoTabela = document.getElementById("corpo-tabela");
        if (corpoTabela) {
            corpoTabela.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar dados. O Python está ligado?</td></tr>`;
        }
    }
}

function limparFiltro() {
    if(document.getElementById("filtro-data")) {
        document.getElementById("filtro-data").value = "";
    }
    carregarAgenda();
}

// ==========================================
// 4. LÓGICA DE CANCELAMENTO (APAGAR)
// ==========================================

async function cancelar(id, telefone, cliente, data, hora) {
    const confirmar = confirm(`Tem certeza que deseja cancelar o horário de ${cliente}?`);
    if (!confirmar) return;

    try {
        const resposta = await fetch(`https://Fidelbarbearia.pythonanywhere.com/cancelar/${id}`, {
            method: 'DELETE' 
        });

        if (resposta.ok) {
            alert("Agendamento apagado do sistema!");
            
            const dataCancelamento = formatarDataBR(data);
            const texto = `Olá ${cliente}! Infelizmente o seu agendamento para o dia ${dataCancelamento} às ${hora} precisou ser cancelado. Por favor, entre em contato para remarcarmos!`;
            
            const numeroLimpo = telefone.replace(/\D/g, ''); 
            const urlWhatsapp = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(texto)}`;
            
            window.open(urlWhatsapp, "_blank");
            carregarAgenda();
        }
    } catch (erro) {
        console.error("Erro ao cancelar:", erro);
        alert("Erro ao tentar cancelar.");
    }
}

// ==========================================
// 5. LÓGICA DE EDIÇÃO (ATUALIZAR) E WHATSAPP
// ==========================================

// Prepara a janela e guarda os dados originais
function abrirModalEdicao(id, dataAtual, horaAtual, telefone, cliente) {
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-data").value = dataAtual;
    document.getElementById("edit-hora").value = horaAtual;
    
    // Atualiza a nossa memória (Variáveis Globais)
    telefoneClienteEditando = telefone;
    nomeClienteEditando = cliente;
    
    document.getElementById("modal-editar").style.display = "flex";
}

function fecharModalEdicao() {
    document.getElementById("modal-editar").style.display = "none";
}

// Grava as alterações e avisa o cliente
async function salvarEdicao() {
    const id = document.getElementById("edit-id").value;
    const novaData = document.getElementById("edit-data").value;
    const novaHora = document.getElementById("edit-hora").value;

    try {
        const resposta = await fetch(`https://Fidelbarbearia.pythonanywhere.com/editar/${id}`, {
            method: 'PUT',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: novaData, hora: novaHora })
        });

        if (resposta.ok) {
            alert("Horário atualizado com sucesso no sistema!");
            
            // 1. Prepara a mensagem de WhatsApp
            const dataFormatada = formatarDataBR(novaData);
            const textoMensagem = `Olá ${nomeClienteEditando}! O seu agendamento na barbearia foi remarcado para o dia ${dataFormatada} às ${novaHora}. Qualquer dúvida, estou à disposição!`;
            
            const numeroLimpo = telefoneClienteEditando.replace(/\D/g, '');
            const urlWhatsapp = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(textoMensagem)}`;
            
            // 2. Truque para contornar o bloqueador de pop-ups do navegador
            const linkInvisivel = document.createElement("a");
            linkInvisivel.href = urlWhatsapp;
            linkInvisivel.target = "_blank"; // Abre numa nova aba
            document.body.appendChild(linkInvisivel); // Coloca na página
            linkInvisivel.click(); // O JavaScript clica por ti
            document.body.removeChild(linkInvisivel); // Apaga o link imediatamente
            
            fecharModalEdicao();
            carregarAgenda(); 
        } else {
            alert("Erro ao atualizar o agendamento.");
        }
    } catch (erro) {
        console.error("Erro ao editar:", erro);
        alert("Erro de conexão com o servidor.");
    }
}

// Inicializa a página
carregarAgenda();