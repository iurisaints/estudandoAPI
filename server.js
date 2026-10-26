const express = require('express');
const path = require('path');
const { prepararBanco } = require('./src/banco');
const {
  listarCategorias,
  inserirCategoria,
  atualizarCategoria,
  excluirCategoria,
} = require('./src/categorias');
const {
  listarProdutos,
  inserirProduto,
  atualizarProduto,
  excluirProduto,
} = require('./src/produtos');
const { lerCodigoParaEstudo } = require('./src/estudo');

const app = express();

app.use(express.json());

function registrarPedido(req, res, next) {
  console.log(req.method + ' ' + req.url);
  next();
}

// Se o SQLite lançar um erro, a resposta continua sendo JSON.
function proteger(rota) {
  return function (req, res) {
    try {
      rota(req, res);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ erro: 'Erro inesperado no servidor.' });
    }
  };
}

function rotaListarCategorias(req, res) {
  res.json(listarCategorias());
}

function rotaCriarCategoria(req, res) {
  const resultado = inserirCategoria(req.body || {});

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  // 201 Created: a categoria acabou de nascer.
  res.status(201).json(resultado);
}

function rotaAtualizarCategoria(req, res) {
  const resultado = atualizarCategoria(Number(req.params.id), req.body || {});

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  res.json(resultado);
}

function rotaExcluirCategoria(req, res) {
  const resultado = excluirCategoria(Number(req.params.id));

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  res.json(resultado);
}

function rotaListarProdutos(req, res) {
  const bruto = req.query.categoria;

  // Sem ?categoria= na URL, a lista volta inteira.
  if (bruto === undefined || bruto === '') {
    res.json(listarProdutos(null));
    return;
  }

  const categoriaId = Number(bruto);

  if (!Number.isInteger(categoriaId) || categoriaId <= 0) {
    res.status(400).json({ erro: 'Categoria inválida.' });
    return;
  }

  res.json(listarProdutos(categoriaId));
}

function rotaCriarProduto(req, res) {
  const resultado = inserirProduto(req.body || {});

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  res.status(201).json(resultado);
}

function rotaAtualizarProduto(req, res) {
  const resultado = atualizarProduto(Number(req.params.id), req.body || {});

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  res.json(resultado);
}

function rotaExcluirProduto(req, res) {
  const resultado = excluirProduto(Number(req.params.id));

  if (resultado.erro) {
    res.status(resultado.codigo || 400).json({ erro: resultado.erro });
    return;
  }

  res.json(resultado);
}

// O painel lê o fonte destes arquivos. Não é uma rota do CRUD.
function rotaCodigoEstudo(req, res) {
  res.set('Cache-Control', 'no-store');
  res.json(lerCodigoParaEstudo());
}

app.use(registrarPedido);

app.get('/api/categorias', proteger(rotaListarCategorias));
app.post('/api/categorias', proteger(rotaCriarCategoria));
app.put('/api/categorias/:id', proteger(rotaAtualizarCategoria));
app.delete('/api/categorias/:id', proteger(rotaExcluirCategoria));

app.get('/api/produtos', proteger(rotaListarProdutos));
app.post('/api/produtos', proteger(rotaCriarProduto));
app.put('/api/produtos/:id', proteger(rotaAtualizarProduto));
app.delete('/api/produtos/:id', proteger(rotaExcluirProduto));

app.get('/api/estudo/codigo', proteger(rotaCodigoEstudo));

app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  maxAge: 0,
  setHeaders: function (res) {
    res.set('Cache-Control', 'no-store');
  },
}));

prepararBanco();

app.listen(3000, function () {
  console.log('Estudo de API aberto em http://localhost:3000');
});
