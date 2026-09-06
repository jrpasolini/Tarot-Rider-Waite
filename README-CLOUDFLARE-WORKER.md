# Worker de interpretação do Tarot

O arquivo `cloudflare-worker.js` é o código do Worker `tarot-rider-waite-ai`.

## Configuração no painel da Cloudflare

1. Abra **Workers & Pages → tarot-rider-waite-ai → Editar código**.
2. Substitua o conteúdo do editor por `cloudflare-worker.js`.
3. Confirme em **Bindings** que o Workers AI está vinculado com o nome exato `tarot-ai`.
4. Clique em **Deploy**.
5. Abra `https://tarot-rider-waite-ai.antonio-pasolini.workers.dev/health` e confirme que a resposta contém `"ok": true`.

O frontend já aponta para:

`https://tarot-rider-waite-ai.antonio-pasolini.workers.dev/interpretar`

## Contrato

- `GET /health`: confirma que o Worker está publicado.
- `POST /interpretar`: recebe uma pergunta e uma tiragem de uma ou três cartas.
- Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, o mesmo usado pelo Lenormand.
- Origens liberadas: GitHub Pages de `jrpasolini` e servidor local nas portas documentadas.
- A resposta usa JSON estruturado e é renderizada no site somente como texto.

O Tarot continua funcionando como galeria, PWA e oráculo offline. Apenas a interpretação com IA exige conexão.
