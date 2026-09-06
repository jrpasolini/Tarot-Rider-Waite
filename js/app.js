(() => {
    'use strict';

    const cards = cardDatabase.map((card, id) => ({ ...card, id }));
    const cardGrid = document.getElementById('card-grid');
    const searchInput = document.getElementById('search-input');
    const filterInfo = document.getElementById('filter-info');
    const resultsCount = document.getElementById('results-count');
    const exploreMenu = document.getElementById('explore-menu');
    const exploreMenuButton = document.getElementById('explore-menu-button');
    const questionInput = document.getElementById('oracle-question');
    const questionCount = document.getElementById('oracle-question-count');
    const shuffleContainer = document.getElementById('shuffle-animation-container');
    const drawButton = document.getElementById('draw-button');
    const drawThreeButton = document.getElementById('draw-three-button');
    const installAppButton = document.getElementById('install-app-button');
    const installAppStatus = document.getElementById('install-app-status');

    const propertyMap = {
        naipe: 'Naipe',
        elemento: 'Elemento',
        signo: 'Signo',
        planeta: 'Planeta'
    };

    let currentFilter = { type: null, value: null };
    let currentDetailFromDraw = false;
    let currentDraw = [];
    let deferredInstallPrompt = null;

    const escapeHtml = value => String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const normalize = value => String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const list = value => Array.isArray(value) ? value : (value ? [value] : []);
    const joinList = value => list(value).map(escapeHtml).join(', ');

    function cardNumber(card) {
        if (card.naipe === 'Arcanos Maiores') return String(card.numero).padStart(2, '0');
        const labels = { 1: 'Ás', 11: 'Pajem', 12: 'Cavaleiro', 13: 'Rainha', 14: 'Rei' };
        return labels[card.numero] || card.numero;
    }

    function elementClass(value) {
        return normalize(value).replace(/[^a-z0-9]+/g, '-');
    }

    function searchableText(card) {
        return normalize([
            card.nome, card.naipe, card.elemento, card.signo, card.planeta,
            card.descricao, card.interpretacao_imagem,
            ...list(card.palavras_chave), ...list(card.palavras_chave_invertido),
            ...list(card.cristais), ...list(card.ervas), ...list(card.aromaterapia)
        ].join(' '));
    }

    function populateExploreMenu() {
        const content = exploreMenu.firstElementChild;
        content.innerHTML = '';

        Object.entries(propertyMap).forEach(([property, label]) => {
            const values = [...new Set(cards.map(card => card[property]).filter(Boolean))]
                .sort((a, b) => a.localeCompare(b, 'pt-BR'));
            const heading = document.createElement('p');
            heading.className = 'px-4 py-2 text-sm font-bold text-amber-700';
            heading.textContent = label;
            content.appendChild(heading);

            values.forEach(value => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'w-full text-left text-amber-800 block px-4 py-2 text-sm hover:bg-amber-100';
                item.textContent = value;
                item.addEventListener('click', () => {
                    currentFilter = { type: property, value };
                    searchInput.value = '';
                    renderCards();
                    showView('home-view', true);
                    closeExploreMenu();
                });
                content.appendChild(item);
            });

            const divider = document.createElement('hr');
            divider.className = 'border-amber-900/10';
            content.appendChild(divider);
        });

        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'w-full text-left text-red-700 block px-4 py-2 text-sm font-bold hover:bg-red-100';
        clear.textContent = 'Limpar filtro';
        clear.addEventListener('click', () => {
            currentFilter = { type: null, value: null };
            searchInput.value = '';
            renderCards();
            closeExploreMenu();
        });
        content.appendChild(clear);
    }

    function closeExploreMenu() {
        exploreMenu.classList.add('hidden');
        exploreMenuButton.setAttribute('aria-expanded', 'false');
    }

    function renderCards() {
        const term = normalize(searchInput.value.trim());
        let visible = cards;

        if (term) {
            currentFilter = { type: null, value: null };
            visible = cards.filter(card => searchableText(card).includes(term));
            filterInfo.textContent = `Resultados para “${searchInput.value.trim()}”`;
            filterInfo.classList.remove('hidden');
        } else if (currentFilter.type && currentFilter.value) {
            visible = cards.filter(card => card[currentFilter.type] === currentFilter.value);
            filterInfo.textContent = `${propertyMap[currentFilter.type]}: ${currentFilter.value}`;
            filterInfo.classList.remove('hidden');
        } else {
            filterInfo.classList.add('hidden');
        }

        resultsCount.textContent = `${visible.length} ${visible.length === 1 ? 'carta' : 'cartas'}`;
        cardGrid.innerHTML = '';

        if (!visible.length) {
            cardGrid.innerHTML = '<p class="col-span-full text-center text-xl text-amber-800">Nenhuma carta encontrada.</p>';
            return;
        }

        visible.forEach(card => {
            const item = document.createElement('article');
            const cls = elementClass(card.elemento);
            item.className = 'oracle-card text-center cursor-pointer group';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.setAttribute('aria-label', `Abrir ${card.nome}`);
            item.innerHTML = `
                <div class="oracle-card-frame">
                    <img src="${escapeHtml(card.imagem)}" alt="${escapeHtml(card.nome)}" class="w-full h-auto rounded-xl" loading="lazy">
                    <span class="card-number-badge">${escapeHtml(cardNumber(card))}</span>
                    <span class="card-element-label"><span class="element-inline-dot element-${cls}"></span>${escapeHtml(card.elemento)}</span>
                </div>
                <div class="pt-3 px-1">
                    <h3 class="font-playfair text-xl card-title-home">${escapeHtml(card.nome)}</h3>
                    <p class="text-[0.72rem] uppercase tracking-[0.18em] opacity-60 mt-1">${escapeHtml(card.naipe)}</p>
                </div>`;

            const open = () => showCardDetail(card.id, false);
            item.addEventListener('click', open);
            item.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open();
                }
            });
            cardGrid.appendChild(item);
        });
    }

    function showView(viewId, preserveDraw = false) {
        ['home-view', 'card-detail-view', 'random-draw-view'].forEach(id => {
            document.getElementById(id).classList.toggle('hidden', id !== viewId);
        });
        document.querySelectorAll('[data-gallery-only]').forEach(node => {
            node.classList.toggle('hidden', viewId !== 'home-view');
        });
        if (viewId !== 'home-view') closeExploreMenu();
        if (viewId === 'random-draw-view' && !preserveDraw) resetDraw();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function detailSection(title, body) {
        if (!body) return '';
        return `<section class="detail-section"><h3 class="font-playfair text-3xl mb-2 border-b-2 border-current/20 pb-2">${title}</h3>${body}</section>`;
    }

    function showCardDetail(id, fromDraw) {
        const card = cards.find(item => item.id === id);
        if (!card) return;
        currentDetailFromDraw = fromDraw;

        const detailView = document.getElementById('card-detail-view');
        const cls = elementClass(card.elemento);
        const light = ['fogo', 'terra', 'agua'].includes(cls);
        detailView.className = `hidden p-4 md:p-8 oracle-panel element-bg-${cls} ${light ? 'text-light' : 'text-dark'}`;
        document.getElementById('return-draw-button').classList.toggle('hidden', !fromDraw);

        const response = card.resposta_rapida
            ? `<li><strong>❓ Resposta rápida:</strong> <strong>${escapeHtml(card.resposta_rapida)}</strong>${card.justificativa_resposta ? ` — <em>${escapeHtml(card.justificativa_resposta)}</em>` : ''}</li><hr class="border-current/20 my-2">`
            : '';

        document.getElementById('card-detail-content').innerHTML = `
            <div class="md:col-span-1 flex flex-col items-center gap-5">
                <div class="detail-image-card"><img src="${escapeHtml(card.imagem)}" alt="${escapeHtml(card.nome)}" class="shadow-2xl"></div>
                <div class="w-full max-w-sm correspondence-panel p-5 rounded-[1.4rem]">
                    <h3 class="font-playfair text-2xl mb-4 text-center">Correspondências</h3>
                    <ul class="space-y-2 text-sm md:text-base">
                        ${response}
                        <li><strong>🔥 Elemento:</strong> ${escapeHtml(card.elemento)}</li>
                        <li><strong>🃏 Naipe:</strong> ${escapeHtml(card.naipe)}</li>
                        <li><strong>🪐 Planeta:</strong> ${escapeHtml(card.planeta)}</li>
                        <li><strong>✨ Signo:</strong> ${escapeHtml(card.signo)}</li>
                    </ul>
                </div>
            </div>
            <div class="md:col-span-2 space-y-5">
                <div>
                    <div class="flex flex-wrap items-center gap-3 mb-3"><span class="element-pill element-${cls}">${escapeHtml(card.elemento)}</span><span class="text-sm opacity-75">${escapeHtml(card.naipe)} • ${escapeHtml(cardNumber(card))}</span></div>
                    <h2 class="font-playfair text-4xl md:text-5xl leading-tight">${escapeHtml(card.nome)}</h2>
                </div>
                ${detailSection('Palavras-chave', `<p class="italic">${joinList(card.palavras_chave)}.</p>`)}
                ${detailSection('Quando invertida', `<p class="italic">${joinList(card.palavras_chave_invertido)}.</p>`)}
                ${detailSection('Essência e significados', `<p class="whitespace-pre-wrap">${escapeHtml(card.descricao)}</p>`)}
                ${detailSection('Interpretação da imagem', `<p class="whitespace-pre-wrap">${escapeHtml(card.interpretacao_imagem)}</p>`)}
                ${detailSection('Afinidades mágicas', `
                    ${list(card.cristais).length ? `<p><strong>💎 Cristais:</strong> ${joinList(card.cristais)}.</p>` : ''}
                    ${list(card.ervas).length ? `<p><strong>🌿 Ervas:</strong> ${joinList(card.ervas)}.</p>` : ''}
                    ${list(card.aromaterapia).length ? `<p><strong>🌸 Aromaterapia:</strong> ${joinList(card.aromaterapia)}.</p>` : ''}`)}
                ${detailSection('Referências cabalísticas', `<p class="whitespace-pre-wrap">${escapeHtml(card.referencias_cabalisticas)}</p>`)}
            </div>`;

        showView('card-detail-view', true);
    }

    function resetDraw() {
        currentDraw = [];
        shuffleContainer.innerHTML = '';
        shuffleContainer.classList.add('hidden');
        drawButton.disabled = false;
        drawThreeButton.disabled = false;
        drawButton.textContent = 'Tirar uma carta';
        drawThreeButton.textContent = 'Tirar três cartas';
    }

    function drawCards(count) {
        drawButton.disabled = true;
        drawThreeButton.disabled = true;
        (count === 1 ? drawButton : drawThreeButton).textContent = 'Embaralhando...';
        shuffleContainer.innerHTML = '';
        shuffleContainer.classList.remove('hidden');

        const pool = [...cards];
        currentDraw = Array.from({ length: count }, () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        const positions = ['Passado', 'Presente', 'Futuro'];

        currentDraw.forEach((card, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'shuffle-container draw-card-wrap flex flex-col items-center';
            wrapper.innerHTML = `
                ${count === 3 ? `<div class="draw-position-label"><span>${index + 1}</span>${positions[index]}</div>` : ''}
                <div class="card-flip cursor-pointer" role="button" tabindex="0" aria-label="Revelar ${escapeHtml(card.nome)}">
                    <div class="card-face card-face-back"><div class="card-back-ornament" aria-hidden="true"><span class="card-back-moon">☾</span><span class="card-back-star">✦</span><span class="card-back-moon">☽</span></div></div>
                    <div class="card-face card-face-front"><img src="${escapeHtml(card.imagem)}" alt="${escapeHtml(card.nome)}" class="w-full h-full object-cover rounded-lg"></div>
                </div>
                <p class="draw-card-label opacity-0 transition-opacity duration-1000 text-center">${escapeHtml(card.nome)}</p>`;
            shuffleContainer.appendChild(wrapper);

            const flip = wrapper.querySelector('.card-flip');
            const label = wrapper.querySelector('.draw-card-label');
            const open = () => flip.classList.contains('is-flipped') && showCardDetail(card.id, true);
            flip.addEventListener('click', open);
            flip.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open();
                }
            });
            window.setTimeout(() => {
                flip.classList.add('is-flipped');
                label.classList.remove('opacity-0');
            }, 500 + index * 900);
        });

        window.setTimeout(() => {
            drawButton.disabled = false;
            drawThreeButton.disabled = false;
            drawButton.textContent = count === 1 ? 'Tirar outra carta' : 'Tirar uma carta';
            drawThreeButton.textContent = count === 3 ? 'Nova tiragem de três cartas' : 'Tirar três cartas';
        }, 900 + count * 900);
    }

    function isInstalledApp() {
        return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
    }

    function hideInstallInterface() {
        installAppButton.classList.add('hidden');
        installAppStatus.classList.add('hidden');
        installAppStatus.textContent = '';
    }

    function prepareInstallExperience() {
        if (isInstalledApp()) {
            hideInstallInterface();
            return;
        }

        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (isIos) {
            installAppButton.innerHTML = '<span aria-hidden="true">⇧</span> Como instalar';
            installAppButton.classList.remove('hidden');
        }
    }

    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installAppButton.innerHTML = '<span aria-hidden="true">⇩</span> Instalar aplicativo';
        installAppButton.classList.remove('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        hideInstallInterface();
    });

    installAppButton.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            deferredInstallPrompt = null;

            if (outcome === 'accepted') {
                hideInstallInterface();
            } else {
                installAppButton.classList.add('hidden');
                installAppStatus.textContent = 'A instalação foi cancelada. Você ainda pode instalá-lo pelo menu do navegador.';
                installAppStatus.classList.remove('hidden');
            }
            return;
        }

        installAppStatus.textContent = 'No iPhone ou iPad, toque em Compartilhar e depois em “Adicionar à Tela de Início”.';
        installAppStatus.classList.toggle('hidden');
    });

    document.querySelectorAll('[data-view]').forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.view === 'home-view') {
                currentFilter = { type: null, value: null };
                searchInput.value = '';
                renderCards();
            }
            showView(button.dataset.view);
        });
    });
    document.getElementById('return-gallery-button').addEventListener('click', () => {
        if (currentDetailFromDraw) {
            currentFilter = { type: null, value: null };
            searchInput.value = '';
            renderCards();
        }
        showView('home-view', true);
    });
    document.getElementById('return-draw-button').addEventListener('click', () => showView('random-draw-view', true));
    searchInput.addEventListener('input', renderCards);
    questionInput.addEventListener('input', () => questionCount.textContent = `${questionInput.value.length}/800`);
    drawButton.addEventListener('click', () => drawCards(1));
    drawThreeButton.addEventListener('click', () => drawCards(3));
    exploreMenuButton.addEventListener('click', () => {
        const open = exploreMenu.classList.contains('hidden');
        exploreMenu.classList.toggle('hidden');
        exploreMenuButton.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => {
        if (!exploreMenu.contains(event.target) && !exploreMenuButton.contains(event.target)) closeExploreMenu();
    });

    populateExploreMenu();
    renderCards();
    prepareInstallExperience();
})();
