'use strict';

let codigoServidor = { funcoes: {}, arquivos: {} };
let historico = {};
let acaoVisivel = 'listar-categorias';
let codigosCopiaveis = [];

const TELAS = {
  categorias: [
    ['listar-categorias', 'Listar'],
    ['criar-categoria', 'Cadastrar'],
    ['preencher-categoria', 'Editar'],
    ['atualizar-categoria', 'Salvar edição'],
    ['excluir-categoria', 'Excluir'],
  ],
  produtos: [
    ['preparar-produto', 'Abrir tela'],
    ['criar-produto', 'Cadastrar'],
    ['preencher-produto', 'Editar'],
    ['atualizar-produto', 'Salvar edição'],
    ['excluir-produto', 'Excluir'],
  ],
  vitrine: [
    ['listar-produtos', 'Listar todas'],
    ['filtrar-produtos', 'Filtrar'],
  ],
};

function passo(camada, arquivo, nome, origem) {
  return { camada: camada, arquivo: arquivo, nome: nome, origem: origem };
}

const ACOES = {
  'listar-categorias': {
    titulo: 'Listar categorias',
    resumo: 'A tela pede a lista. O GET chega na rota, o SELECT lê a tabela e o JSON volta para desenhar as linhas.',
    passos: [
      passo('tela', 'public/js/app.js', 'carregarCategorias', 'front'),
      passo('navegador', 'public/js/api.js', 'listarCategorias', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaListarCategorias', 'back'),
      passo('banco', 'src/categorias.js', 'listarCategorias', 'back'),
      passo('tela', 'public/js/app.js', 'desenharCategorias', 'front'),
    ],
  },
  'criar-categoria': {
    titulo: 'Cadastrar categoria',
    resumo: 'O formulário vira um objeto. O POST manda esse JSON e o INSERT grava a linha. O ? do SQL recebe o valor sem concatenar texto na consulta.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEnviarCategoria', 'front'),
      passo('tela', 'public/js/app.js', 'lerCategoria', 'front'),
      passo('tela', 'public/js/app.js', 'validarCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'criarCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaCriarCategoria', 'back'),
      passo('banco', 'src/categorias.js', 'inserirCategoria', 'back'),
    ],
  },
  'preencher-categoria': {
    titulo: 'Preencher edição',
    resumo: 'Editar ainda não grava. A função acha a categoria na lista que já está na memória e copia os campos para o formulário.',
    semHttp: true,
    observacaoFixa: 'Nenhuma requisição. Salvar edição é que envia o PUT.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEditarCategoria', 'front'),
      passo('tela', 'public/js/app.js', 'buscarCategoria', 'front'),
    ],
  },
  'atualizar-categoria': {
    titulo: 'Salvar edição da categoria',
    resumo: 'O PUT leva o id na URL e o formulário no corpo. O UPDATE troca o nome e a descrição dessa linha.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEnviarCategoria', 'front'),
      passo('tela', 'public/js/app.js', 'lerCategoria', 'front'),
      passo('tela', 'public/js/app.js', 'validarCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'atualizarCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaAtualizarCategoria', 'back'),
      passo('banco', 'src/categorias.js', 'atualizarCategoria', 'back'),
    ],
  },
  'excluir-categoria': {
    titulo: 'Excluir categoria',
    resumo: 'O DELETE leva o id na URL. Se ainda existir produto nessa categoria, o servidor recusa e devolve 400.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoExcluirCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'excluirCategoria', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaExcluirCategoria', 'back'),
      passo('banco', 'src/categorias.js', 'excluirCategoria', 'back'),
    ],
  },
  'preparar-produto': {
    titulo: 'Abrir o cadastro de produtos',
    resumo: 'A tela busca as categorias para o select e os produtos para a tabela. A resposta abaixo é o GET /api/produtos. O GET das categorias acontece um passo antes.',
    passos: [
      passo('tela', 'public/js/app.js', 'carregarProdutos', 'front'),
      passo('navegador', 'public/js/api.js', 'listarCategorias', 'front'),
      passo('tela', 'public/js/app.js', 'preencherSelectCategorias', 'front'),
      passo('navegador', 'public/js/api.js', 'listarProdutos', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaListarProdutos', 'back'),
      passo('banco', 'src/produtos.js', 'listarProdutos', 'back'),
      passo('tela', 'public/js/app.js', 'desenharTabelaProdutos', 'front'),
    ],
  },
  'criar-produto': {
    titulo: 'Cadastrar produto',
    resumo: 'O navegador valida o formulário e o servidor valida de novo: preço, estoque e se a categoria existe. A API não confia só no navegador.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEnviarProduto', 'front'),
      passo('tela', 'public/js/app.js', 'lerProduto', 'front'),
      passo('tela', 'public/js/app.js', 'validarProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'criarProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaCriarProduto', 'back'),
      passo('banco', 'src/produtos.js', 'inserirProduto', 'back'),
      passo('banco', 'src/produtos.js', 'lerCamposProduto', 'back'),
      passo('banco', 'src/produtos.js', 'validarCamposProduto', 'back'),
    ],
  },
  'preencher-produto': {
    titulo: 'Preencher edição do produto',
    resumo: 'O clique em Editar guarda o objeto do produto e abre o formulário com os campos preenchidos, inclusive a categoria.',
    semHttp: true,
    observacaoFixa: 'Nenhuma requisição. Salvar edição é que envia o PUT.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEditarProduto', 'front'),
      passo('tela', 'public/js/app.js', 'buscarProduto', 'front'),
    ],
  },
  'atualizar-produto': {
    titulo: 'Salvar edição do produto',
    resumo: 'O PUT substitui todos os campos do produto pelo que está no formulário. O id vai na URL.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEnviarProduto', 'front'),
      passo('tela', 'public/js/app.js', 'lerProduto', 'front'),
      passo('tela', 'public/js/app.js', 'validarProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'atualizarProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaAtualizarProduto', 'back'),
      passo('banco', 'src/produtos.js', 'atualizarProduto', 'back'),
      passo('banco', 'src/produtos.js', 'lerCamposProduto', 'back'),
      passo('banco', 'src/produtos.js', 'validarCamposProduto', 'back'),
    ],
  },
  'excluir-produto': {
    titulo: 'Excluir produto',
    resumo: 'O DELETE apaga a linha do produto. A categoria continua cadastrada.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoExcluirProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'excluirProduto', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaExcluirProduto', 'back'),
      passo('banco', 'src/produtos.js', 'excluirProduto', 'back'),
    ],
  },
  'listar-produtos': {
    titulo: 'Listar todos os produtos',
    resumo: 'O botão Todas chama a função com null. Sem ?categoria= na URL, o SQL não ganha WHERE.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEscolherFiltro', 'front'),
      passo('navegador', 'public/js/api.js', 'listarProdutos', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaListarProdutos', 'back'),
      passo('banco', 'src/produtos.js', 'listarProdutos', 'back'),
      passo('tela', 'public/js/app.js', 'desenharVitrine', 'front'),
    ],
  },
  'filtrar-produtos': {
    titulo: 'Filtrar por categoria',
    resumo: 'A função da tela é a mesma da listagem. O que muda é o id: ele entra na URL como ?categoria= e o servidor acrescenta o WHERE.',
    passos: [
      passo('tela', 'public/js/app.js', 'aoEscolherFiltro', 'front'),
      passo('navegador', 'public/js/api.js', 'listarProdutos', 'front'),
      passo('navegador', 'public/js/api.js', 'requisicao', 'front'),
      passo('rota', 'server.js', 'rotaListarProdutos', 'back'),
      passo('banco', 'src/produtos.js', 'listarProdutos', 'back'),
      passo('tela', 'public/js/app.js', 'desenharVitrine', 'front'),
    ],
  },
  'config-banco': {
    titulo: 'Configuração do banco',
    resumo: 'O SQLite guarda tudo num arquivo. A configuração fica separada do código que abre a conexão, cria as tabelas e grava os exemplos.',
    semHttp: true,
    observacaoFixa: 'Esta tela não chama a API. Ela só mostra os arquivos que preparam o banco quando o servidor sobe.',
    passos: [
      passo('arquivo', 'config/database.js', 'database.js', 'arquivo'),
      passo('banco', 'src/banco.js', 'abrirBanco', 'back'),
      passo('banco', 'src/banco.js', 'criarTabelas', 'back'),
      passo('banco', 'src/banco.js', 'prepararBanco', 'back'),
      passo('banco', 'src/banco.js', 'inserirExemplos', 'back'),
    ],
  },
};

async function carregarCodigoDoServidor() {
  try {
    const resposta = await fetch('/api/estudo/codigo');
    if (!resposta.ok) return;
    codigoServidor = await resposta.json();
  } catch (erro) {
    codigoServidor = { funcoes: {}, arquivos: {} };
  }
}

function codigoDoPasso(item) {
  if (item.origem === 'front') {
    const fn = window[item.nome];
    if (typeof fn !== 'function') return '// Não achei a função ' + item.nome;
    return fn.toString();
  }

  if (item.origem === 'arquivo') {
    return (codigoServidor.arquivos && codigoServidor.arquivos[item.arquivo]) || '// Arquivo indisponível.';
  }

  const chave = item.arquivo + '::' + item.nome;
  return (codigoServidor.funcoes && codigoServidor.funcoes[chave]) || '// Não achei ' + chave;
}

function mostrarAcao(acao) {
  acaoVisivel = acao;
  desenharPainel();
  const passos = document.querySelector('#painel-passos');
  if (passos) passos.scrollTop = 0;
}

function publicarAcao(acao, bruto, observacao) {
  const pacote = bruto || {};
  historico[acao] = {
    pedido: pacote.pedido || null,
    resposta: pacote.resposta || null,
    observacao: observacao || null,
  };
  mostrarAcao(acao);
  const caixa = document.querySelector('#painel-resposta');
  if (caixa) caixa.scrollTop = 0;
}

async function executar(acao, trabalho) {
  try {
    const dados = await trabalho();
    publicarAcao(acao, pegarPedidoAtual(), null);
    return dados;
  } catch (erro) {
    publicarAcao(acao, erro.pacote || null, erro.message);
    throw erro;
  }
}

function desenharPainel() {
  const definicao = ACOES[acaoVisivel];
  if (!definicao) return;

  document.querySelector('#painel-titulo').textContent = definicao.titulo;
  document.querySelector('#painel-resumo').textContent = definicao.resumo;
  document.querySelector('#botao-config-banco').classList.toggle('ativo', acaoVisivel === 'config-banco');

  desenharChips();
  desenharPassos(acaoVisivel);
  desenharResposta(acaoVisivel);
}

function desenharChips() {
  const barra = document.querySelector('#painel-chips');
  barra.replaceChildren();

  let tela = 'categorias';
  if (typeof pegarTelaAtual === 'function') tela = pegarTelaAtual();

  const lista = TELAS[tela] || [];
  for (const item of lista) {
    const id = item[0];
    const rotulo = item[1];
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'chip';
    botao.textContent = rotulo;
    botao.setAttribute('aria-pressed', id === acaoVisivel ? 'true' : 'false');
    botao.addEventListener('click', function () {
      mostrarAcao(id);
    });
    barra.append(botao);
  }
}

function desenharPassos(acao) {
  const miolo = document.querySelector('#painel-passos');
  miolo.replaceChildren();
  codigosCopiaveis = [];

  const definicao = ACOES[acao];
  definicao.passos.forEach(function (item, indice) {
    const codigo = codigoDoPasso(item);
    codigosCopiaveis.push(codigo);
    miolo.append(cartaoPasso(item, codigo, indice));
  });
}

function cartaoPasso(item, codigo, indice) {
  const artigo = document.createElement('article');
  artigo.className = 'passo';

  const cabeca = document.createElement('header');
  cabeca.className = 'passo-topo';

  const grupo = document.createElement('div');
  grupo.className = 'passo-id';

  const ordem = document.createElement('span');
  ordem.className = 'ordem';
  ordem.textContent = String(indice + 1);

  const selo = document.createElement('span');
  selo.className = 'selo selo-' + item.camada;
  selo.textContent = rotuloCamada(item.camada);

  const nome = document.createElement('strong');
  nome.textContent = item.nome;

  const arquivo = document.createElement('span');
  arquivo.className = 'arquivo';
  arquivo.textContent = item.arquivo;

  grupo.append(ordem, selo, nome, arquivo);

  const copiar = document.createElement('button');
  copiar.type = 'button';
  copiar.className = 'copiar';
  copiar.dataset.indice = String(indice);
  copiar.textContent = 'Copiar';

  cabeca.append(grupo, copiar);

  const pre = document.createElement('pre');
  pre.className = 'codigo';
  pre.innerHTML = htmlDoCodigo(codigo);

  artigo.append(cabeca, pre);
  return artigo;
}

function desenharResposta(acao) {
  const caixa = document.querySelector('#painel-resposta');
  caixa.replaceChildren();

  const definicao = ACOES[acao];
  const resultado = historico[acao] || null;

  const titulo = document.createElement('h3');
  titulo.className = 'resposta-titulo';
  titulo.textContent = definicao.semHttp ? 'O que observar' : 'Pedido e resposta';
  caixa.append(titulo);

  if (definicao.observacaoFixa) {
    caixa.append(paragrafo('nota', definicao.observacaoFixa));
  }

  if (resultado && resultado.observacao) {
    caixa.append(paragrafo('nota', resultado.observacao));
  }

  const temHttp = resultado && (resultado.pedido || resultado.resposta);
  if (!temHttp) {
    const jaExplicou = definicao.observacaoFixa || (resultado && resultado.observacao);
    if (!jaExplicou) {
      caixa.append(paragrafo('nota', 'Esta ação ainda não rodou nesta sessão. O código acima é o que vai executar.'));
    }
    return;
  }

  if (resultado.pedido) {
    const linha = document.createElement('p');
    linha.className = 'pedido-linha';

    const metodo = document.createElement('span');
    metodo.className = 'metodo';
    metodo.textContent = resultado.pedido.metodo;

    const caminho = document.createElement('span');
    caminho.textContent = resultado.pedido.caminho;

    linha.append(metodo, caminho);
    caixa.append(linha);

    if (resultado.pedido.corpo) {
      caixa.append(preJson(resultado.pedido.corpo));
    }
  }

  if (resultado.resposta) {
    const status = document.createElement('p');
    const ok = resultado.resposta.status < 400;
    status.className = ok ? 'status status-ok' : 'status status-erro';
    status.textContent = textoStatus(resultado.resposta.status);
    caixa.append(status);
    caixa.append(preJson(resultado.resposta.dados));
  }
}

function paragrafo(classe, texto) {
  const p = document.createElement('p');
  p.className = classe;
  p.textContent = texto;
  return p;
}

function preJson(valor) {
  const pre = document.createElement('pre');
  pre.className = 'saida';
  pre.textContent = JSON.stringify(valor, null, 2);
  return pre;
}

function textoStatus(status) {
  const nomes = {
    200: '200 OK',
    201: '201 Created',
    400: '400 Bad Request',
    404: '404 Not Found',
    500: '500 Internal Server Error',
  };
  return nomes[status] || String(status);
}

function rotuloCamada(camada) {
  const nomes = {
    tela: 'Tela',
    navegador: 'Navegador',
    rota: 'Rota',
    banco: 'Banco',
    arquivo: 'Arquivo',
  };
  return nomes[camada] || camada;
}

function ligarPainel() {
  document.querySelector('#botao-config-banco').addEventListener('click', function () {
    mostrarAcao('config-banco');
  });

  document.querySelector('#painel-passos').addEventListener('click', function (evento) {
    const botao = evento.target.closest('button');
    if (!botao || !botao.classList.contains('copiar')) return;

    const codigo = codigosCopiaveis[Number(botao.dataset.indice)] || '';
    const voltar = function () {
      botao.textContent = 'Copiar';
    };

    const pronto = function () {
      botao.textContent = 'Copiado';
      setTimeout(voltar, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codigo).then(pronto);
      return;
    }

    pronto();
  });
}

const PALAVRAS = {
  const: true,
  let: true,
  var: true,
  function: true,
  return: true,
  if: true,
  else: true,
  async: true,
  await: true,
  new: true,
  try: true,
  catch: true,
  throw: true,
  for: true,
  of: true,
  in: true,
  require: true,
  true: true,
  false: true,
  null: true,
  undefined: true,
};

function escaparHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function fimDaString(codigo, inicio, aspas) {
  let i = inicio + 1;
  while (i < codigo.length) {
    if (codigo[i] === '\\') {
      i += 2;
      continue;
    }
    if (codigo[i] === aspas) return i + 1;
    i += 1;
  }
  return codigo.length;
}

function tokenizar(codigo) {
  const tokens = [];
  let i = 0;

  while (i < codigo.length) {
    const dois = codigo.slice(i, i + 2);

    if (dois === '//') {
      const fim = codigo.indexOf('\n', i);
      const ate = fim < 0 ? codigo.length : fim;
      tokens.push({ tipo: 'comentario', texto: codigo.slice(i, ate) });
      i = ate;
      continue;
    }

    if (dois === '/*') {
      const fim = codigo.indexOf('*/', i + 2);
      const ate = fim < 0 ? codigo.length : fim + 2;
      tokens.push({ tipo: 'comentario', texto: codigo.slice(i, ate) });
      i = ate;
      continue;
    }

    const aspas = codigo[i];
    if (aspas === "'" || aspas === '"' || aspas === '`') {
      const fim = fimDaString(codigo, i, aspas);
      tokens.push({ tipo: 'texto', texto: codigo.slice(i, fim) });
      i = fim;
      continue;
    }

    if (codigo[i] === ' ' || codigo[i] === '\t' || codigo[i] === '\n') {
      let j = i + 1;
      while (codigo[j] === ' ' || codigo[j] === '\t' || codigo[j] === '\n') j += 1;
      tokens.push({ tipo: 'plain', texto: codigo.slice(i, j) });
      i = j;
      continue;
    }

    const resto = codigo.slice(i);
    const numero = /^[0-9]+(?:\.[0-9]+)?/.exec(resto);
    const antes = i === 0 ? '' : codigo[i - 1];
    if (numero && !/[A-Za-z0-9_$]/.test(antes)) {
      tokens.push({ tipo: 'numero', texto: numero[0] });
      i += numero[0].length;
      continue;
    }

    const ident = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(resto);
    if (ident) {
      const palavra = ident[0];
      const depois = codigo.slice(i + palavra.length);
      let tipo = 'plain';
      if (PALAVRAS[palavra]) tipo = 'chave';
      else if (/^\s*\(/.test(depois)) tipo = 'funcao';
      tokens.push({ tipo: tipo, texto: palavra });
      i += palavra.length;
      continue;
    }

    tokens.push({ tipo: 'plain', texto: codigo[i] });
    i += 1;
  }

  return tokens;
}

function htmlDoCodigo(codigo) {
  const fonte = codigo.endsWith('\n') ? codigo.slice(0, -1) : codigo;
  const tokens = tokenizar(fonte);
  let html = '<span class="linha">';

  for (const token of tokens) {
    const pedacos = token.texto.split('\n');
    for (let i = 0; i < pedacos.length; i++) {
      if (i > 0) html += '</span><span class="linha">';
      if (pedacos[i]) {
        html += '<span class="tok-' + token.tipo + '">' + escaparHtml(pedacos[i]) + '</span>';
      }
    }
  }

  html += '</span>';
  return html;
}

ligarPainel();
