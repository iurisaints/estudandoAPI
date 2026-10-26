const fs = require('fs');
const path = require('path');

// O painel da esquerda pede o código por aqui.
// A lista é fixa de propósito: a rota não recebe nome de arquivo do navegador.
const ARQUIVOS = [
  'config/database.js',
  'src/banco.js',
  'src/categorias.js',
  'src/produtos.js',
  'server.js',
];

function lerArquivo(relativo) {
  const absoluto = path.join(__dirname, '..', relativo);
  return fs.readFileSync(absoluto, 'utf8');
}

function extrairFuncao(fonte, nome) {
  const regex = new RegExp('(?:async\\s+)?function\\s+' + nome + '\\s*\\(');
  const achou = regex.exec(fonte);
  if (!achou) return null;

  const inicio = achou.index;
  let i = fonte.indexOf('{', achou.index);
  if (i < 0) return null;

  let profundidade = 0;
  let modo = 'codigo';

  for (; i < fonte.length; i++) {
    const caractere = fonte[i];
    const proximo = fonte[i + 1];

    if (modo === 'codigo') {
      if (caractere === '/' && proximo === '/') {
        modo = 'linha';
        i++;
        continue;
      }
      if (caractere === '/' && proximo === '*') {
        modo = 'bloco';
        i++;
        continue;
      }
      if (caractere === "'") {
        modo = 'simples';
        continue;
      }
      if (caractere === '"') {
        modo = 'dupla';
        continue;
      }
      if (caractere === '`') {
        modo = 'template';
        continue;
      }
      if (caractere === '{') profundidade++;
      if (caractere === '}') {
        profundidade--;
        if (profundidade === 0) return fonte.slice(inicio, i + 1);
      }
      continue;
    }

    if (modo === 'linha') {
      if (caractere === '\n') modo = 'codigo';
      continue;
    }

    if (modo === 'bloco') {
      if (caractere === '*' && proximo === '/') {
        modo = 'codigo';
        i++;
      }
      continue;
    }

    if (modo === 'simples') {
      if (caractere === '\\') {
        i++;
        continue;
      }
      if (caractere === "'") modo = 'codigo';
      continue;
    }

    if (modo === 'dupla') {
      if (caractere === '\\') {
        i++;
        continue;
      }
      if (caractere === '"') modo = 'codigo';
      continue;
    }

    if (modo === 'template') {
      if (caractere === '\\') {
        i++;
        continue;
      }
      if (caractere === '`') modo = 'codigo';
    }
  }

  return null;
}

function nomesDasFuncoes(fonte) {
  const nomes = [];
  const regex = /(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g;
  let achou = regex.exec(fonte);

  while (achou) {
    nomes.push(achou[1]);
    achou = regex.exec(fonte);
  }

  return nomes;
}

function lerCodigoParaEstudo() {
  const arquivos = {};
  const funcoes = {};

  for (const relativo of ARQUIVOS) {
    const fonte = lerArquivo(relativo);
    arquivos[relativo] = fonte;

    for (const nome of nomesDasFuncoes(fonte)) {
      funcoes[relativo + '::' + nome] = extrairFuncao(fonte, nome);
    }
  }

  return { arquivos, funcoes };
}

module.exports = {
  lerCodigoParaEstudo,
  extrairFuncao,
};
