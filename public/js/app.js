'use strict';

let telaAtual = 'categorias';
let categoriaEditando = null;
let produtoEditando = null;
let categoriasEmMemoria = [];
let produtosEmMemoria = [];
let filtroAtual = null;

function pegarTelaAtual() {
  return telaAtual;
}

function avisar(id, texto, tipo) {
  const el = document.querySelector('#' + id);
  if (!texto) {
    el.hidden = true;
    el.textContent = '';
    return;
  }

  el.hidden = false;
  el.textContent = texto;
  el.className = 'aviso ' + (tipo || 'ok');
}

function dinheiro(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function textoEstoque(quantidade) {
  if (quantidade === 0) return 'sem estoque';
  if (quantidade === 1) return '1 em estoque';
  return quantidade + ' em estoque';
}

function ligarNavegacao() {
  const botoes = document.querySelectorAll('#navegacao button');
  for (const botao of botoes) {
    botao.addEventListener('click', function () {
      abrirTela(botao.dataset.tela);
    });
  }
}

function ligarFormularios() {
  document.querySelector('#form-categoria').addEventListener('submit', aoEnviarCategoria);
  document.querySelector('#cancelar-categoria').addEventListener('click', cancelarCategoria);
  document.querySelector('#form-produto').addEventListener('submit', aoEnviarProduto);
  document.querySelector('#cancelar-produto').addEventListener('click', cancelarProduto);
}

function marcarNavegacao() {
  const botoes = document.querySelectorAll('#navegacao button');
  for (const botao of botoes) {
    botao.setAttribute('aria-pressed', botao.dataset.tela === telaAtual ? 'true' : 'false');
  }
}

function mostrarSecao(nome) {
  const telas = document.querySelectorAll('.tela');
  for (const tela of telas) {
    tela.classList.toggle('ativa', tela.id === 'tela-' + nome);
  }
}

async function abrirTela(nome, opcoes) {
  telaAtual = nome;
  marcarNavegacao();
  mostrarSecao(nome);

  if (nome === 'categorias') await carregarCategorias();
  if (nome === 'produtos') await carregarProdutos(opcoes || {});
  if (nome === 'vitrine') await carregarVitrine();
}

function celula(texto, classe) {
  const td = document.createElement('td');
  if (classe) td.className = classe;
  td.textContent = texto;
  return td;
}

function botaoLinha(rotulo, classe, aoClicar) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'botao-texto' + (classe ? ' ' + classe : '');
  botao.textContent = rotulo;
  botao.addEventListener('click', aoClicar);
  return botao;
}

function linhaVazia(texto, colunas) {
  const tr = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colunas;
  td.className = 'vazio';
  td.textContent = texto;
  tr.append(td);
  return tr;
}

function lerCategoria() {
  return {
    nome: document.querySelector('#categoria-nome').value.trim(),
    descricao: document.querySelector('#categoria-descricao').value.trim(),
  };
}

function validarCategoria(dados) {
  if (!dados.nome) return 'Informe o nome da categoria.';
  return '';
}

function limparCategoria() {
  categoriaEditando = null;
  document.querySelector('#form-categoria').reset();
  document.querySelector('#titulo-categoria').textContent = 'Nova categoria';
  document.querySelector('#botao-categoria').textContent = 'Cadastrar categoria';
  document.querySelector('#cancelar-categoria').hidden = true;
}

function cancelarCategoria() {
  limparCategoria();
  avisar('aviso-categoria', '', 'ok');
  mostrarAcao('listar-categorias');
}

function buscarCategoria(id) {
  for (const categoria of categoriasEmMemoria) {
    if (categoria.id === id) return categoria;
  }
  return null;
}

function desenharCategorias(lista) {
  const corpo = document.querySelector('#lista-categorias');
  corpo.replaceChildren();

  if (lista.length === 0) {
    corpo.append(linhaVazia('Nenhuma categoria ainda.', 3));
    return;
  }

  for (const categoria of lista) {
    const linha = document.createElement('tr');
    const acoes = document.createElement('td');
    acoes.className = 'acoes-linha';
    acoes.append(
      botaoLinha('Editar', '', function () {
        aoEditarCategoria(categoria.id);
      }),
      botaoLinha('Excluir', 'perigo', function () {
        aoExcluirCategoria(categoria.id, categoria.nome);
      })
    );

    linha.append(
      celula(categoria.nome),
      celula(categoria.descricao || '—'),
      acoes
    );
    corpo.append(linha);
  }
}

async function recarregarCategorias() {
  const lista = await listarCategorias();
  categoriasEmMemoria = lista;
  desenharCategorias(lista);
}

async function carregarCategorias() {
  limparCategoria();
  try {
    const lista = await executar('listar-categorias', function () {
      return listarCategorias();
    });
    categoriasEmMemoria = lista;
    desenharCategorias(lista);
    document.querySelector('#categoria-nome').focus();
  } catch (falha) {
    avisar('aviso-categoria', falha.message, 'erro');
  }
}

function aoEditarCategoria(id) {
  const categoria = buscarCategoria(id);
  if (!categoria) return;

  categoriaEditando = categoria.id;
  document.querySelector('#titulo-categoria').textContent = 'Editando categoria';
  document.querySelector('#categoria-nome').value = categoria.nome;
  document.querySelector('#categoria-descricao').value = categoria.descricao;
  document.querySelector('#botao-categoria').textContent = 'Salvar categoria';
  document.querySelector('#cancelar-categoria').hidden = false;
  avisar('aviso-categoria', '', 'ok');
  mostrarAcao('preencher-categoria');
  document.querySelector('#categoria-nome').focus();
}

async function aoExcluirCategoria(id, nome) {
  const confirmou = window.confirm('Excluir a categoria "' + nome + '"?');
  if (!confirmou) {
    publicarAcao('excluir-categoria', null, 'Você cancelou. O DELETE não foi enviado.');
    return;
  }

  try {
    await executar('excluir-categoria', function () {
      return excluirCategoria(id);
    });

    if (categoriaEditando === id) limparCategoria();
    await recarregarCategorias();
    avisar('aviso-categoria', 'Categoria excluída.', 'ok');
  } catch (falha) {
    avisar('aviso-categoria', falha.message, 'erro');
  }
}

async function aoEnviarCategoria(evento) {
  // Sem isso o navegador recarregaria a página e o fetch não aconteceria.
  evento.preventDefault();

  const dados = lerCategoria();
  const erro = validarCategoria(dados);
  const acao = categoriaEditando ? 'atualizar-categoria' : 'criar-categoria';

  if (erro) {
    avisar('aviso-categoria', erro, 'erro');
    publicarAcao(acao, null, 'A validação impediu o envio: ' + erro);
    return;
  }

  const botao = document.querySelector('#botao-categoria');
  botao.disabled = true;

  try {
    // executar() escolhe qual código o painel mostra. A rede está dentro da função chamada.
    if (categoriaEditando) {
      await executar('atualizar-categoria', function () {
        return atualizarCategoria(categoriaEditando, dados);
      });
      avisar('aviso-categoria', 'Categoria atualizada.', 'ok');
    } else {
      await executar('criar-categoria', function () {
        return criarCategoria(dados);
      });
      avisar('aviso-categoria', 'Categoria cadastrada.', 'ok');
    }

    limparCategoria();
    await recarregarCategorias();
  } catch (falha) {
    avisar('aviso-categoria', falha.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

function lerProduto() {
  return {
    nome: document.querySelector('#produto-nome').value.trim(),
    preco: document.querySelector('#produto-preco').value.trim(),
    estoque: document.querySelector('#produto-estoque').value.trim(),
    descricao: document.querySelector('#produto-descricao').value.trim(),
    categoria_id: document.querySelector('#produto-categoria').value,
  };
}

function validarProduto(dados) {
  if (!dados.nome) return 'Informe o nome do produto.';
  if (dados.preco === '' || Number(dados.preco) < 0 || Number.isNaN(Number(dados.preco))) {
    return 'Informe um preço válido.';
  }
  if (dados.estoque === '' || !Number.isInteger(Number(dados.estoque)) || Number(dados.estoque) < 0) {
    return 'O estoque precisa ser um número inteiro zero ou maior.';
  }
  if (!dados.categoria_id) return 'Escolha uma categoria.';
  return '';
}

function limparProduto() {
  produtoEditando = null;
  document.querySelector('#form-produto').reset();
  document.querySelector('#titulo-produto').textContent = 'Novo produto';
  document.querySelector('#botao-produto').textContent = 'Cadastrar produto';
  document.querySelector('#cancelar-produto').hidden = true;
}

function cancelarProduto() {
  limparProduto();
  avisar('aviso-produto', '', 'ok');
  mostrarAcao('preparar-produto');
}

function preencherSelectCategorias(lista) {
  const select = document.querySelector('#produto-categoria');
  select.replaceChildren();

  const vazio = document.createElement('option');
  vazio.value = '';
  vazio.textContent = 'Escolha uma categoria';
  select.append(vazio);

  for (const categoria of lista) {
    const opcao = document.createElement('option');
    opcao.value = String(categoria.id);
    opcao.textContent = categoria.nome;
    select.append(opcao);
  }
}

function buscarProduto(id) {
  for (const produto of produtosEmMemoria) {
    if (produto.id === id) return produto;
  }
  return null;
}

function desenharTabelaProdutos(lista) {
  const corpo = document.querySelector('#lista-produtos');
  corpo.replaceChildren();

  if (lista.length === 0) {
    corpo.append(linhaVazia('Nenhum produto ainda.', 5));
    return;
  }

  for (const produto of lista) {
    const linha = document.createElement('tr');
    const acoes = document.createElement('td');
    acoes.className = 'acoes-linha';
    acoes.append(
      botaoLinha('Editar', '', function () {
        aoEditarProduto(produto.id);
      }),
      botaoLinha('Excluir', 'perigo', function () {
        aoExcluirProduto(produto.id, produto.nome);
      })
    );

    linha.append(
      celula(produto.nome),
      celula(produto.categoria),
      celula(dinheiro(produto.preco), 'numero'),
      celula(String(produto.estoque), 'numero'),
      acoes
    );
    corpo.append(linha);
  }
}

async function recarregarProdutosDaTela() {
  if (telaAtual === 'vitrine') {
    const lista = await listarProdutos(filtroAtual);
    produtosEmMemoria = lista;
    desenharFiltros(categoriasEmMemoria);
    desenharVitrine(lista);
    atualizarResumo(lista);
    return;
  }

  const lista = await listarProdutos(null);
  produtosEmMemoria = lista;
  desenharTabelaProdutos(lista);
}

async function carregarProdutos(opcoes) {
  const manter = Boolean(opcoes && opcoes.manterFormulario);

  try {
    categoriasEmMemoria = await listarCategorias();
    preencherSelectCategorias(categoriasEmMemoria);

    const produtos = await listarProdutos(null);
    produtosEmMemoria = produtos;
    desenharTabelaProdutos(produtos);

    if (categoriasEmMemoria.length === 0) {
      avisar('aviso-produto', 'Cadastre uma categoria antes de criar produtos.', 'erro');
    } else if (!manter) {
      avisar('aviso-produto', '', 'ok');
    }

    if (!manter) {
      limparProduto();
      publicarAcao('preparar-produto', pegarPedidoAtual());
      document.querySelector('#produto-nome').focus();
    }
  } catch (falha) {
    avisar('aviso-produto', falha.message, 'erro');
    mostrarAcao('preparar-produto');
  }
}

async function aoEditarProduto(id) {
  const produto = buscarProduto(id);
  if (!produto) return;

  await abrirTela('produtos', { manterFormulario: true });

  produtoEditando = produto.id;
  document.querySelector('#titulo-produto').textContent = 'Editando produto';
  document.querySelector('#produto-nome').value = produto.nome;
  document.querySelector('#produto-preco').value = String(produto.preco);
  document.querySelector('#produto-estoque').value = String(produto.estoque);
  document.querySelector('#produto-descricao').value = produto.descricao || '';
  document.querySelector('#produto-categoria').value = String(produto.categoria_id);
  document.querySelector('#botao-produto').textContent = 'Salvar produto';
  document.querySelector('#cancelar-produto').hidden = false;
  avisar('aviso-produto', '', 'ok');
  mostrarAcao('preencher-produto');
  document.querySelector('#form-produto').scrollIntoView({ block: 'start' });
  document.querySelector('#produto-nome').focus();
}

async function aoExcluirProduto(id, nome) {
  const confirmou = window.confirm('Excluir o produto "' + nome + '"?');
  if (!confirmou) {
    publicarAcao('excluir-produto', null, 'Você cancelou. O DELETE não foi enviado.');
    return;
  }

  try {
    await executar('excluir-produto', function () {
      return excluirProduto(id);
    });

    if (produtoEditando === id) limparProduto();
    await recarregarProdutosDaTela();
    const destino = telaAtual === 'vitrine' ? 'aviso-vitrine' : 'aviso-produto';
    avisar(destino, 'Produto excluído.', 'ok');
  } catch (falha) {
    const destino = telaAtual === 'vitrine' ? 'aviso-vitrine' : 'aviso-produto';
    avisar(destino, falha.message, 'erro');
  }
}

async function aoEnviarProduto(evento) {
  evento.preventDefault();

  const dados = lerProduto();
  const erro = validarProduto(dados);
  const acao = produtoEditando ? 'atualizar-produto' : 'criar-produto';

  if (erro) {
    avisar('aviso-produto', erro, 'erro');
    publicarAcao(acao, null, 'A validação impediu o envio: ' + erro);
    return;
  }

  const botao = document.querySelector('#botao-produto');
  botao.disabled = true;

  try {
    if (produtoEditando) {
      await executar('atualizar-produto', function () {
        return atualizarProduto(produtoEditando, dados);
      });
      avisar('aviso-produto', 'Produto atualizado.', 'ok');
    } else {
      await executar('criar-produto', function () {
        return criarProduto(dados);
      });
      avisar('aviso-produto', 'Produto cadastrado.', 'ok');
    }

    limparProduto();
    await recarregarProdutosDaTela();
  } catch (falha) {
    avisar('aviso-produto', falha.message, 'erro');
  } finally {
    botao.disabled = false;
  }
}

function desenharFiltros(lista) {
  const barra = document.querySelector('#filtros-categoria');
  barra.replaceChildren();
  barra.append(botaoFiltro(null, 'Todas'));

  for (const categoria of lista) {
    barra.append(botaoFiltro(categoria.id, categoria.nome));
  }
}

function botaoFiltro(id, nome) {
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.className = 'filtro';
  if (id === filtroAtual) botao.classList.add('ativo');
  botao.textContent = nome;
  botao.addEventListener('click', function () {
    aoEscolherFiltro(id);
  });
  return botao;
}

function atualizarResumo(lista) {
  const el = document.querySelector('#resumo-vitrine');
  if (lista.length === 0) {
    el.textContent = 'Nenhum produto para esse filtro.';
    return;
  }
  if (lista.length === 1) {
    el.textContent = '1 produto.';
    return;
  }
  el.textContent = lista.length + ' produtos.';
}

function cartaoProduto(produto) {
  const artigo = document.createElement('article');
  artigo.className = 'card-produto';

  const pill = document.createElement('p');
  pill.className = 'pill';
  pill.textContent = produto.categoria;

  const titulo = document.createElement('h3');
  titulo.textContent = produto.nome;

  const preco = document.createElement('p');
  preco.className = 'preco';
  preco.textContent = dinheiro(produto.preco);

  const estoque = document.createElement('p');
  estoque.className = 'estoque';
  estoque.textContent = textoEstoque(produto.estoque);

  const descricao = document.createElement('p');
  descricao.className = 'descricao';
  descricao.textContent = produto.descricao || 'Sem descrição.';

  const acoes = document.createElement('div');
  acoes.className = 'acoes-linha';
  acoes.append(
    botaoLinha('Editar', '', function () {
      aoEditarProduto(produto.id);
    }),
    botaoLinha('Excluir', 'perigo', function () {
      aoExcluirProduto(produto.id, produto.nome);
    })
  );

  artigo.append(pill, titulo, preco, estoque, descricao, acoes);
  return artigo;
}

function desenharVitrine(lista) {
  const grade = document.querySelector('#grade-produtos');
  grade.replaceChildren();

  if (lista.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'vazio';
    vazio.textContent = 'Nenhum produto para esse filtro.';
    grade.append(vazio);
    return;
  }

  for (const produto of lista) {
    grade.append(cartaoProduto(produto));
  }
}

async function aoEscolherFiltro(categoriaId) {
  filtroAtual = categoriaId;
  desenharFiltros(categoriasEmMemoria);

  const acao = categoriaId ? 'filtrar-produtos' : 'listar-produtos';

  try {
    const lista = await executar(acao, function () {
      return listarProdutos(categoriaId);
    });
    produtosEmMemoria = lista;
    desenharVitrine(lista);
    atualizarResumo(lista);
    avisar('aviso-vitrine', '', 'ok');
  } catch (falha) {
    avisar('aviso-vitrine', falha.message, 'erro');
  }
}

async function carregarVitrine() {
  try {
    categoriasEmMemoria = await listarCategorias();
    await aoEscolherFiltro(null);
  } catch (falha) {
    avisar('aviso-vitrine', falha.message, 'erro');
    mostrarAcao('listar-produtos');
  }
}

async function iniciar() {
  ligarNavegacao();
  ligarFormularios();
  await carregarCodigoDoServidor();
  await abrirTela('categorias');
}

iniciar();
