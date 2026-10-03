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