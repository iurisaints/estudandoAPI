const { banco } = require('./banco');

function listarProdutos(categoriaId) {
  // A consulta começa sem filtro. Se vier um id, o WHERE entra no SQL.
  let sql = `
    SELECT
      produtos.id,
      produtos.nome,
      produtos.preco,
      produtos.estoque,
      produtos.descricao,
      produtos.categoria_id,
      categorias.nome AS categoria
    FROM produtos
    JOIN categorias ON categorias.id = produtos.categoria_id
  `;

  if (categoriaId) {
    sql += ' WHERE produtos.categoria_id = ?';
  }

  sql += ' ORDER BY produtos.nome';

  const consulta = banco.prepare(sql);
  const linhas = categoriaId ? consulta.all(categoriaId) : consulta.all();

  return linhas.map(function (linha) {
    return {
      id: linha.id,
      nome: linha.nome,
      preco: linha.preco,
      estoque: linha.estoque,
      descricao: linha.descricao,
      categoria_id: linha.categoria_id,
      categoria: linha.categoria,
    };
  });
}

function lerCamposProduto(dados) {
  return {
    nome: String(dados.nome || '').trim(),
    descricao: String(dados.descricao || '').trim(),
    preco: Number(dados.preco),
    estoque: Number(dados.estoque),
    categoriaId: Number(dados.categoria_id),
  };
}

function validarCamposProduto(campos) {
  if (!campos.nome) {
    return { erro: 'Informe o nome do produto.', codigo: 400 };
  }

  if (!Number.isFinite(campos.preco) || campos.preco < 0) {
    return { erro: 'Informe um preço válido.', codigo: 400 };
  }

  if (!Number.isInteger(campos.estoque) || campos.estoque < 0) {
    return { erro: 'O estoque precisa ser um número inteiro zero ou maior.', codigo: 400 };
  }

  if (!Number.isInteger(campos.categoriaId) || campos.categoriaId <= 0) {
    return { erro: 'Escolha uma categoria.', codigo: 400 };
  }

  const categoria = banco.prepare(
    'SELECT id, nome FROM categorias WHERE id = ?'
  ).get(campos.categoriaId);

  if (!categoria) {
    return { erro: 'Essa categoria não existe.', codigo: 400 };
  }

  return { categoria: categoria };
}

function inserirProduto(dados) {
  const campos = lerCamposProduto(dados);
  const validacao = validarCamposProduto(campos);

  if (validacao.erro) return validacao;

  const info = banco.prepare(
    'INSERT INTO produtos (nome, preco, estoque, descricao, categoria_id) VALUES (?, ?, ?, ?, ?)'
  ).run(campos.nome, campos.preco, campos.estoque, campos.descricao, campos.categoriaId);

  return {
    id: Number(info.lastInsertRowid),
    nome: campos.nome,
    preco: campos.preco,
    estoque: campos.estoque,
    descricao: campos.descricao,
    categoria_id: campos.categoriaId,
    categoria: validacao.categoria.nome,
  };
}

function atualizarProduto(id, dados) {
  if (!Number.isInteger(id) || id <= 0) {
    return { erro: 'Id inválido.', codigo: 400 };
  }

  const existe = banco.prepare('SELECT id FROM produtos WHERE id = ?').get(id);
  if (!existe) {
    return { erro: 'Produto não encontrado.', codigo: 404 };
  }

  const campos = lerCamposProduto(dados);
  const validacao = validarCamposProduto(campos);

  if (validacao.erro) return validacao;

  // PUT substitui o produto inteiro pelos campos enviados.
  banco.prepare(
    'UPDATE produtos SET nome = ?, preco = ?, estoque = ?, descricao = ?, categoria_id = ? WHERE id = ?'
  ).run(campos.nome, campos.preco, campos.estoque, campos.descricao, campos.categoriaId, id);

  return {
    id: id,
    nome: campos.nome,
    preco: campos.preco,
    estoque: campos.estoque,
    descricao: campos.descricao,
    categoria_id: campos.categoriaId,
    categoria: validacao.categoria.nome,
  };
}

function excluirProduto(id) {
  if (!Number.isInteger(id) || id <= 0) {
    return { erro: 'Id inválido.', codigo: 400 };
  }

  const info = banco.prepare('DELETE FROM produtos WHERE id = ?').run(id);

  if (info.changes === 0) {
    return { erro: 'Produto não encontrado.', codigo: 404 };
  }

  return { ok: true, id: id };
}

module.exports = {
  listarProdutos,
  inserirProduto,
  atualizarProduto,
  excluirProduto,
  lerCamposProduto,
  validarCamposProduto,
};
