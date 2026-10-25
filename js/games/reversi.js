import { animating, board, boardEl, currentRisks, currentThreats, gameOver, gameType, hintOverride, inside, isSoloMode, lastMove, lastMoveMessage, localTurnFlipped, moveAnimations, opposite, playerColor, rPlayerCount, selected, setHint, set_animating, set_currentRisks, set_currentThreats, set_gameOver, set_hintOverride, set_lastMove, set_lastMoveMessage, set_moveAnimations, set_rPlayerCount, set_selected, set_turn, turn } from '../core/state.js';
import { playVariantMove } from '../core/ai.js';
import { fourColorName, fourPieceClass } from './four-chess.js';
import { cancelAnimations, clickCell, drawBoard, recordPosition, setBoardGrid, setCustomFacing, updateHint, updatePoints, updateSoloUI } from '../core/ui.js';

export const frOrder = [
  'b',
  'r',
  'w',
  'u'
];

export function reversiClick(e, t) {
  if (rPlayerCount === 4) {
    frClick(e, t);
    return;
  }
  const r = reversiMoves(board, turn).find(r => r.tx === e && r.ty === t);
  if (r)
    playVariantMove(r);
  else
    setHint('\u25CFがある\u3001相手の石を挟めるマスに置いてください\u3002');
}

export function reversiInitial() {
  const e = Array.from({ length: 8 }, () => Array(8).fill(''));
  e[3][3] = 'wO';
  e[4][4] = 'wO';
  e[3][4] = 'bO';
  e[4][3] = 'bO';
  return e;
}

export function reversiFlips(e, t, r, n) {
  if (!inside(t, r) || e[r][t])
    return [];
  const o = [];
  for (let a = -1; a <= 1; a++)
    for (let s = -1; s <= 1; s++)
      if (s || a) {
        let i = t + s, l = r + a;
        const u = [];
        while (inside(i, l) && e[l][i] === opposite(n) + 'O') {
          u.push({
            x: i,
            y: l
          });
          i += s;
          l += a;
        }
        if (u.length && inside(i, l) && e[l][i] === n + 'O')
          o.push(...u);
      }
  return o;
}

export function reversiMoves(e, t) {
  const r = [];
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++)
      if (reversiFlips(e, o, n, t).length)
        r.push({
          sx: -1,
          sy: -1,
          tx: o,
          ty: n
        });
  return r;
}

export function reversiApply(e, t, r) {
  const n = e.board.map(e => e.slice()), o = reversiFlips(n, t.tx, t.ty, r);
  n[t.ty][t.tx] = r + 'O';
  for (const e of o)
    n[e.y][e.x] = r + 'O';
  let a = opposite(r), s = false;
  if (!reversiMoves(n, a).length && reversiMoves(n, r).length) {
    a = r;
    s = true;
  }
  return {
    board: n,
    chain: null,
    nextColor: a,
    flips: o,
    passed: s
  };
}

export function reversiCounts(e) {
  let t = 0, r = 0;
  for (const n of e)
    for (const e of n) {
      if (e === 'wO')
        t++;
      if (e === 'bO')
        r++;
    }
  return {
    w: t,
    b: r
  };
}

export function reversiWinner(e) {
  if (reversiMoves(e, 'w').length || reversiMoves(e, 'b').length)
    return null;
  const t = reversiCounts(e);
  return t.w === t.b ? 'draw' : t.w > t.b ? 'w' : 'b';
}

export function setReversiPlayers(e) {
  if (gameType !== 'reversi' || ![
      2,
      4
    ].includes(e))
    return;
  set_rPlayerCount(e);
  for (const t of document.querySelectorAll('[data-r-players]'))
    t.setAttribute('aria-pressed', String(Number(t.dataset.rPlayers) === e));
  document.getElementById('localMode').innerHTML = e + '人で対局<small>１台の画面を交互に操作</small>';
  document.getElementById('soloMode').hidden = e === 4;
  document.querySelector('.soloOrder').hidden = e === 4;
  document.getElementById('rPlayerNote').textContent = e === 4 ? '黒\u2192赤\u2192白\u2192青\u3002中央８枚から開始\u30FB４人対戦専用\u3002' : '通常の２人対戦\u3001またはAI戦を選べます\u3002';
}

export function frInitial() {
  const e = Array.from({ length: 8 }, () => Array(8).fill(''));
  for (const [t, r, n] of [
      [
        3,
        2,
        'r'
      ],
      [
        3,
        3,
        'u'
      ],
      [
        4,
        3,
        'r'
      ],
      [
        5,
        3,
        'w'
      ],
      [
        2,
        4,
        'u'
      ],
      [
        3,
        4,
        'b'
      ],
      [
        4,
        4,
        'w'
      ],
      [
        4,
        5,
        'b'
      ]
    ])
    e[r][t] = n + 'O';
  return e;
}

export function frFlips(e, t, r, n) {
  if (!inside(t, r) || e[r][t])
    return [];
  const o = [];
  for (let a = -1; a <= 1; a++)
    for (let s = -1; s <= 1; s++)
      if (s || a) {
        let i = t + s, l = r + a;
        const u = [];
        while (inside(i, l) && e[l][i] && e[l][i] !== n + 'O') {
          u.push({
            x: i,
            y: l
          });
          i += s;
          l += a;
        }
        if (u.length && inside(i, l) && e[l][i] === n + 'O')
          o.push(...u);
      }
  return o;
}

export function frMoves(e, t) {
  const r = [];
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++)
      if (frFlips(e, o, n, t).length)
        r.push({
          x: o,
          y: n
        });
  return r;
}

export function frCounts(e) {
  const t = {
    b: 0,
    r: 0,
    w: 0,
    u: 0
  };
  for (const r of e)
    for (const e of r)
      if (e && e[1] === 'O')
        t[e[0]]++;
  return t;
}

export function frEnding(e) {
  if (frOrder.some(t => frMoves(e, t).length))
    return '';
  const t = frCounts(e), r = Math.max(...Object.values(t)), n = frOrder.filter(e => t[e] === r);
  return (n.length === 1 ? fourColorName(n[0]) + 'の勝ち\uFF01' : n.map(fourColorName).join('\u30FB') + 'が同率１位\uFF01') + ' ' + frOrder.map(e => fourColorName(e) + t[e] + '枚').join(' \uFF0F ');
}

export function frAdvance(e, t) {
  const r = [];
  for (let n = 1; n <= 4; n++) {
    const o = frOrder[(frOrder.indexOf(t) + n) % 4];
    if (frMoves(e, o).length)
      return {
        turn: o,
        skipped: r
      };
    r.push(o);
  }
  return {
    turn: t,
    skipped: r
  };
}

export function frRules() {
  return '４人リバーシ\uFF08遊戯卓版\uFF09\uFF1A８\xD7８盤の中央に\u3001中央４枚\uFF0B外側４枚の風車形で各色２枚ずつ配置\u3002手番は黒\u2192赤\u2192白\u2192青\u3002縦\u30FB横\u30FB斜めに\u3001自分の石と新しく置く石で挟んだ他の色の石を全て自分の色に返します\u3002途中に複数の色が混在していても連続していれば挟めます\u3002空きマスを越えては挟めません\u3002置けない人は自動パスし\u3001全員が置けなくなったら終了\u3002石の最多枚数で勝ち\u3001最多が複数なら同率１位です\u3002４人戦は対人専用です\u3002';
}

export function frClick(e, t) {
  const r = frFlips(board, e, t, turn);
  if (!r.length) {
    setHint('\u25CFのある\u3001他の色の石を挟めるマスを選んでください\u3002');
    return;
  }
  board[t][e] = turn + 'O';
  for (const e of r)
    board[e.y][e.x] = turn + 'O';
  const n = frAdvance(board, turn);
  set_turn(n.turn);
  set_lastMove({
    sx: -1,
    sy: -1,
    tx: e,
    ty: t
  });
  set_lastMoveMessage(r.length + '枚を返しました\u3002' + (n.skipped.length ? ' ' + n.skipped.map(fourColorName).join('\u30FB') + 'はパス\u3002' : ''));
  set_hintOverride('');
  set_selected(null);
  recordPosition();
  drawBoard();
  animateReversi(r, lastMove);
}

export function animateReversi(e, t) {
  cancelAnimations();
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    return;
  const r = [];
  for (const n of [
      ...e,
      {
        x: t.tx,
        y: t.ty
      }
    ]) {
    const e = boardEl.querySelector('[data-x="' + n.x + '"][data-y="' + n.y + '"] .piece');
    if (!e)
      continue;
    const t = localTurnFlipped() || isSoloMode() && playerColor() === 'b' ? ' rotate(180deg)' : '';
    r.push(e.animate([
      { transform: 'scaleX(.1)' + t },
      { transform: 'scaleX(1)' + t }
    ], {
      duration: 230,
      easing: 'ease-out'
    }));
  }
  if (r.length) {
    set_moveAnimations(r);
    set_animating(true);
    Promise.all(r.map(e => e.finished.catch(() => {
    }))).then(() => {
      if (moveAnimations === r) {
        set_moveAnimations([]);
        set_animating(false);
      }
    });
  }
}

export function drawFourReversi() {
  setBoardGrid(8, '');
  setCustomFacing();
  const e = frEnding(board);
  set_gameOver(!!e);
  document.getElementById('message').textContent = e || fourColorName(turn) + 'の手番' + (lastMoveMessage ? ' \uFF0F ' + lastMoveMessage : '');
  const t = frCounts(board);
  document.getElementById('normalTools').textContent = frOrder.map(e => (!gameOver && e === turn ? '\u25B6' : '') + fourColorName(e) + ' ' + t[e] + '枚').join(' \uFF0F ');
  boardEl.innerHTML = '';
  const r = gameOver ? [] : frMoves(board, turn);
  for (let e = 0; e < 8; e++)
    for (let t = 0; t < 8; t++) {
      const n = document.createElement('div'), o = board[e][t];
      n.className = 'cell ' + ((t + e) % 2 ? 'black' : 'white');
      if (o) {
        const e = document.createElement('span');
        e.className = 'piece tableToken ' + fourPieceClass(o[0]) + ' ' + {
          w: 'lightToken',
          b: 'darkToken',
          r: 'redToken',
          u: 'blueToken'
        }[o[0]];
        n.appendChild(e);
      }
      if (r.some(r => r.x === t && r.y === e)) {
        n.classList.add('highlight');
        const e = document.createElement('span');
        e.className = 'moveDot';
        n.appendChild(e);
      }
      if (lastMove?.tx === t && lastMove?.ty === e)
        n.classList.add('lastMove');
      n.dataset.x = t;
      n.dataset.y = e;
      n.setAttribute('aria-label', (o ? fourColorName(o[0]) + 'の石' : '空きマス') + ' ' + (t + 1) + '列' + (e + 1) + '行');
      n.onclick = () => clickCell(t, e);
      boardEl.appendChild(n);
    }
  updateSoloUI([]);
  set_currentRisks([]);
  set_currentThreats([]);
  updateHint();
  updatePoints();
}
