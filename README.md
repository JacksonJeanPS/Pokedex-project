# Pokédex

Pokédex interativa que consome a [PokeAPI](https://pokeapi.co/) para exibir informações sobre Pokémon. Pesquise por nome ou número, filtre por tipo, visualize detalhes completos (stats, habilidades, evolução) e salve seus favoritos.

## Funcionalidades

- Busca por nome ou número da Pokédex (com normalização de acentos e espaços)
- Filtro por tipo de Pokémon
- Paginação com carregamento infinito (Load More)
- Modal de detalhes com sprites, stats, habilidades e cadeia evolutiva
- Sistema de favoritos com localStorage
- Estado de carregamento com skeleton
- Tratamento de erros (Pokémon não encontrado, falha de rede, rate limit)
- Acessibilidade: navegação por teclado, aria-live, alt nas imagens, foco visível
- Design responsivo para mobile e desktop

## Tecnologias

- HTML5
- CSS3
- JavaScript (ES Modules)
- [PokeAPI](https://pokeapi.co/)

## Como rodar localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/JacksonJeanPS/Pokedex-project.git
   ```
2. Abra o `index.html` em um navegador moderno (Chrome, Firefox, Edge).
3. Não é necessário servidor local — o projeto funciona via `file://` protocol.

## Demonstração

> Adicione um print ou GIF da aplicação rodando aqui.

## Créditos

- [PokeAPI](https://pokeapi.co/) — API de Pokémon gratuita
- [Google Fonts](https://fonts.google.com/specimen/Rubik) — Fonte Rubik

## Licença

MIT
