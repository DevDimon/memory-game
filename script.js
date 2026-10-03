'use strict';

const CARD_IMAGES = [
    'images/hamster-1.png',
    'images/hamster-2.png',
    'images/hamster-3.png',
    'images/hamster-4.png',
    'images/hamster-5.png',
    'images/hamster-6.png',
    'images/hamster-7.png',
    'images/hamster-8.png',
];
const PAIRS_TOTAL = CARD_IMAGES.length;
const MISMATCH_DELAY = 1000;
const STORAGE_KEY = 'memory-game-results';
const MAX_RESULTS = 10;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined && text !== null) {
        node.textContent = text;
    }
    return node;
}

function button(className, text) {
    const btn = el('button', className, text);
    btn.type = 'button';
    return btn;
}

function clearNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function shuffle(items) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${date.getFullYear()}`;
}

function loadResults() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(
            (item) =>
                item &&
                typeof item.moves === 'number' &&
                Number.isFinite(item.moves) &&
                typeof item.date === 'string',
        );
    } catch (error) {
        return [];
    }
}

function sortResults(results) {
    return results.slice().sort((a, b) => {
        if (a.moves !== b.moves) {
            return a.moves - b.moves;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
}

function saveResult(moves) {
    const results = loadResults();
    results.push({ moves, date: new Date().toISOString() });
    const top = sortResults(results).slice(0, MAX_RESULTS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
    } catch (error) {

    }
}

function createModal() {
    const overlay = el('div', 'modal-overlay');
    overlay.hidden = true;

    const dialog = el('div', 'modal');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.tabIndex = -1;

    const content = el('div', 'modal__content');
    dialog.append(content);
    overlay.append(dialog);

    let isOpen = false;
    let closeCallback = null;

    function close() {
        if (!isOpen) {
            return;
        }
        isOpen = false;
        overlay.hidden = true;
        document.body.classList.remove('modal-open');

        const callback = closeCallback;
        closeCallback = null;
        if (typeof callback === 'function') {
            callback();
        }
    }

    function open(config) {
        clearNode(content);

        if (config.title) {
            content.append(el('h2', 'modal__title', config.title));
        }
        if (config.body) {
            content.append(config.body);
        }
        if (Array.isArray(config.actions) && config.actions.length > 0) {
            const footer = el('div', 'modal__actions');
            config.actions.forEach((actionButton) => footer.append(actionButton));
            content.append(footer);
        }

        closeCallback = typeof config.onClose === 'function' ? config.onClose : null;
        isOpen = true;
        overlay.hidden = false;
        document.body.classList.add('modal-open');
        dialog.focus();
    }

    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
            close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (isOpen && event.key === 'Escape') {
            event.preventDefault();
            close();
        }
    });

    document.body.append(overlay);

    return {
        open,
        close,
        isOpen: () => isOpen,
    };
}

const app = el('div', 'app');

const header = el('header', 'header');
const headerTitle = el('h1', 'header__title', 'Memory Game');
const headerActions = el('div', 'header__actions');
const newGameButton = button('btn btn--primary', 'Новая игра');
const leaderboardButton = button('btn', 'Таблица лидеров');
headerActions.append(newGameButton, leaderboardButton);
header.append(headerTitle, headerActions);

const movesValueEl = el('span', 'stat__value', '0');
const movesStat = el('div', 'stat');
movesStat.append(el('span', 'stat__label', 'Ходы:'), movesValueEl);

const pairsValueEl = el('span', 'stat__value', `0 / ${PAIRS_TOTAL}`);
const pairsStat = el('div', 'stat');
pairsStat.append(el('span', 'stat__label', 'Найдено пар:'), pairsValueEl);

const stats = el('div', 'stats');
stats.append(movesStat, pairsStat);

const board = el('div', 'board');

const main = el('main', 'main');
main.append(stats, board);

app.append(header, main);
document.body.append(app);

const victoryModal = createModal();
const leaderboardModal = createModal();

const state = {
    firstCard: null,
    lock: false,
    moves: 0,
    matched: 0,
    timeoutId: null,
    finished: false,
};

function createCard(value) {
    const cardElement = button('card', null);
    cardElement.setAttribute('aria-label', 'Карточка, закрыта');

    const inner = el('span', 'card__inner');
    const backFace = el('span', 'card__face card__face--back');
    const frontFace = el('span', 'card__face card__face--front');

    const img = document.createElement('img');
    img.src = value;
    img.alt = 'Хомяк';
    img.className = 'card__image';

    frontFace.append(img);
    inner.append(backFace, frontFace);
    cardElement.append(inner);

    const card = {
        value,
        element: cardElement,
        flipped: false,
        matched: false,
    };

    cardElement.addEventListener('click', () => handleCardClick(card));

    return card;
}

function buildBoard() {
    clearNode(board);
    const values = shuffle(CARD_IMAGES.concat(CARD_IMAGES));
    values.forEach((value) => board.append(createCard(value).element));
}

function revealCard(card) {
    card.flipped = true;
    card.element.classList.add('is-flipped');
    card.element.setAttribute('aria-label', 'Карточка, открыта');
}

function hideCard(card) {
    card.flipped = false;
    card.element.classList.remove('is-flipped');
    card.element.setAttribute('aria-label', 'Карточка, закрыта');
}

function markAsMatched(card) {
    card.matched = true;
    card.element.classList.add('is-matched');
    card.element.setAttribute('aria-label', 'Карточка, пара найдена');
}

function updateStats() {
    movesValueEl.textContent = String(state.moves);
    pairsValueEl.textContent = `${state.matched} / ${PAIRS_TOTAL}`;
}

function handleCardClick(card) {
    if (state.lock || state.finished) {
        return;
    }
    if (card.flipped || card.matched) {
        return;
    }

    revealCard(card);

    if (!state.firstCard) {
        state.firstCard = card;
        return;
    }

    const firstCard = state.firstCard;
    state.firstCard = null;

    state.moves += 1;
    updateStats();

    if (firstCard.value === card.value) {
        markAsMatched(firstCard);
        markAsMatched(card);
        state.matched += 1;
        updateStats();

        if (state.matched === PAIRS_TOTAL) {
            finishGame();
        }
        return;
    }

    state.lock = true;
    state.timeoutId = setTimeout(() => {
        state.timeoutId = null;
        hideCard(firstCard);
        hideCard(card);
        state.lock = false;
    }, MISMATCH_DELAY);
}

function cancelPendingTimer() {
    if (state.timeoutId !== null) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
    }
}

function startNewGame() {
    cancelPendingTimer();

    state.firstCard = null;
    state.lock = false;
    state.moves = 0;
    state.matched = 0;
    state.finished = false;

    if (victoryModal.isOpen()) {
        victoryModal.close();
    }

    buildBoard();
    updateStats();
}

function finishGame() {
    state.finished = true;
    saveResult(state.moves);
    showVictoryModal(state.moves);
}

function showVictoryModal(moves) {
    const body = el('div', 'modal__body');
    body.append(el('p', 'modal__message', 'Поздравляем! Вы нашли всех хомяков!'));
    body.append(el('p', 'modal__result', `Количество ходов: ${moves}`));

    const newGameBtn = button('btn btn--primary', 'Новая игра');
    newGameBtn.addEventListener('click', () => {
        victoryModal.close();
        startNewGame();
    });

    const closeBtn = button('btn', 'Закрыть');
    closeBtn.addEventListener('click', () => {
        victoryModal.close();
    });

    victoryModal.open({
        title: 'Победа!',
        body,
        actions: [newGameBtn, closeBtn],
    });
}

function buildLeaderboardTable(results) {
    const table = el('table', 'leaders');

    const thead = el('thead');
    const headRow = el('tr');
    ['Место', 'Ходы', 'Дата'].forEach((label) => {
        const th = el('th', null, label);
        th.scope = 'col';
        headRow.append(th);
    });
    thead.append(headRow);

    const tbody = el('tbody');
    results.forEach((result, index) => {
        const row = el('tr');
        row.append(el('td', null, String(index + 1)));
        row.append(el('td', null, String(result.moves)));
        row.append(el('td', null, formatDate(result.date)));
        tbody.append(row);
    });

    table.append(thead, tbody);
    return table;
}

function openLeaderboard() {
    const results = sortResults(loadResults()).slice(0, MAX_RESULTS);

    const body =
        results.length === 0
            ? el('p', 'modal__message', 'Пока нет результатов.')
            : buildLeaderboardTable(results);

    const closeBtn = button('btn', 'Закрыть');
    closeBtn.addEventListener('click', () => {
        leaderboardModal.close();
    });

    leaderboardModal.open({
        title: 'Таблица лидеров',
        body,
        actions: [closeBtn],
    });
}

newGameButton.addEventListener('click', startNewGame);
leaderboardButton.addEventListener('click', openLeaderboard);

startNewGame();