// ============================================================
// app.js — Lógica principal da Pokédex
// ============================================================

// ── URLs de sprites (PokeAPI) ────────────────────────────────
function spriteUrl(id, animated = false) {
  if (animated) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
  }
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// ── Helpers de tipo ──────────────────────────────────────────
function typeColor(t) { return TYPE_COLORS[t] || '#888'; }

function typeBadge(t, size = 'sm') {
  const c = typeColor(t);
  const pad = size === 'lg' ? '3px 10px' : '2px 7px';
  const fs  = size === 'lg' ? '11px' : '9px';
  return `<span class="type-badge" style="background:${c}22;color:${c};border-color:${c}44;font-size:${fs};padding:${pad}">${t}</span>`;
}

function weaknessesFor(types) {
  const set = new Set();
  types.forEach(t => (TYPE_WEAKNESSES[t] || []).forEach(w => set.add(w)));
  return [...set];
}

function statColor(v) {
  if (v >= 100) return '#4caf50';
  if (v >= 70)  return '#8bc34a';
  if (v >= 50)  return '#ffc107';
  return '#ff5722';
}

// ── Estado global ────────────────────────────────────────────
let selectedPokemon = POKEMON[24]; // Pikachu começa selecionado
let activeFilter    = 'all';
let searchTerm      = '';
let activeTab       = 'info';
let aiChatHistory   = [];
let aiLoading       = false;
let compareIndexA   = 0;
let compareIndexB   = 5;

// ── Todos os tipos únicos ────────────────────────────────────
const ALL_TYPES = [...new Set(POKEMON.flatMap(p => p.types))].sort();

// ============================================================
// FILTROS DE TIPO
// ============================================================
function renderTypeFilters() {
  const el = document.getElementById('type-filters');
  let html = `<button class="type-btn ${activeFilter === 'all' ? 'active' : ''}"
    style="background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.2)"
    onclick="setFilter('all')">Todos</button>`;

  ALL_TYPES.forEach(t => {
    const c = typeColor(t);
    html += `<button class="type-btn ${activeFilter === t ? 'active' : ''}"
      style="background:${c}22;color:${c};border:1px solid ${c}44"
      onclick="setFilter('${t}')">${t}</button>`;
  });
  el.innerHTML = html;
}

function setFilter(f) {
  activeFilter = f;
  renderTypeFilters();
  renderList();
}

// ============================================================
// LISTA DE POKÉMON
// ============================================================
function renderList() {
  const filtered = POKEMON.filter(p => {
    const matchSearch = !searchTerm
      || p.name.toLowerCase().includes(searchTerm)
      || String(p.id).includes(searchTerm);
    const matchType = activeFilter === 'all' || p.types.includes(activeFilter);
    return matchSearch && matchType;
  });

  document.getElementById('count-badge').textContent = `${filtered.length} Pokémon`;

  document.getElementById('pokemon-list').innerHTML = filtered.map(p => `
    <div class="poke-item ${selectedPokemon?.id === p.id ? 'active' : ''}"
         onclick="selectPokemon(${p.id})">
      <img class="sprite-sm"
           src="${spriteUrl(p.id)}"
           alt="${p.name}"
           loading="lazy"
           onerror="this.src='https://placehold.co/52x52/16213e/777?text=${p.id}'"/>
      <div class="poke-info-sm">
        <div class="poke-num">#${String(p.id).padStart(3, '0')}</div>
        <div class="poke-name">${p.name}</div>
        <div class="poke-types-sm">${p.types.map(t => typeBadge(t)).join('')}</div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// DETALHES DO POKÉMON
// ============================================================
function selectPokemon(id) {
  selectedPokemon = POKEMON.find(p => p.id === id);
  renderList();
  renderDetail();
}

function renderDetail() {
  if (!selectedPokemon) return;
  const p = selectedPokemon;
  const weak  = weaknessesFor(p.types);
  const total = Object.values(p.stats).reduce((a, b) => a + b, 0);

  const STAT_NAMES = {
    hp: 'HP', atk: 'Ataque', def: 'Defesa',
    spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Velocidade'
  };

  document.getElementById('detail-view').innerHTML = `
    <div class="det-header">
      <img class="sprite-lg"
           src="${spriteUrl(p.id, true)}"
           alt="${p.name}"
           onerror="this.src='${spriteUrl(p.id)}'"/>
      <div>
        <div class="det-num">#${String(p.id).padStart(3, '0')}</div>
        <div class="det-name">${p.name.toUpperCase()}</div>
        <div class="det-types">${p.types.map(t => typeBadge(t, 'lg')).join('')}</div>
        <div class="det-desc">${p.desc}</div>
      </div>
    </div>

    <div class="section-title">
      Estatísticas Base
      <span style="font-size:9px;color:var(--muted);font-weight:400">Total: ${total}</span>
    </div>
    ${Object.entries(STAT_NAMES).map(([key, name]) => `
      <div class="stat-row">
        <div class="stat-name">${name}</div>
        <div class="stat-val" style="color:${statColor(p.stats[key])}">${p.stats[key]}</div>
        <div class="stat-bar-bg">
          <div class="stat-bar"
               style="width:${Math.min(100, p.stats[key] / 255 * 100)}%;
                      background:${statColor(p.stats[key])}">
          </div>
        </div>
      </div>
    `).join('')}

    <div class="section-title">Habilidades</div>
    <div class="abilities-grid">
      ${p.abilities.map(a => `<span class="ability-pill">${a}</span>`).join('')}
    </div>

    <div class="section-title">Fraquezas</div>
    <div class="weaknesses-grid">
      ${weak.map(t => typeBadge(t)).join('')}
    </div>

    <div class="section-title">Curiosidades</div>
    ${p.curiosities.map(c => `<div class="curiosity-item">${c}</div>`).join('')}
  `;
}

// ============================================================
// ABAS
// ============================================================
function switchTab(tab) {
  activeTab = tab;

  // Botões
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Conteúdos
  ['info', 'ia', 'compare'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    el.classList.toggle('active', t === tab);
  });

  if (tab === 'compare') renderCompare();
}

// ============================================================
// IA — CHAT
// ============================================================

// Monta o system prompt com todos os dados dos Pokémon
function buildSystemPrompt() {
  return `Você é um especialista em Pokémon da 1ª geração (Kanto), com conhecimento profundo dos 151 Pokémon. Responda sempre em português do Brasil de forma direta e animada em 2-3 frases. Use emojis ocasionalmente.`;
}function addMessage(role, text) {
  // Remove a tela de boas-vindas na primeira mensagem
  const welcome = document.querySelector('.ai-welcome');
  if (welcome) welcome.remove();

  const container = document.getElementById('ai-messages');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.textContent = text;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Salva no histórico (apenas user e ai)
  if (role === 'user' || role === 'ai') {
    aiChatHistory.push({ role, text });
  }
  return div;
}

async function sendAIMessage() {
  const input = document.getElementById('ai-input');
  const question = input.value.trim();
  if (!question || aiLoading) return;

  input.value = '';
  aiLoading = true;
  document.getElementById('send-btn').disabled = true;

  // Mostra mensagem do usuário
  addMessage('user', question);

  // Indicador de carregamento
  const loadDiv = addMessage('loading', '🔍 Consultando a Pokédex...');

  try {
    // Monta o histórico de conversa para a API
    const messages = [
      // Últimas 10 mensagens do histórico
      ...aiChatHistory.slice(-10).map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      })),
      // Pergunta atual
      { role: 'user', content: question }
    ];

    // Chama o servidor local (que repassa para a Anthropic)
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: buildSystemPrompt(),
        messages
      })
    });

    const data = await response.json();
    loadDiv.remove();

    if (data.error) {
      const errDiv = document.createElement('div');
      errDiv.className = 'message error';
      errDiv.textContent = `⚠️ Erro: ${data.error}`;
      document.getElementById('ai-messages').appendChild(errDiv);
    } else {
      const reply = data.content?.[0]?.text || 'Não consegui processar sua pergunta.';
      addMessage('ai', reply);
    }

  } catch (err) {
    loadDiv.remove();
    const errDiv = document.createElement('div');
    errDiv.className = 'message error';
    errDiv.textContent = '⚠️ Servidor offline. Verifique se rodou "node server.js".';
    document.getElementById('ai-messages').appendChild(errDiv);
    document.getElementById('ai-messages').scrollTop = 99999;
  }

  aiLoading = false;
  document.getElementById('send-btn').disabled = false;
}

function quickQuestion(q) {
  document.getElementById('ai-input').value = q;
  sendAIMessage();
}

// ============================================================
// COMPARAR
// ============================================================
function renderCompare() {
  // Preenche os selects
  ['comp-a', 'comp-b'].forEach((id, i) => {
    const sel = document.getElementById(id);
    const currentIdx = i === 0 ? compareIndexA : compareIndexB;
    sel.innerHTML = POKEMON.map(p =>
      `<option value="${p.id - 1}" ${currentIdx === p.id - 1 ? 'selected' : ''}>
        #${p.id} ${p.name}
      </option>`
    ).join('');
    sel.onchange = () => {
      if (id === 'comp-a') compareIndexA = +sel.value;
      else compareIndexB = +sel.value;
      renderCompareCards();
    };
  });

  renderCompareCards();
}

function renderCompareCards() {
  const pA = POKEMON[compareIndexA];
  const pB = POKEMON[compareIndexB];
  const STAT_KEYS = [
    { name: 'HP',       key: 'hp'  },
    { name: 'Ataque',   key: 'atk' },
    { name: 'Defesa',   key: 'def' },
    { name: 'Sp. Atk',  key: 'spa' },
    { name: 'Sp. Def',  key: 'spd' },
    { name: 'Veloc.',   key: 'spe' },
  ];

  const totalA = Object.values(pA.stats).reduce((a, b) => a + b, 0);
  const totalB = Object.values(pB.stats).reduce((a, b) => a + b, 0);

  document.getElementById('compare-cards').innerHTML = [pA, pB].map((p, i) => {
    const other   = i === 0 ? pB : pA;
    const isWinner = (i === 0 && totalA >= totalB) || (i === 1 && totalB > totalA);

    return `
      <div class="compare-card ${isWinner ? 'winner' : ''}">
        <img src="${spriteUrl(p.id, true)}"
             alt="${p.name}"
             onerror="this.src='${spriteUrl(p.id)}'"/>
        <div class="c-name">${p.name.toUpperCase()}</div>
        <div class="comp-types">
          ${p.types.map(t => typeBadge(t)).join('')}
        </div>
        ${STAT_KEYS.map(({ name, key }) => {
          const val  = p.stats[key];
          const oval = other.stats[key];
          const color = val > oval ? '#4caf50' : val < oval ? '#ff5722' : '#aaa';
          return `
            <div class="cstat-row">
              <div class="cstat-name">${name}</div>
              <div class="cstat-val" style="color:${color}">${val}</div>
              <div class="cbar-bg">
                <div class="cbar" style="width:${val / 255 * 100}%;background:${color}"></div>
              </div>
            </div>`;
        }).join('')}
        <div class="comp-total">Total: <strong>${Object.values(p.stats).reduce((a, b) => a + b, 0)}</strong></div>
        ${isWinner ? '<div class="win-badge">★ Maior Total</div>' : ''}
      </div>`;
  }).join('');

  // Oculta resultado anterior da IA ao trocar Pokémon
  document.getElementById('ai-comp-result').style.display = 'none';
}

async function analyzeWithAI() {
  const pA = POKEMON[compareIndexA];
  const pB = POKEMON[compareIndexB];
  const btn = document.querySelector('.analyze-btn');
  const resultEl = document.getElementById('ai-comp-result');

  resultEl.style.display = 'block';
  resultEl.textContent = '🤖 Analisando batalha...';
  btn.disabled = true;

  const prompt =
    `Analise uma batalha entre ${pA.name} ` +
    `(tipos: ${pA.types.join('/')}, stats totais: ${Object.values(pA.stats).reduce((a,b)=>a+b,0)}) ` +
    `e ${pB.name} ` +
    `(tipos: ${pB.types.join('/')}, stats totais: ${Object.values(pB.stats).reduce((a,b)=>a+b,0)}). ` +
    `Considere vantagens de tipo, estatísticas e habilidades. ` +
    `Diga quem provavelmente venceria e por quê, em 2-3 frases em português.`;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: 'Você é um especialista em batalhas Pokémon. Responda em português do Brasil de forma direta e empolgante.',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      resultEl.textContent = `⚠️ Erro: ${data.error}`;
    } else {
      resultEl.textContent = data.content?.[0]?.text || 'Análise indisponível.';
    }
  } catch (err) {
    resultEl.textContent = '⚠️ Servidor offline. Rode "node server.js" primeiro.';
  }

  btn.disabled = false;
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Busca
document.getElementById('search-input').addEventListener('input', e => {
  searchTerm = e.target.value.toLowerCase().trim();
  renderList();
});

// Envio com Enter na IA
document.getElementById('ai-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendAIMessage();
});

// Troca de abas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ============================================================
// INICIALIZAÇÃO
// ============================================================
renderTypeFilters();
renderList();
renderDetail();
renderCompare();
