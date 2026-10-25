import { finishLearning, strategyEval } from '../core/ai.js';
import { aiThinking, board, boardEl, currentRisks, gameOver, isAITurn, isSoloMode, lastMove, lastMoveMessage, morris, opposite, selected, setHint, set_currentRisks, set_gameOver, set_lastMove, set_lastMoveMessage, set_morris, set_selected, sideName, turn } from '../core/state.js';
import { clickCell, drawBoard, finishCustomTurn, rememberCustomHuman, setBoardGrid, setCustomFacing, terminalStatus, updateHint, updatePoints, updateSoloUI } from '../core/ui.js';

export const MORRIS_POINTS = [
  [
    0,
    0
  ],
  [
    3,
    0
  ],
  [
    6,
    0
  ],
  [
    6,
    3
  ],
  [
    6,
    6
  ],
  [
    3,
    6
  ],
  [
    0,
    6
  ],
  [
    0,
    3
  ],
  [
    1,
    1
  ],
  [
    3,
    1
  ],
  [
    5,
    1
  ],
  [
    5,
    3
  ],
  [
    5,
    5
  ],
  [
    3,
    5
  ],
  [
    1,
    5
  ],
  [
    1,
    3
  ],
  [
    2,
    2
  ],
  [
    3,
    2
  ],
  [
    4,
    2
  ],
  [
    4,
    3
  ],
  [
    4,
    4
  ],
  [
    3,
    4
  ],
  [
    2,
    4
  ],
  [
    2,
    3
  ]
];

export const MORRIS_MILLS = [
  [
    [
      0,
      0
    ],
    [
      3,
      0
    ],
    [
      6,
      0
    ]
  ],
  [
    [
      6,
      0
    ],
    [
      6,
      3
    ],
    [
      6,
      6
    ]
  ],
  [
    [
      6,
      6
    ],
    [
      3,
      6
    ],
    [
      0,
      6
    ]
  ],
  [
    [
      0,
      6
    ],
    [
      0,
      3
    ],
    [
      0,
      0
    ]
  ],
  [
    [
      1,
      1
    ],
    [
      3,
      1
    ],
    [
      5,
      1
    ]
  ],
  [
    [
      5,
      1
    ],
    [
      5,
      3
    ],
    [
      5,
      5
    ]
  ],
  [
    [
      5,
      5
    ],
    [
      3,
      5
    ],
    [
      1,
      5
    ]
  ],
  [
    [
      1,
      5
    ],
    [
      1,
      3
    ],
    [
      1,
      1
    ]
  ],
  [
    [
      2,
      2
    ],
    [
      3,
      2
    ],
    [
      4,
      2
    ]
  ],
  [
    [
      4,
      2
    ],
    [
      4,
      3
    ],
    [
      4,
      4
    ]
  ],
  [
    [
      4,
      4
    ],
    [
      3,
      4
    ],
    [
      2,
      4
    ]
  ],
  [
    [
      2,
      4
    ],
    [
      2,
      3
    ],
    [
      2,
      2
    ]
  ],
  [
    [
      3,
      0
    ],
    [
      3,
      1
    ],
    [
      3,
      2
    ]
  ],
  [
    [
      6,
      3
    ],
    [
      5,
      3
    ],
    [
      4,
      3
    ]
  ],
  [
    [
      3,
      6
    ],
    [
      3,
      5
    ],
    [
      3,
      4
    ]
  ],
  [
    [
      0,
      3
    ],
    [
      1,
      3
    ],
    [
      2,
      3
    ]
  ]
];

export const MORRIS_EDGES = [
  [
    [
      0,
      0
    ],
    [
      3,
      0
    ]
  ],
  [
    [
      3,
      0
    ],
    [
      6,
      0
    ]
  ],
  [
    [
      6,
      0
    ],
    [
      6,
      3
    ]
  ],
  [
    [
      6,
      3
    ],
    [
      6,
      6
    ]
  ],
  [
    [
      6,
      6
    ],
    [
      3,
      6
    ]
  ],
  [
    [
      3,
      6
    ],
    [
      0,
      6
    ]
  ],
  [
    [
      0,
      6
    ],
    [
      0,
      3
    ]
  ],
  [
    [
      0,
      3
    ],
    [
      0,
      0
    ]
  ],
  [
    [
      1,
      1
    ],
    [
      3,
      1
    ]
  ],
  [
    [
      3,
      1
    ],
    [
      5,
      1
    ]
  ],
  [
    [
      5,
      1
    ],
    [
      5,
      3
    ]
  ],
  [
    [
      5,
      3
    ],
    [
      5,
      5
    ]
  ],
  [
    [
      5,
      5
    ],
    [
      3,
      5
    ]
  ],
  [
    [
      3,
      5
    ],
    [
      1,
      5
    ]
  ],
  [
    [
      1,
      5
    ],
    [
      1,
      3
    ]
  ],
  [
    [
      1,
      3
    ],
    [
      1,
      1
    ]
  ],
  [
    [
      2,
      2
    ],
    [
      3,
      2
    ]
  ],
  [
    [
      3,
      2
    ],
    [
      4,
      2
    ]
  ],
  [
    [
      4,
      2
    ],
    [
      4,
      3
    ]
  ],
  [
    [
      4,
      3
    ],
    [
      4,
      4
    ]
  ],
  [
    [
      4,
      4
    ],
    [
      3,
      4
    ]
  ],
  [
    [
      3,
      4
    ],
    [
      2,
      4
    ]
  ],
  [
    [
      2,
      4
    ],
    [
      2,
      3
    ]
  ],
  [
    [
      2,
      3
    ],
    [
      2,
      2
    ]
  ],
  [
    [
      3,
      0
    ],
    [
      3,
      1
    ]
  ],
  [
    [
      3,
      1
    ],
    [
      3,
      2
    ]
  ],
  [
    [
      6,
      3
    ],
    [
      5,
      3
    ]
  ],
  [
    [
      5,
      3
    ],
    [
      4,
      3
    ]
  ],
  [
    [
      3,
      6
    ],
    [
      3,
      5
    ]
  ],
  [
    [
      3,
      5
    ],
    [
      3,
      4
    ]
  ],
  [
    [
      0,
      3
    ],
    [
      1,
      3
    ]
  ],
  [
    [
      1,
      3
    ],
    [
      2,
      3
    ]
  ]
];

export const morrisKey = (e, t) => e + ',' + t;

export const MORRIS_SET = new Set(MORRIS_POINTS.map(e => morrisKey(...e)));

export function morrisStrategyEval(e, t, r) {
  let n = 0;
  for (const r of [
      'w',
      'b'
    ]) {
    const o = morrisCount(e.board, r), a = r === t ? 1 : -1;
    if (!e.toPlace.w && !e.toPlace.b && o < 3)
      return r === t ? -100000 : 100000;
    let s = (o + e.toPlace[r]) * 110, i = 0;
    for (const t of MORRIS_MILLS) {
      const n = t.filter(([t, n]) => e.board[n][t] === r + 'M').length, o = t.filter(([t, r]) => !e.board[r][t]).length;
      if (n === 3)
        s += 35;
      if (n === 2 && o === 1) {
        s += 38;
        i++;
      }
      if (n === 1 && o === 2)
        s += 5;
    }
    if (i > 1)
      s += (i - 1) * 30;
    let l = 0;
    for (const [t, n] of MORRIS_POINTS)
      if (e.board[n][t] === r + 'M') {
        const a = morrisNeighbors(t, n).filter(t => !e.board[t.y][t.x]).length;
        l += a;
        s += morrisNeighbors(t, n).length * 3;
        if (!a && o > 3 && !e.toPlace[r])
          s -= 18;
      }
    s += l * 4;
    n += a * s;
  }
  return n;
}

export function morrisStrategyChildren(e, t, r) {
  const n = [];
  const o = [];
  if (e.toPlace[t] > 0) {
    for (const [t, r] of MORRIS_POINTS)
      if (!e.board[r][t])
        o.push({
          place: true,
          tx: t,
          ty: r
        });
  } else {
    const r = morrisCount(e.board, t) === 3;
    for (const [n, a] of MORRIS_POINTS)
      if (e.board[a][n] === t + 'M') {
        const t = r ? MORRIS_POINTS.map(([e, t]) => ({
          x: e,
          y: t
        })) : morrisNeighbors(n, a);
        for (const r of t)
          if (!e.board[r.y][r.x])
            o.push({
              sx: n,
              sy: a,
              tx: r.x,
              ty: r.y
            });
      }
  }
  for (const a of o) {
    const o = e.board.map(e => e.slice()), s = { ...e.toPlace };
    if (a.place)
      s[t]--;
    else
      o[a.sy][a.sx] = '';
    o[a.ty][a.tx] = t + 'M';
    const i = morrisMillAt(o, a.tx, a.ty, t) ? morrisRemoveTargets(o, t) : [];
    for (const e of i.length ? i : [null]) {
      const t = o.map(e => e.slice());
      if (e)
        t[e.y][e.x] = '';
      const i = {
        board: t,
        toPlace: s
      };
      n.push({
        m: {
          ...a,
          remove: e
        },
        s: i,
        score: strategyEval('morris', i, r)
      });
    }
  }
  return n;
}

export function morrisInitial() {
  return Array.from({ length: 7 }, () => Array(7).fill(''));
}

export function morrisReset() {
  set_morris({
    toPlace: {
      w: 9,
      b: 9
    },
    remove: null,
    winner: null
  });
}

export function morrisCount(e, t) {
  let r = 0;
  for (const [n, o] of MORRIS_POINTS)
    if (e[o][n] === t + 'M')
      r++;
  return r;
}

export function morrisMillAt(e, t, r, n) {
  return MORRIS_MILLS.some(o => o.some(e => e[0] === t && e[1] === r) && o.every(([t, r]) => e[r][t] === n + 'M'));
}

export function morrisNeighbors(e, t) {
  const r = [];
  for (const [n, o] of MORRIS_EDGES)
    if (n[0] === e && n[1] === t)
      r.push({
        x: o[0],
        y: o[1]
      });
    else if (o[0] === e && o[1] === t)
      r.push({
        x: n[0],
        y: n[1]
      });
  return r;
}

export function morrisMoves(e, t) {
  if (morris.toPlace[t] > 0)
    return MORRIS_POINTS.filter(([t, r]) => !e[r][t]).map(([e, t]) => ({
      place: true,
      tx: e,
      ty: t
    }));
  const r = morrisCount(e, t) === 3, n = [];
  for (const [o, a] of MORRIS_POINTS)
    if (e[a][o] === t + 'M') {
      const t = r ? MORRIS_POINTS.filter(([t, r]) => !e[r][t]).map(([e, t]) => ({
        x: e,
        y: t
      })) : morrisNeighbors(o, a).filter(t => !e[t.y][t.x]);
      for (const e of t)
        n.push({
          sx: o,
          sy: a,
          tx: e.x,
          ty: e.y
        });
    }
  return n;
}

export function morrisRemoveTargets(e, t) {
  const r = opposite(t), n = MORRIS_POINTS.filter(([t, n]) => e[n][t] === r + 'M').map(([e, t]) => ({
      x: e,
      y: t
    })), o = n.filter(t => !morrisMillAt(e, t.x, t.y, r));
  return o.length ? o : n;
}

export function morrisWinner(e, t) {
  if (morris.toPlace.w || morris.toPlace.b || morris.remove)
    return null;
  for (const t of [
      'w',
      'b'
    ])
    if (morrisCount(e, t) < 3)
      return opposite(t);
  if (t && !morrisMoves(e, t).length)
    return opposite(t);
  return null;
}

export function morrisDoBase(e, t) {
  const r = t + 'M';
  if (e.place) {
    board[e.ty][e.tx] = r;
    morris.toPlace[t]--;
    set_lastMove({
      sx: -1,
      sy: -1,
      tx: e.tx,
      ty: e.ty
    });
  } else {
    board[e.sy][e.sx] = '';
    board[e.ty][e.tx] = r;
    set_lastMove({ ...e });
  }
  return morrisMillAt(board, e.tx, e.ty, t);
}

export function morrisClick(e, t) {
  if (!MORRIS_SET.has(morrisKey(e, t)))
    return;
  if (morris.remove === turn) {
    const r = morrisRemoveTargets(board, turn).find(r => r.x === e && r.y === t);
    if (!r) {
      setHint('赤く示された\u3001取り除ける相手石を選んでください\u3002');
      return;
    }
    board[t][e] = '';
    morris.remove = null;
    set_lastMoveMessage('ミルで1石を除去\u3002');
    morris.winner = morrisWinner(board, opposite(turn));
    finishCustomTurn();
    return;
  }
  if (morris.toPlace[turn] > 0) {
    if (board[t][e]) {
      setHint('空いている交点へ置いてください\u3002');
      return;
    }
    rememberCustomHuman();
    const r = morrisDoBase({
      place: true,
      tx: e,
      ty: t
    }, turn);
    set_lastMoveMessage(r ? 'ミル成立\uFF01相手石を1つ取れます\u3002' : '石を配置\u3002');
    if (r && morrisRemoveTargets(board, turn).length) {
      morris.remove = turn;
      drawBoard();
    } else
      finishCustomTurn();
    return;
  }
  if (selected) {
    const r = morrisMoves(board, turn).find(r => r.sx === selected.x && r.sy === selected.y && r.tx === e && r.ty === t);
    if (r) {
      rememberCustomHuman();
      const e = morrisDoBase(r, turn);
      set_selected(null);
      set_lastMoveMessage(e ? 'ミル成立\uFF01相手石を1つ取れます\u3002' : '');
      if (e && morrisRemoveTargets(board, turn).length) {
        morris.remove = turn;
        drawBoard();
      } else
        finishCustomTurn();
      return;
    }
  }
  if (board[t][e] === turn + 'M') {
    set_selected(selected?.x === e && selected?.y === t ? null : {
      x: e,
      y: t
    });
    setHint('');
    drawBoard();
  } else {
    set_selected(null);
    setHint('自分の石を選んでください\u3002');
    drawBoard();
  }
}

export function morrisLineSVG() {
  return '<svg class="morrisLines" viewBox="0 0 7 7" aria-hidden="true"><rect x=".5" y=".5" width="6" height="6"/><rect x="1.5" y="1.5" width="4" height="4"/><rect x="2.5" y="2.5" width="2" height="2"/><line x1="3.5" y1=".5" x2="3.5" y2="2.5"/><line x1="3.5" y1="4.5" x2="3.5" y2="6.5"/><line x1=".5" y1="3.5" x2="2.5" y2="3.5"/><line x1="4.5" y1="3.5" x2="6.5" y2="3.5"/></svg>';
}

export function morrisEnding() {
  morris.winner = morris.winner || morrisWinner(board, turn);
  return morris.winner ? (morris.winner === 'w' ? '白' : '黒') + 'の勝ち\uFF01' : '';
}

export function drawMorris() {
  setBoardGrid(7, 'morrisBoard');
  setCustomFacing();
  const e = terminalStatus();
  set_gameOver(!!e);
  finishLearning(e);
  document.getElementById('message').textContent = e || sideName(turn) + 'の手番' + (lastMoveMessage ? ' / ' + lastMoveMessage : '');
  boardEl.innerHTML = morrisLineSVG();
  let t = [];
  if (!gameOver && !aiThinking && (!isSoloMode() || !isAITurn()))
    if (morris.remove === turn)
      t = morrisRemoveTargets(board, turn).map(e => ({
        ...e,
        remove: true
      }));
    else if (morris.toPlace[turn] > 0)
      t = morrisMoves(board, turn).map(e => ({
        x: e.tx,
        y: e.ty
      }));
    else if (selected)
      t = morrisMoves(board, turn).filter(e => e.sx === selected.x && e.sy === selected.y).map(e => ({
        x: e.tx,
        y: e.ty
      }));
  for (let e = 0; e < 7; e++)
    for (let r = 0; r < 7; r++) {
      const n = MORRIS_SET.has(morrisKey(r, e)), o = document.createElement('div'), a = board[e][r];
      o.className = 'cell' + (n ? ' morrisPoint' : '');
      if (a) {
        const e = document.createElement('span');
        e.className = 'piece tableToken ' + (a[0] === 'w' ? 'whitePiece lightToken' : 'blackPiece darkToken');
        e.textContent = '';
        o.appendChild(e);
      }
      if (selected && selected.x === r && selected.y === e)
        o.classList.add('selected');
      const s = t.find(t => t.x === r && t.y === e);
      if (s)
        o.classList.add(s.remove ? 'capture' : 'highlight');
      if (lastMove && (lastMove.sx === r && lastMove.sy === e || lastMove.tx === r && lastMove.ty === e))
        o.classList.add('lastMove');
      o.dataset.x = r;
      o.dataset.y = e;
      if (n)
        o.onclick = () => clickCell(r, e);
      else
        o.setAttribute('aria-hidden', 'true');
      boardEl.appendChild(o);
    }
  document.getElementById('normalTools').textContent = '手持ち 白' + morris.toPlace.w + ' / 黒' + morris.toPlace.b + ' \xB7 盤上 白' + morrisCount(board, 'w') + ' / 黒' + morrisCount(board, 'b');
  updateSoloUI([]);
  set_currentRisks([]);
  updateHint();
  updatePoints();
}
