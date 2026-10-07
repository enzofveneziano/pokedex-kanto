# 🎮 Pokédex Kanto — 1ª Geração com IA

Pokédex completa dos 151 Pokémon de Kanto com IA integrada (Claude/Anthropic).

---

## 🚀 Como rodar (passo a passo)

### 1. Instale o Node.js
Baixe em: https://nodejs.org  
(versão LTS recomendada)

### 2. Crie o arquivo de configuração
Na pasta do projeto, crie um arquivo chamado `.env`:

```
GROQ_API_KEY=sk-ant-SUA_CHAVE_AQUI
```

Obtenha sua chave em: https://console.groq.com/home

### 3. Rode o servidor
```bash
node server.js
```

### 4. Abra no navegador
```
http://localhost:3000
```

---

## 📁 Estrutura do projeto

```
pokedex/
├── server.js          ← Back-end Node.js (proxy para API)
├── package.json       ← Configuração do projeto
├── .env               ← Sua chave da API (NÃO compartilhe!)
├── .env.example       ← Modelo do .env
└── public/
    ├── index.html     ← Interface principal
    ├── css/
    │   └── style.css  ← Estilos
    └── js/
        ├── data.js    ← Dados dos 151 Pokémon
        └── app.js     ← Lógica do front-end
```

---

## ✨ Funcionalidades

- 📋 **Informações**: sprites animados, stats, habilidades, fraquezas, curiosidades
- 🔍 **Busca**: por nome ou número da Pokédex
- 🏷️ **Filtro por tipo**: todos os 18 tipos
- 🤖 **IA Pokédex**: pergunte qualquer coisa sobre os Pokémon de Kanto
- ⚔️ **Comparador**: compare dois Pokémon com análise de batalha por IA

---

## ❓ Dúvidas frequentes

**A IA não responde?**
- Verifique se o servidor está rodando (`node server.js`)
- Confirme que o arquivo `.env` existe com a chave correta

**As sprites não aparecem?**
- Verifique sua conexão com a internet (imagens vêm do GitHub/PokeAPI)

**Porta 3000 ocupada?**
- Mude no `.env`: `PORT=3001`
