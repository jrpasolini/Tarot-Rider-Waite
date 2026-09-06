const CACHE_NAME = 'tarot-rider-waite-v3-offline';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './fonts/lora-400.ttf',
  './fonts/lora-500.ttf',
  './fonts/lora-600.ttf',
  './fonts/playfair-display-700.ttf',
  './js/cards.js',
  './js/app.js',
  './js/tailwindcss.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

const CARD_IMAGES = [
  './images/cards/01-o-louco.jpg',
  './images/cards/02-o-mago.jpg',
  './images/cards/03-a-sacerdotisa.jpg',
  './images/cards/04-a-imperatriz.jpg',
  './images/cards/05-o-imperador.jpg',
  './images/cards/06-o-hierofante.jpg',
  './images/cards/07-os-amantes.jpg',
  './images/cards/08-o-carro.jpg',
  './images/cards/09-a-forca.jpg',
  './images/cards/10-o-eremita.jpg',
  './images/cards/11-roda-da-fortuna.jpg',
  './images/cards/12-a-justica.jpg',
  './images/cards/13-o-enforcado.jpg',
  './images/cards/14-a-morte.jpg',
  './images/cards/15-a-temperanca.jpg',
  './images/cards/16-o-diabo.jpg',
  './images/cards/17-a-torre.jpg',
  './images/cards/18-a-estrela.jpg',
  './images/cards/19-a-lua.jpg',
  './images/cards/20-o-sol.jpg',
  './images/cards/21-o-julgamento.jpg',
  './images/cards/22-o-mundo.jpg',
  './images/cards/23-as-de-paus.jpg',
  './images/cards/24-dois-de-paus.jpg',
  './images/cards/25-tres-de-paus.jpg',
  './images/cards/26-quatro-de-paus.jpg',
  './images/cards/27-cinco-de-paus.jpg',
  './images/cards/28-seis-de-paus.jpg',
  './images/cards/29-sete-de-paus.jpg',
  './images/cards/30-oito-de-paus.jpg',
  './images/cards/31-nove-de-paus.jpg',
  './images/cards/32-dez-de-paus.jpg',
  './images/cards/33-pajem-de-paus.jpg',
  './images/cards/34-cavaleiro-de-paus.jpg',
  './images/cards/35-rainha-de-paus.jpg',
  './images/cards/36-rei-de-paus.jpg',
  './images/cards/37-as-de-copas.jpg',
  './images/cards/38-dois-de-copas.jpg',
  './images/cards/39-tres-de-copas.jpg',
  './images/cards/40-quatro-de-copas.jpg',
  './images/cards/41-cinco-de-copas.jpg',
  './images/cards/42-seis-de-copas.jpg',
  './images/cards/43-sete-de-copas.jpg',
  './images/cards/44-oito-de-copas.jpg',
  './images/cards/45-nove-de-copas.jpg',
  './images/cards/46-dez-de-copas.jpg',
  './images/cards/47-pajem-de-copas.jpg',
  './images/cards/48-cavaleiro-de-copas.jpg',
  './images/cards/49-rainha-de-copas.jpg',
  './images/cards/50-rei-de-copas.jpg',
  './images/cards/51-as-de-espadas.jpg',
  './images/cards/52-dois-de-espadas.jpg',
  './images/cards/53-tres-de-espadas.jpg',
  './images/cards/54-quatro-de-espadas.jpg',
  './images/cards/55-cinco-de-espadas.jpg',
  './images/cards/56-seis-de-espadas.jpg',
  './images/cards/57-sete-de-espadas.jpg',
  './images/cards/58-oito-de-espadas.jpg',
  './images/cards/59-nove-de-espadas.jpg',
  './images/cards/60-dez-de-espadas.jpg',
  './images/cards/61-pajem-de-espadas.jpg',
  './images/cards/62-cavaleiro-de-espadas.jpg',
  './images/cards/63-rainha-de-espadas.jpg',
  './images/cards/64-rei-de-espadas.jpg',
  './images/cards/65-as-de-ouros.jpg',
  './images/cards/66-dois-de-ouros.jpg',
  './images/cards/67-tres-de-ouros.jpg',
  './images/cards/68-quatro-de-ouros.jpg',
  './images/cards/69-cinco-de-ouros.jpg',
  './images/cards/70-seis-de-ouros.jpg',
  './images/cards/71-sete-de-ouros.jpg',
  './images/cards/72-oito-de-ouros.jpg',
  './images/cards/73-nove-de-ouros.jpg',
  './images/cards/74-dez-de-ouros.jpg',
  './images/cards/75-pajem-de-ouros.jpg',
  './images/cards/76-cavaleiro-de-ouros.jpg',
  './images/cards/77-rainha-de-ouros.jpg',
  './images/cards/78-rei-de-ouros.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...CORE_ASSETS, ...CARD_IMAGES]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Requisições que alteram dados sempre passam pela rede.
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Navegação: tenta a rede e usa o app em cache quando estiver offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Recursos locais: cache first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response && response.ok && response.type !== 'opaque') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => new Response('', { status: 408 }));
    })
  );
});
