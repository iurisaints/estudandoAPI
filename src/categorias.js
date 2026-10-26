const { banco } = require('./banco');

function listarCategorias() {
  const linhas = banco.prepare(
    'SELECT id, nome, descricao FROM categorias ORDER BY nome'
  ).all();

  // Cada linha do banco vira um objeto da API.
  return linhas.map(function (linha) {
    return {
      id: linha.id,
      nome: linha.nome,
      descricao: linha.descricao,
    };
  });
}

function inserirCategoria(dados) {
  const nome = String(dados.nome || '').trim();
  const descricao = String(dados.descricao || '').trim();

  if (!nome) {
    return { erro: 'Informe o nome da categoria.', codigo: 400 };
  }

  const info = banco.prepare(
    'INSERT INTO categorias (nome, descricao) VALUES (?, ?)'
  ).run(nome, descricao);

  return {
    id: Number(info.lastInsertRowid),
    nome: nome,
    descricao: descricao,
  };
}

function atualizarCategoria(id, dados) {
  if (!Number.isInteger(id) || id <= 0) {
    return { erro: 'Id inválido.', codigo: 400 };
  }

  const nome = String(dados.nome || '').trim();
  const descricao = String(dados.descricao || '').trim();

  if (!nome) {
    return { erro: 'Informe o nome da categoria.', codigo: 400 };
  }

  const info = banco.prepare(
    'UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?'
  ).run(nome, descricao, id);

  if (info.changes === 0) {
    return { erro: 'Categoria não encontrada.', codigo: 404 };
  }

  return {
    id: id,
    nome: nome,
    descricao: descricao,
  };
}

function excluirCategoria(id) {
  if (!Number.isInteger(id) || id <= 0) {
    return { erro: 'Id inválido.', codigo: 400 };
  }

  const produtoLigado = banco.prepare(
    'SELECT id FROM produtos WHERE categoria_id = ? LIMIT 1'
  ).get(id);

  if (produtoLigado) {
    return {
      erro: 'Essa categoria ainda tem produtos. Exclua os produtos antes.',
      codigo: 400,
    };
  }

  const info = banco.prepare('DELETE FROM categorias WHERE id = ?').run(id);

  if (info.changes === 0) {
    return { erro: 'Categoria não encontrada.', codigo: 404 };
  }

  return { ok: true, id: id };
}

module.exports = {
  listarCategorias,
  inserirCategoria,
  atualizarCategoria,
  excluirCategoria,
};
