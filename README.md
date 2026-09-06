# Almanaque de Tarot Rider-Waite

Grimório interativo com as 78 cartas do Tarot Rider-Waite, construído como um site estático responsivo.

## Recursos

- galeria completa com busca por conteúdo;
- filtros por naipe, elemento, signo e planeta;
- página de detalhes para cada carta;
- tiragens de uma carta e de três cartas (Passado, Presente e Futuro);
- imagens armazenadas localmente em `images/cards/`;
- suporte básico a instalação como PWA e cache dos recursos visitados.

## Estrutura

- `index.html`: estrutura das três views principais;
- `css/styles.css`: identidade visual e responsividade;
- `js/cards.js`: dados preservados das 78 cartas;
- `js/app.js`: navegação, busca, filtros, detalhes e tiragens;
- `cartas/`: módulo separado reservado para futuras páginas individuais.

As imagens Rider-Waite utilizadas são de domínio público e foram obtidas a partir de uma coleção baseada no acervo do Wikimedia Commons.
