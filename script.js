// ==========================================
// CONFIGURAÇÃO DA API (PythonAnywhere)
// ==========================================
const API_URL = "https://fidelbarbearia.pythonanywhere.com/servicos";
let servicoSelecionado = null;

// ==========================================
// 1. FUNÇÕES DE UTILIDADE
// ==========================================

function formatarDataBR(dataISO) {
    const partes = dataISO.split('-');
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function bloquearDiasPassados() {
    const inputData = document.getElementById("data-escolhida");
    if (inputData) {
        const hoje = new Date().toISOString().split('T')[0];
        inputData.setAttribute("min", hoje);
    }
}

function limparTelefone(telefone) {
    return telefone.replace(/\D/g, ''); 
}

// ==========================================
// 2. LÓGICA DA VITRINE E HORÁRIOS
// ==========================================

async function carregarServicos() {
  const container = document.getElementById("lista-servicos");
  if (!container) return;

  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error(`Erro: Status ${resposta.status}`);

    const servicos = await resposta.json();
    container.innerHTML = ""; 

    if (servicos.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum serviço disponível.</p>';
        return;
    }

    servicos.forEach((servico) => {
      const card = document.createElement("div");
      card.style.borderBottom = "1px solid #eee";
      card.style.padding = "15px 0";
      card.style.display = "flex";
      card.style.justifyContent = "space-between";
      card.style.alignItems = "center";

      card.innerHTML = `
                <div>
                    <h3 style="margin: 0; color: #333;">${servico.nome}</h3>
                    <small style="color: #666;">Duração: ${servico.duracao_minutos} min</small>
                </div>
                <div style="text-align: right;">
                    <strong style="color: #27ae60; font-size: 1.2em; display: block; margin-bottom: 8px;">R$ ${servico.preco.toFixed(2)}</strong>
                    <button onclick="selecionarServico(${servico.id}, '${servico.nome}', ${servico.preco})" 
                            style="background-color: #000; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Agendar
                    </button>
                </div>
            `;
      container.appendChild(card);
    });

  } catch (erro) {
    console.error("Erro ao carregar serviços:", erro);
    container.innerHTML = '<p style="color: red; text-align: center; font-weight: bold;">Erro ao carregar os serviços. Verifique a conexão.</p>';
  }
}

function selecionarServico(id, nome, preco) {
  servicoSelecionado = { id, nome, preco };
  document.getElementById("resumo-servico").innerHTML = `
        <strong>${nome}</strong><br>
        <span style="color: #666;">Valor: R$ ${preco.toFixed(2)}</span>
    `;
  document.getElementById("secao-vitrine").style.display = "none";
  document.getElementById("secao-agendamento").style.display = "block";
}

function voltarParaVitrine() {
  document.getElementById("secao-agendamento").style.display = "none";
  document.getElementById("secao-vitrine").style.display = "block";
  document.getElementById("data-escolhida").value = "";
  document.getElementById("grid-horarios").innerHTML = "";
  document.getElementById("titulo-horarios").style.display = "none";
}

async function mostrarHorarios() {
  const data = document.getElementById("data-escolhida").value;
  if (!data) return;

  const partesData = data.split('-'); 
  const dataObjeto = new Date(partesData[0], partesData[1] - 1, partesData[2]);
  const diaDaSemana = dataObjeto.getDay(); 

  if (diaDaSemana === 0 || diaDaSemana === 6) {
      alert("A barbearia não marca horário nos fins de semana! SOMENTE POR ORDEM DE CHEGADA!");
      document.getElementById("data-escolhida").value = ""; 
      document.getElementById("grid-horarios").innerHTML = ""; 
      document.getElementById("titulo-horarios").style.display = "none";
      return; 
  }

  document.getElementById("titulo-horarios").style.display = "block";
  const grid = document.getElementById("grid-horarios");
  grid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>A verificar disponibilidade...</p>";

  try {
    const resposta = await fetch(`https://fidelbarbearia.pythonanywhere.com/horarios-ocupados?data=${data}`);
    const horariosOcupados = await resposta.json();

    const todosHorarios = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
      "12:00", "13:00", "13:30", "14:00", "14:30", "15:00",
      "15:30", "16:00", "17:30", "18:00", "18:30", "19:00", "19:30"
    ];

    let horariosDisponiveis = todosHorarios.filter(hora => !horariosOcupados.includes(hora));

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const dataHojeLocal = `${ano}-${mes}-${dia}`;
    
    const horaAtualFormatada = String(hoje.getHours()).padStart(2, '0') + ":" + String(hoje.getMinutes()).padStart(2, '0');

    if (data === dataHojeLocal) {
        horariosDisponiveis = horariosDisponiveis.filter(hora => hora > horaAtualFormatada);
    }

    grid.innerHTML = ""; 

    if (horariosDisponiveis.length === 0) {
      grid.innerHTML = "<p style='grid-column: 1/-1; color: red; text-align: center; font-weight: bold;'>Agenda lotada para este dia!</p>";
      return;
    }

    horariosDisponiveis.forEach((hora) => {
      const btn = document.createElement("button");
      btn.className = "horario-btn";
      btn.innerText = hora;
      btn.onclick = () => confirmarAgendamento(hora, data);
      grid.appendChild(btn);
    });

  } catch (erro) {
    console.error("Erro ao carregar horários:", erro);
    grid.innerHTML = "<p style='grid-column: 1/-1; color: red; text-align: center;'>Erro ao verificar a agenda.</p>";
  }
}

async function confirmarAgendamento(hora, data) {
  const nomeInput = document.getElementById("nome-cliente").value;
  const telefoneCru = document.getElementById("telefone-cliente").value;
  const telefoneLimpo = limparTelefone(telefoneCru);

  if (!nomeInput || !telefoneLimpo) {
    alert("Por favor, preencha seu nome e WhatsApp antes de escolher o horário!");
    return;
  }

  const dadosDoAgendamento = {
    cliente: nomeInput,
    telefone: telefoneLimpo, 
    servico: servicoSelecionado.nome,
    data: data, 
    hora: hora,
    valor: servicoSelecionado.preco,
  };

  try {
    const resposta = await fetch("https://fidelbarbearia.pythonanywhere.com/agendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosDoAgendamento),
    });

    if (resposta.ok) {
      const numeroBarbeiro = "5541995655320";
      const dataFormatada = formatarDataBR(data);
      const textoMensagem = `Olá! Gostaria de confirmar meu agendamento na Barbearia:\n\n*Nome:* ${nomeInput}\n*Serviço:* ${servicoSelecionado.nome}\n*Data:* ${dataFormatada}\n*Horário:* ${hora}\n*Valor:* R$ ${servicoSelecionado.preco.toFixed(2)}`;
      const urlWhatsapp = `https://wa.me/${numeroBarbeiro}?text=${encodeURIComponent(textoMensagem)}`;

      const modal = document.getElementById("modal-sucesso");
      modal.style.display = "flex";

      const btnWhatsapp = document.getElementById("btn-ir-whatsapp");
      btnWhatsapp.onclick = function() {
          window.open(urlWhatsapp, "_blank");
          modal.style.display = "none";
          document.getElementById("nome-cliente").value = "";
          document.getElementById("telefone-cliente").value = "";
          voltarParaVitrine();
      };

    } else {
      const erroData = await resposta.json();
      if (erroData.erro) {
          alert(erroData.erro);
      } else {
          alert("Ocorreu um erro ao agendar. Tente novamente.");
      }
    }
  } catch (erro) {
    console.error("Erro ao enviar dados para a API:", erro);
    alert("Erro de conexão com o servidor.");
  }
}

// ==========================================
// 3. LOGIN E CANCELAMENTO
// ==========================================

function abrirModalLogin() {
    document.getElementById("modal-login").style.display = "flex";
}

function fecharModalLogin() {
    document.getElementById("modal-login").style.display = "none";
    document.getElementById("login-usuario").value = ""; 
    document.getElementById("login-senha").value = "";
}

async function fazerLogin() {
    const usuarioInput = document.getElementById("login-usuario").value;
    const senhaInput = document.getElementById("login-senha").value;

    try {
        const resposta = await fetch("https://fidelbarbearia.pythonanywhere.com/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: usuarioInput, senha: senhaInput })
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            window.location.href = "admin.html";
        } else {
            alert("Usuário ou senha incorretos!");
        }
    } catch (erro) {
        console.error("Erro ao fazer login:", erro);
        alert("Erro de conexão com o servidor.");
    }
}

function abrirModalCancelar() {
    document.getElementById("modal-cancelar").style.display = "flex";
}

function fecharModalCancelar() {
    document.getElementById("modal-cancelar").style.display = "none";
    document.getElementById("telefone-cancelar").value = ""; 
}

async function cancelarAgendamentoCliente() {
    const telefoneCru = document.getElementById("telefone-cancelar").value;
    const telefoneLimpo = limparTelefone(telefoneCru);
    
    if (!telefoneLimpo) {
        alert("Por favor, preencha o seu WhatsApp para cancelar.");
        return;
    }
    
    try {
        const resposta = await fetch(`https://fidelbarbearia.pythonanywhere.com/cancelar-telefone/${telefoneLimpo}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            alert("Agendamento cancelado com sucesso!");
            fecharModalCancelar();
        } else {
            alert("Nenhum agendamento encontrado para este número.");
        }
    } catch (erro) {
        console.error("Erro ao cancelar:", erro);
        alert("Erro de conexão com o servidor.");
    }
}

// Inicializa a página
carregarServicos();
bloquearDiasPassados();