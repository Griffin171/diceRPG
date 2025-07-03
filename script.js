const atributos = ['Força', 'Vigor', 'Agilidade', 'Intelecto', 'Presença'];
const historicoEl = document.getElementById('historico');

function rolarDado(lados) {
  return Math.floor(Math.random() * lados) + 1;
}

function rolarNDados(n, lados) {
  let resultados = [];
  for (let i = 0; i < n; i++) {
    resultados.push(rolarDado(lados));
  }
  return resultados;
}

function registrarHistorico(texto) {
  const hora = new Date().toLocaleTimeString();
  const li = document.createElement('li');
  li.textContent = `[${hora}] ${texto}`;
  historicoEl.prepend(li);
}

function criarAtributos() {
  const container = document.getElementById('atributos-container');
  atributos.forEach(atr => {
    const div = document.createElement('div');
    div.innerHTML = `
      <strong>${atr}</strong>:
      <button onclick="rolarAtributo('${atr}',1)">1d20</button>
      <button onclick="rolarAtributo('${atr}',2)">2d20</button>
      <button onclick="rolarAtributo('${atr}',3)">3d20</button>
    `;
    container.appendChild(div);
  });
}

function rolarAtributo(nome, quant) {
  const resultados = rolarNDados(quant, 20);
  registrarHistorico(`${nome}: ${quant}d20 → ${resultados.join(', ')}`);
}

function criarDadosUnicos() {
  const container = document.getElementById('dados-unicos');
  [4, 6, 8, 10, 12, 20, 100].forEach(lados => {
    const btn = document.createElement('button');
    btn.textContent = `d${lados}`;
    btn.onclick = () => {
      const resultado = rolarDado(lados);
      registrarHistorico(`d${lados} → ${resultado}`);
    };
    container.appendChild(btn);
  });
}

function parseFormula(formula) {
  const partes = formula.split('+').map(p => p.trim());
  return partes.map(parte => {
    if (parte.includes('d')) {
      const [qtd, lados] = parte.split('d').map(Number);
      return { tipo: 'dado', qtd, lados };
    } else {
      return { tipo: 'fixo', valor: parseInt(parte) };
    }
  });
}

function rolarFormula() {
  const formula = document.getElementById('formula').value;
  const precisaAtaque = document.getElementById('precisa-ataque').checked;
  const criticoNum = parseInt(document.getElementById('critico-num').value);
  const criticoMulti = parseInt(document.getElementById('critico-multi').value);

  if (!formula.trim()) return;

  if (precisaAtaque) {
    const ataque = rolarDado(20);
    registrarHistorico(`Ataque (1d20) → ${ataque}`);
    if (ataque < criticoNum) {
      processarFormula(formula, false);
    } else {
      processarFormula(formula, true, criticoMulti);
    }
  } else {
    processarFormula(formula, false);
  }
}

function processarFormula(formula, isCritico = false, multi = 2) {
  const parsed = parseFormula(formula);
  let total = 0;
  let detalhes = [];

  parsed.forEach((parte, i) => {
    if (parte.tipo === 'dado') {
      let { qtd, lados } = parte;
      if (isCritico && i === 0) {
        qtd *= multi; // aplica crítico apenas no primeiro dado
      }
      const resultados = rolarNDados(qtd, lados);
      const soma = resultados.reduce((a, b) => a + b, 0);
      total += soma;
      detalhes.push(`${qtd}d${lados} → [${resultados.join(', ')}]`);
    } else {
      total += parte.valor;
      detalhes.push(`+ ${parte.valor}`);
    }
  });

  const criticoMsg = isCritico ? ` (CRÍTICO x${multi})` : '';
  registrarHistorico(`Rolagem Complexa${criticoMsg}: ${detalhes.join(' + ')} = ${total}`);
}

criarAtributos();
criarDadosUnicos();

// Flag secreta
let modoSorte = false;

// Comando oculto ativado via console
function ativarModoSorte() {
  modoSorte = true;
  console.log('%c[Modo Sorte ATIVADO] 🎲', 'color: #9b59b6; font-weight: bold;');
}

// Substitui a função de rolagem quando modo sorte está ativado (só em rolagens de dano)
function rolarDadoComSorte(lados) {
  // Retorna um valor aleatório mais próximo do topo (ex: entre 70% e 100% do valor máximo)
  const min = Math.floor(lados * 0.7);
  return Math.floor(Math.random() * (lados - min + 1)) + min;
}

// Atualizar apenas a função usada em dano complexo:
function processarFormula(formula, isCritico = false, multi = 2) {
  const parsed = parseFormula(formula);
  let total = 0;
  let detalhes = [];

  parsed.forEach((parte, i) => {
    if (parte.tipo === 'dado') {
      let { qtd, lados } = parte;
      if (isCritico && i === 0) {
        qtd *= multi;
      }

      let resultados = [];
      for (let j = 0; j < qtd; j++) {
        const resultado = modoSorte ? rolarDadoComSorte(lados) : rolarDado(lados);
        resultados.push(resultado);
      }

      const soma = resultados.reduce((a, b) => a + b, 0);
      total += soma;
      detalhes.push(`${qtd}d${lados} → [${resultados.join(', ')}]`);
    } else {
      total += parte.valor;
      detalhes.push(`+ ${parte.valor}`);
    }
  });

  const criticoMsg = isCritico ? ` (CRÍTICO x${multi})` : '';
  registrarHistorico(`Rolagem Complexa${criticoMsg}: ${detalhes.join(' + ')} = ${total}`);
}
function toggleMestre() {
  const panel = document.getElementById('mestre-panel');
  panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
}

// Criar as 3 rolagens de dano no painel mestre
function criarMestreRolagens() {
  for (let i = 1; i <= 3; i++) {
    const container = document.getElementById(`mestre-dano-${i}`);
    container.innerHTML = `
      <input type="text" placeholder="Fórmula (ex: 1d6+2)" id="mestre-formula-${i}">
      <label><input type="checkbox" id="mestre-ataque-${i}"> Atk?</label>
      <label>Crítico: <input type="number" id="mestre-critico-${i}" value="20" style="width:40px;"></label>
      <label>Multi: <input type="number" id="mestre-multi-${i}" value="2" style="width:35px;"></label>
      <button onclick="rolarMestreDano(${i})">🎲</button>
    `;
  }
}

function rolarMestreDano(i) {
  const formula = document.getElementById(`mestre-formula-${i}`).value;
  const precisaAtaque = document.getElementById(`mestre-ataque-${i}`).checked;
  const criticoNum = parseInt(document.getElementById(`mestre-critico-${i}`).value);
  const criticoMulti = parseInt(document.getElementById(`mestre-multi-${i}`).value);

  if (!formula.trim()) return;

  if (precisaAtaque) {
    const ataque = rolarDado(20);
    registrarHistorico(`Mestre ${i} - Ataque (1d20) → ${ataque}`);
    if (ataque < criticoNum) {
      processarFormula(formula, false);
    } else {
      processarFormula(formula, true, criticoMulti);
    }
  } else {
    processarFormula(formula, false);
  }
}

criarMestreRolagens();

// Mostrar anotação junto com painel Mestre
function toggleMestre() {
  const panel = document.getElementById('mestre-panel');
  panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';

  const anotacoes = document.getElementById('caixa-anotacoes');
  anotacoes.style.display = anotacoes.style.display === 'block' ? 'none' : 'block';
}

// Minimizar/restaurar anotação
let anotacoesMinimizadas = false;

function toggleAnotacoes() {
  const body = document.getElementById('anotacoes-body');
  anotacoesMinimizadas = !anotacoesMinimizadas;
  body.style.display = anotacoesMinimizadas ? 'none' : 'block';
  document.getElementById('minimizar-anotacoes').textContent = anotacoesMinimizadas ? '+' : '−';
}

// Função para tornar a caixa de anotação arrastável
function makeDraggable(el) {
  const header = document.getElementById('anotacoes-header');
  let offsetX = 0, offsetY = 0, isDragging = false;

  header.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    document.onmousemove = onMouseMove;
    document.onmouseup = () => {
      isDragging = false;
      document.onmousemove = null;
    };
  };

  function onMouseMove(e) {
    if (isDragging) {
      el.style.top = e.clientY - offsetY + 'px';
      el.style.left = e.clientX - offsetX + 'px';
      el.style.bottom = 'auto';
      el.style.right = 'auto';
    }
  }
}

// Inicializar após carregamento
window.onload = () => {
  criarMestreRolagens();
  makeDraggable(document.getElementById('caixa-anotacoes'));
};

function salvarAnotacoes() {
  const texto = document.getElementById('bloco-anotacoes').value;
  if (!texto.trim()) {
    alert("Não há nada para salvar!");
    return;
  }

  const blob = new Blob([texto], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "anotacoes-rpg.txt";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
