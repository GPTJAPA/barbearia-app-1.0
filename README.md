# 💈 Barbearia Fidel - Sistema de Agendamento Online

Sistema web completo para agendamento de serviços de barbearia, composto por uma interface pública para clientes e um painel administrativo exclusivo para o barbeiro gerir a sua agenda.

---

## 🚀 Funcionalidades

### 📱 Área do Cliente (`index.html`)
- **Vitrine de Serviços:** Exibição dinâmica dos serviços com preços e duração (com sistema de cache no navegador para carregamento instantâneo).
- **Validação de Agendamento:** Bloqueio automático de dias passados, fins de semana e horários já ocupados.
- **Prevenção de Duplicidade:** Impede que o mesmo número de WhatsApp realize mais de um agendamento para o mesmo dia.
- **Redirecionamento para WhatsApp:** Envio automático de mensagem formatada para o WhatsApp do barbeiro após a reserva.
- **Cancelamento pelo Cliente:** Permite que o próprio cliente cancele a sua marcação informando o número de WhatsApp.

### 🛡️ Área Administrativa / Barbeiro (`admin.html`)
- **Acesso Restrito:** Autenticação por utilizador e palavra-passe.
- **Visualização Inteligente da Agenda:**
  - **Desktop:** Tabela completa com detalhes do cliente, serviço, data, hora e valor.
  - **Mobile:** Transformação automática da tabela em **Cartões Individuais (Card Layout)** para leitura perfeita em ecrãs de telemóvel.
- **Filtro por Data:** Permite filtrar a lista por dias específicos ou ver a agenda completa.
- **Edição e Cancelamento:** 
  - Altera datas/horários e avisa o cliente no WhatsApp de forma automática.
  - Cancela marcações e abre a conversa do WhatsApp para notificar a alteração.
- **Navegação Simplificada:** Botão de saída rápida ("← Sair do Painel") para retornar à página principal.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Flexbox, CSS Grid, Media Queries, animações), JavaScript (ES6+, Fetch API, LocalStorage).
- **Backend:** Python 3, Flask, Flask-CORS.
- **Banco de Dados:** SQLite (`barbearia.db`).
- **Hospedagem:**
  - **Frontend:** Vercel
  - **Backend / API:** PythonAnywhere

---

## 📂 Estrutura de Ficheiros do Projeto

```text
/barbearia-fidel
├── imagens/
│   └── logo.png             # Logo oficial da barbearia (usada no topo e como marca d'água)
├── index.html               # Página principal do cliente
├── admin.html               # Painel administrativo do barbeiro
├── style.css                # Estilos globais, modais e regras responsivas
├── script.js                # Lógica do cliente (consumo da API e envio WhatsApp)
├── admin.js                 # Lógica do painel admin (tabela/cartões, edição e cancelamento)
├── flask_app.py             # Servidor Backend em Python (Flask + SQLite)
└── README.md                # Documentação do projeto