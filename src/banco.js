const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config/database');

function abrirBanco() {
  // A pasta data/ pode não existir na primeira vez.
  fs.mkdirSync(path.dirname(config.arquivo), { recursive: true });

  const conexao = new DatabaseSync(config.arquivo);

  // Sem isso, a chave estrangeira (produto -> categoria) não é cobrada.
  conexao.exec('PRAGMA foreign_keys = ON');

  return conexao;
}

function criarTabelas() {
  banco.exec(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT ''
    )
  `);

  banco.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      estoque INTEGER NOT NULL DEFAULT 0,
      descricao TEXT NOT NULL DEFAULT '',
      categoria_id INTEGER NOT NULL,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    )
  `);
}

function inserirExemplos() {
  const novaCategoria = banco.prepare(
    'INSERT INTO categorias (nome, descricao) VALUES (?, ?)'
  );

  const eletronicos = novaCategoria.run('Eletrônicos', 'Aparelhos e acessórios.');
  const livros = novaCategoria.run('Livros', 'Leitura de papel e digital.');
  const cozinha = novaCategoria.run('Cozinha', 'Utensílios para o dia a dia.');

  const novoProduto = banco.prepare(
    'INSERT INTO produtos (nome, preco, estoque, descricao, categoria_id) VALUES (?, ?, ?, ?, ?)'
  );

  novoProduto.run('Fone de ouvido', 149.9, 12, 'Com fio e microfone.', Number(eletronicos.lastInsertRowid));
  novoProduto.run('Teclado mecânico', 289, 7, 'Switch tátil, ABNT2.', Number(eletronicos.lastInsertRowid));
  novoProduto.run('O Pequeno Príncipe', 39.9, 20, 'Edição de bolso.', Number(livros.lastInsertRowid));
  novoProduto.run('Panela de pressão', 189.5, 4, 'Capacidade de 4,5 litros.', Number(cozinha.lastInsertRowid));
}

function prepararBanco() {
  criarTabelas();

  // Se você apagar todas as categorias e reiniciar o servidor,
  // os exemplos voltam para a vitrine não abrir vazia.
  const jaTemCategoria = banco.prepare('SELECT id FROM categorias LIMIT 1').get();
  if (!jaTemCategoria) {
    inserirExemplos();
  }
}

const banco = abrirBanco();

module.exports = {
  banco,
  abrirBanco,
  criarTabelas,
  prepararBanco,
  inserirExemplos,
};
