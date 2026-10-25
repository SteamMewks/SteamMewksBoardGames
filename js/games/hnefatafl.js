import { board, boardEl, currentRisks, gameOver, inBoard, lastMove, lastMoveMessage, opposite, selected, setHint, set_board, set_currentRisks, set_gameOver, set_lastMove, set_lastMoveMessage, set_selected, set_taflWinner, sideName, taflWinner, turn } from '../core/state.js';
import { finishLearning, strategyEval } from '../core/ai.js';
import { clickCell, drawBoard, finishCustomTurn, rememberCustomHuman, setBoardGrid, setCustomFacing, terminalStatus, updateHint, updatePoints, updateSoloUI } from '../core/ui.js';

export const hnefCorner = (e, t) => (e === 0 || e === 10) && (t === 0 || t === 10);

export const hnefThrone = (e, t) => e === 5 && t === 5;

export const hnefRestricted = (e, t) => hnefCorner(e, t) || hnefThrone(e, t);

export function hnefEval(e, t) {
  const r = hnefWinner(e, null);
  if (r)
    return r === t ? 100000 : -100000;
  const n = hnefKingPos(e);
  let o = 0;
  const a = hnefMovesFrom(e, n.x, n.y), s = a.filter(e => hnefCorner(e.tx, e.ty)).length;
  o += s * 1700 + a.length * 7;
  const i = Math.min(n.x + n.y, n.x + 10 - n.y, 10 - n.x + n.y, 20 - n.x - n.y);
  o -= i * 18;
  for (let t = 0; t < 11; t++)
    for (let r = 0; r < 11; r++) {
      const a = e[t][r];
      if (!a || a === 'wK')
        continue;
      const s = a[0] === 'w' ? 1 : -1;
      o += s * (a[0] === 'w' ? 95 : 65);
      const i = Math.abs(r - n.x) + Math.abs(t - n.y);
      if (i <= 3)
        o += s * (4 - i) * 12;
      for (const [n, i] of [
          [
            1,
            0
          ],
          [
            0,
            1
          ]
        ]) {
        const l = {
            x: r - n,
            y: t - i
          }, u = {
            x: r + n,
            y: t + i
          };
        if (!inBoard(l.x, l.y, 11) || !inBoard(u.x, u.y, 11))
          continue;
        const c = opposite(a[0]);
        if (hnefSupport(e, l.x, l.y, c) && !e[u.y][u.x] || hnefSupport(e, u.x, u.y, c) && !e[l.y][l.x])
          o -= s * 24;
      }
    }
  for (const [t, r] of [
      [
        1,
        0
      ],
      [
        -1,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        -1
      ]
    ])
    if (e[n.y + r]?.[n.x + t]?.[0] === 'b')
      o -= 65;
  return t === 'w' ? o : -o;
}

export function hnefStrategyEval(e, t, r) {
  const n = e.winner || hnefWinner(e.board, r);
  return n ? n === t ? 100000 : -100000 : hnefEval(e.board, t);
}

export function hnefStrategyChildren(e, t, r) {
  const n = [];
  for (const o of hnefAllMoves(e.board, t)) {
    const a = hnefNext(e.board, o, t), s = {
        board: a.board,
        winner: a.winner
      };
    n.push({
      m: o,
      s: s,
      score: a.winner ? a.winner === r ? 100000 : -100000 : strategyEval('hnefatafl', s, r)
    });
  }
  return n;
}

export function hnefInitial() {
  const e = Array.from({ length: 11 }, () => Array(11).fill(''));
  const t = [
    [
      3,
      0
    ],
    [
      4,
      0
    ],
    [
      5,
      0
    ],
    [
      6,
      0
    ],
    [
      7,
      0
    ],
    [
      5,
      1
    ],
    [
      0,
      3
    ],
    [
      10,
      3
    ],
    [
      0,
      4
    ],
    [
      10,
      4
    ],
    [
      0,
      5
    ],
    [
      1,
      5
    ],
    [
      9,
      5
    ],
    [
      10,
      5
    ],
    [
      0,
      6
    ],
    [
      10,
      6
    ],
    [
      0,
      7
    ],
    [
      10,
      7
    ],
    [
      5,
      9
    ],
    [
      3,
      10
    ],
    [
      4,
      10
    ],
    [
      5,
      10
    ],
    [
      6,
      10
    ],
    [
      7,
      10
    ]
  ];
  const r = [
    [
      5,
      3
    ],
    [
      4,
      4
    ],
    [
      5,
      4
    ],
    [
      6,
      4
    ],
    [
      3,
      5
    ],
    [
      4,
      5
    ],
    [
      6,
      5
    ],
    [
      7,
      5
    ],
    [
      4,
      6
    ],
    [
      5,
      6
    ],
    [
      6,
      6
    ],
    [
      5,
      7
    ]
  ];
  for (const [r, n] of t)
    e[n][r] = 'bA';
  for (const [t, n] of r)
    e[n][t] = 'wD';
  e[5][5] = 'wK';
  return e;
}

export function hnefMovesFrom(e, t, r) {
  const n = e[r]?.[t];
  if (!n)
    return [];
  const o = [];
  for (const [a, s] of [
      [
        1,
        0
      ],
      [
        -1,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        -1
      ]
    ])
    for (let i = 1;; i++) {
      const l = t + a * i, u = r + s * i;
      if (!inBoard(l, u, 11) || e[u][l])
        break;
      if (n !== 'wK' && hnefRestricted(l, u)) {
        if (hnefThrone(l, u))
          continue;
        break;
      }
      o.push({
        sx: t,
        sy: r,
        tx: l,
        ty: u
      });
    }
  return o;
}

export function hnefAllMoves(e, t) {
  const r = [];
  for (let n = 0; n < 11; n++)
    for (let o = 0; o < 11; o++)
      if (e[n][o]?.[0] === t)
        r.push(...hnefMovesFrom(e, o, n));
  return r;
}

export function hnefSupport(e, t, r, n) {
  if (!inBoard(t, r, 11))
    return false;
  const o = e[r][t];
  if (o)
    return o[0] === n;
  return hnefRestricted(t, r);
}

export function hnefKingPos(e) {
  for (let t = 0; t < 11; t++)
    for (let r = 0; r < 11; r++)
      if (e[t][r] === 'wK')
        return {
          x: r,
          y: t
        };
  return null;
}

export function hnefKingCaptured(e) {
  const t = hnefKingPos(e);
  if (!t || t.x === 0 || t.x === 10 || t.y === 0 || t.y === 10)
    return !t;
  return [
    [
      1,
      0
    ],
    [
      -1,
      0
    ],
    [
      0,
      1
    ],
    [
      0,
      -1
    ]
  ].every(([r, n]) => {
    const o = t.x + r, a = t.y + n;
    return e[a][o]?.[0] === 'b' || !e[a][o] && hnefThrone(o, a);
  });
}

export function hnefNext(e, t, r) {
  const n = e.map(e => e.slice()), o = n[t.sy][t.sx];
  n[t.sy][t.sx] = '';
  n[t.ty][t.tx] = o;
  let a = 0;
  for (const [e, o] of [
      [
        1,
        0
      ],
      [
        -1,
        0
      ],
      [
        0,
        1
      ],
      [
        0,
        -1
      ]
    ]) {
    const s = t.tx + e, i = t.ty + o, l = t.tx + 2 * e, u = t.ty + 2 * o;
    if (!inBoard(s, i, 11))
      continue;
    const c = n[i][s];
    if (c && c[0] === opposite(r) && c !== 'wK' && hnefSupport(n, l, u, r)) {
      n[i][s] = '';
      a++;
    }
  }
  let s = null;
  const i = hnefKingPos(n);
  if (i && hnefCorner(i.x, i.y))
    s = 'w';
  else if (r === 'b' && hnefKingCaptured(n))
    s = 'b';
  return {
    board: n,
    winner: s,
    captures: a
  };
}

export function hnefWinner(e, t) {
  const r = hnefKingPos(e);
  if (r && hnefCorner(r.x, r.y))
    return 'w';
  if (hnefKingCaptured(e))
    return 'b';
  if (t && !hnefAllMoves(e, t).length)
    return opposite(t);
  return null;
}

export function hnefClick(e, t) {
  if (!inBoard(e, t, 11))
    return;
  const r = board[t][e];
  if (selected) {
    const r = hnefMovesFrom(board, selected.x, selected.y).find(r => r.tx === e && r.ty === t);
    if (r) {
      rememberCustomHuman();
      const e = hnefNext(board, r, turn);
      set_board(e.board);
      set_taflWinner(e.winner);
      set_lastMove(r);
      set_lastMoveMessage(e.captures ? e.captures + '枚を挟み取り\u3002' : '');
      finishCustomTurn();
      return;
    }
  }
  if (r?.[0] === turn) {
    set_selected(selected?.x === e && selected?.y === t ? null : {
      x: e,
      y: t
    });
    setHint('');
    drawBoard();
  } else {
    set_selected(null);
    setHint('自分の駒を選び\u3001縦横の\u25CFへ移動してください\u3002');
    drawBoard();
  }
}

export function hnefEnding() {
  set_taflWinner(taflWinner || hnefWinner(board, turn));
  return taflWinner ? taflWinner === 'w' ? '白\u30FB守備側\uFF1A王の脱出\uFF01' : '黒\u30FB攻撃側\uFF1A王を包囲\uFF01' : '';
}

export function drawHnef() {
  setBoardGrid(11, 'hnefBoard');
  setCustomFacing();
  const e = terminalStatus();
  set_gameOver(!!e);
  finishLearning(e);
  document.getElementById('message').textContent = e || sideName(turn) + 'の手番' + (lastMoveMessage ? ' / ' + lastMoveMessage : '');
  boardEl.innerHTML = '';
  const t = selected ? hnefMovesFrom(board, selected.x, selected.y) : [];
  for (let e = 0; e < 11; e++)
    for (let r = 0; r < 11; r++) {
      const n = document.createElement('div'), o = board[e][r];
      n.className = 'cell ' + ((r + e) % 2 ? 'black' : 'white');
      if (hnefRestricted(r, e))
        n.classList.add('taflRestricted');
      if (hnefCorner(r, e))
        n.classList.add('taflCorner');
      if (o) {
        const e = document.createElement('span');
        e.className = 'piece tableToken ' + (o[0] === 'w' ? 'whitePiece lightToken' : 'blackPiece darkToken') + (o === 'wK' ? ' taflKing' : '');
        e.textContent = o === 'wK' ? '\u2654' : '';
        n.appendChild(e);
      }
      if (selected && selected.x === r && selected.y === e)
        n.classList.add('selected');
      if (t.some(t => t.tx === r && t.ty === e)) {
        n.classList.add('highlight');
        const e = document.createElement('span');
        e.className = 'moveDot';
        n.appendChild(e);
      }
      if (lastMove && (lastMove.sx === r && lastMove.sy === e || lastMove.tx === r && lastMove.ty === e))
        n.classList.add('lastMove');
      n.dataset.x = r;
      n.dataset.y = e;
      n.setAttribute('aria-label', o ? o === 'wK' ? '白の王' : o[0] === 'w' ? '白の守備兵' : '黒の攻撃兵' : '空きマス');
      n.onclick = () => clickCell(r, e);
      boardEl.appendChild(n);
    }
  updateSoloUI([]);
  set_currentRisks([]);
  updateHint();
  updatePoints();
}
