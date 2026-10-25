import './events.js';
import { getGameModule, registerGameModule } from './core/registry.js';
import { chessEnding, chessInitialBoard } from './games/chess.js';
import { drawFourChess, fourChessInitialBoard, fourClick, fourEnding } from './games/four-chess.js';
import { breakthroughEnding, breakthroughInitial } from './games/breakthrough.js';
import { drawHnef, hnefClick, hnefEnding, hnefInitial } from './games/hnefatafl.js';
import { makeStrategyAI } from './core/ai.js';
import { drawQuoridor, qClick, qEnding, qInitial } from './games/quoridor.js';
import { drawMorris, morrisClick, morrisEnding, morrisInitial } from './games/morris.js';
import { arClick, arEnding, arInitial, arMakeAI } from './games/arimaa.js';
import { cancelAnimations, drawStandardBoard, fitBoard, initializeBoardKeyboard, variantEnding } from './core/ui.js';
import { clickDraughts, draughtsInitial } from './games/checkers.js';
import { board, rPlayerCount } from './core/state.js';
import { drawFourReversi, frEnding, frInitial, reversiClick, reversiInitial } from './games/reversi.js';
import { initializePersistence } from './core/persistence.js';
import { initializePWA } from './core/pwa.js';

'use strict';

registerGameModule('chess', {
  dimension: 8,
  first: 'w',
  ending: chessEnding,
  initial: chessInitialBoard
});

registerGameModule('fourChess', {
  dimension: 14,
  first: 'w',
  ending: fourEnding,
  initial: fourChessInitialBoard,
  draw: drawFourChess,
  click: fourClick
});

registerGameModule('breakthrough', {
  dimension: 8,
  first: 'w',
  ending: breakthroughEnding,
  initial: breakthroughInitial
});

registerGameModule('hnefatafl', {
  dimension: 11,
  first: 'b',
  ending: hnefEnding,
  initial: hnefInitial,
  draw: drawHnef,
  click: hnefClick,
  ai: makeStrategyAI
});

registerGameModule('quoridor', {
  dimension: 9,
  first: 'w',
  ending: qEnding,
  initial: qInitial,
  draw: drawQuoridor,
  click: qClick,
  ai: makeStrategyAI
});

registerGameModule('morris', {
  dimension: 7,
  first: 'w',
  ending: morrisEnding,
  initial: morrisInitial,
  draw: drawMorris,
  click: morrisClick,
  ai: makeStrategyAI
});

registerGameModule('arimaa', {
  dimension: 8,
  first: 'w',
  ending: arEnding,
  initial: arInitial,
  click: arClick,
  ai: arMakeAI
});

registerGameModule('checkers', {
  dimension: 8,
  first: 'w',
  ending: variantEnding,
  initial: draughtsInitial,
  click: clickDraughts
});

registerGameModule('reversi', {
  dimension: 8,
  first: 'b',
  ending: () => rPlayerCount === 4 ? frEnding(board) : variantEnding(),
  initial: () => rPlayerCount === 4 ? frInitial() : reversiInitial(),
  draw: () => rPlayerCount === 4 ? drawFourReversi() : drawStandardBoard(),
  click: reversiClick
});

registerGameModule('chessVariant', {
  ...getGameModule('chess'),
  base: 'chess'
});

window.addEventListener('resize', () => {
  cancelAnimations();
  fitBoard();
});

if (window.visualViewport)
  window.visualViewport.addEventListener('resize', fitBoard);

if (typeof ResizeObserver !== 'undefined')
  new ResizeObserver(fitBoard).observe(document.getElementById('boardWrap'));

initializeBoardKeyboard();

initializePersistence();

initializePWA();
