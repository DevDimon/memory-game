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