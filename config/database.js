const path = require('path');

// Este arquivo só guarda configuração.
// Quem abre a conexão é src/banco.js.
//
// SQLite não é um programa separado: as tabelas ficam num arquivo.

module.exports = {
  cliente: 'sqlite',
  arquivo: path.join(__dirname, '..', 'data', 'loja.sqlite'),
};
