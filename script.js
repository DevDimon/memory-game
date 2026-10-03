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