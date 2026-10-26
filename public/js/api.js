'use strict';

// var de propósito: painel.js lê o último pedido por pegarPedidoAtual().
// let ficaria preso dentro deste arquivo.
var pedidoAtual = null;

function pegarPedidoAtual() {
  return pedidoAtual;
}

async function requisicao(metodo, caminho, corpo) {
  const opcoes = {
    method: metodo,
    headers: { Accept: 'application/json' },
  };

  // GET e DELETE não levam corpo. POST e PUT levam JSON.
  if (corpo !== undefined) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(corpo);
  }

  const respostaHttp = await fetch(caminho, opcoes);

  let dados = null;
  try {
    dados = await respostaHttp.json();
  } catch (erro) {
    // Às vezes o servidor devolve HTML. Sem isso o json() quebraria o fluxo.
    dados = null;
  }

  pedidoAtual = {
    pedido: {
      metodo: metodo,
      caminho: caminho,
      corpo: corpo === undefined ? null : corpo,
    },
    resposta: {
      status: respostaHttp.status,
      dados: dados,
    },
  };

  if (!respostaHttp.ok) {
    const erro = new Error((dados && dados.erro) || 'A API respondeu com erro.');
    erro.pacote = pedidoAtual;
    throw erro;
  }

  return dados;
}

async function listarCategorias() {
  return requisicao('GET', '/api/categorias');
}

async function criarCategoria(dados) {
  return requisicao('POST', '/api/categorias', dados);
}

async function atualizarCategoria(id, dados) {
  return requisicao('PUT', '/api/categorias/' + id, dados);
}

async function excluirCategoria(id) {
  return requisicao('DELETE', '/api/categorias/' + id);
}

async function listarProdutos(categoriaId) {
  // null lista tudo. Com id, o filtro vai na query string.
  if (categoriaId) {
    return requisicao('GET', '/api/produtos?categoria=' + categoriaId);
  }

  return requisicao('GET', '/api/produtos');
}

async function criarProduto(dados) {
  return requisicao('POST', '/api/produtos', dados);
}

async function atualizarProduto(id, dados) {
  return requisicao('PUT', '/api/produtos/' + id, dados);
}

async function excluirProduto(id) {
  return requisicao('DELETE', '/api/produtos/' + id);
}
