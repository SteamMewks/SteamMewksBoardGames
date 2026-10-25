import { aiThinking, animating, board, boardEl, currentRisks, gameMode, gameOver, gameType, helpTopic, hintOverride, humanInputBlocked, inBoard, lastMove, lastMoveMessage, opposite, q, qPlayerCount, setHint, set_currentRisks, set_gameOver, set_helpTopic, set_hintOverride, set_lastMove, set_lastMoveMessage, set_q, set_qPlayerCount, sideName, strategyDistanceCache, turn } from '../core/state.js';
import { finishLearning, strategyEval } from '../core/ai.js';
import { fourColorName, fourPieceClass } from './four-chess.js';
import { clickCell, drawBoard, finishCustomTurn, rememberCustomHuman, setBoardGrid, setCustomFacing, terminalStatus, updateHint, updatePoints, updateSoloUI } from '../core/ui.js';

export const qWallKey = e => e.x + ',' + e.y;

export function qStrategyEval(e, t, r) {
  const n = qWinner(e.board);
  if (n)
    return n === t ? 100000 : -100000;
  if (r && qPawnMoves(e.board, r, e).some(e => e.y === (r === 'w' ? 0 : 8)))
    return r === t ? 99000 : -99000;
  const distance = t => {
    const r = qPawnPos(e.board, t);
    if (r.y === (t === 'w' ? 0 : 8))
      return 0;
    return 1 + Math.min(...qPawnMoves(e.board, t, e).map(n => {
      const o = e.board.map(e => e.slice());
      o[r.y][r.x] = '';
      o[n.y][n.x] = t + 'Q';
      return qShortest(o, t, e);
    }));
  };
  return (distance(opposite(t)) - distance(t)) * 100 + (e.walls[t] - e.walls[opposite(t)]) * 9;
}

export function qStrategyChildren(e, t, r) {
  const n = [];
  const o = qPawnPos(e.board, t);
  for (const a of qPawnMoves(e.board, t, e)) {
    const s = e.board.map(e => e.slice());
    s[o.y][o.x] = '';
    s[a.y][a.x] = t + 'Q';
    const i = {
      ...e,
      board: s
    };
    n.push({
      m: {
        kind: 'pawn',
        ...a
      },
      s: i,
      score: strategyEval('quoridor', i, r, opposite(t))
    });
  }
  if (e.walls[t] > 0)
    for (const o of [
        'h',
        'v'
      ])
      for (let a = 0; a < 8; a++)
        for (let s = 0; s < 8; s++)
          if (qCanPlace(o, s, a, e, e.board, t)) {
            const i = {
              board: e.board,
              walls: {
                ...e.walls,
                [t]: e.walls[t] - 1
              },
              h: e.h,
              v: e.v,
              [o]: [
                ...e[o],
                {
                  x: s,
                  y: a
                }
              ]
            };
            n.push({
              m: {
                kind: 'wall',
                ori: o,
                x: s,
                y: a
              },
              s: i,
              score: strategyEval('quoridor', i, r, opposite(t))
            });
          }
  return n;
}

export function qOrder(e = qPlayerCount) {
  return e === 2 ? [
    'w',
    'b'
  ] : e === 3 ? [
    'w',
    'r',
    'b'
  ] : [
    'w',
    'r',
    'b',
    'u'
  ];
}

export function qColors(e) {
  return [
    'w',
    'r',
    'b',
    'u'
  ].filter(t => e.some(e => e.includes(t + 'Q')));
}

export function qGoalReached(e, t, r) {
  return e === 'w' ? r === 0 : e === 'b' ? r === 8 : e === 'r' ? t === 0 : e === 'u' ? t === 8 : false;
}

export function qNextTurn(e) {
  const t = qOrder();
  return t[(t.indexOf(e) + 1) % t.length];
}

export function qRules() {
  return 'コリドール\uFF08' + qPlayerCount + '人\uFF09\uFF1A手番は' + qOrder().map(fourColorName).join('\u2192') + '\u3002壁は１人' + {
    2: 10,
    3: 8,
    4: 6
  }[qPlayerCount] + '枚\u3002自分の駒を縦横に１マス進めるか\u3001壁を１枚置きます\u3002隣の駒の後ろが空いていれば１駒を飛び越せます\u3002後ろが壁\u30FB盤外\u30FB別の駒で塞がれていれば\u3001その駒の左右へ斜めに回れます\u3002駒の重なりと連続する複数駒の飛び越しは不可\u3002壁は\u300C壁を置く\u300Dを選び\u3001マスの間の線をタップして２マス分の候補を表示し\u3001\u300C設置\u300Dで確定します\u3002線の向きに合わせて縦壁\u30FB横壁を選べます\u3002赤い候補は設置不可\u3002候補の選び直し\u30FB取消では手番も壁も消費しません\u3002重なり\u30FB中央交差は禁止\u3002全員にゴールまでの道を残してください\u3002白は上辺\u3001黒は下辺\u3001赤は左辺\u3001青は右辺のどのマスでも\u3001最初に到達した人が勝ちます\u3002';
}

export function setQuoridorPlayers(e) {
  if (gameType !== 'quoridor' || ![
      2,
      3,
      4
    ].includes(e))
    return;
  set_qPlayerCount(e);
  for (const t of document.querySelectorAll('[data-q-players]'))
    t.setAttribute('aria-pressed', String(Number(t.dataset.qPlayers) === e));
  document.getElementById('localMode').innerHTML = e + '人で対局<small>１台の画面を交互に操作\u30FB１人' + {
    2: 10,
    3: 8,
    4: 6
  }[e] + '枚の壁</small>';
  document.getElementById('soloMode').hidden = e !== 2;
  document.querySelector('.soloOrder').hidden = e !== 2;
  document.getElementById('qPlayerNote').textContent = e === 2 ? '白\uFF08下\uFF09\u2192黒\uFF08上\uFF09\u3002２人対戦\u3001またはAI戦を選べます\u3002' : e === 3 ? '白\uFF08下\uFF09\u2192赤\uFF08右\uFF09\u2192黒\uFF08上\uFF09\u3002３人対戦専用\u30FB各８枚\u3002' : '白\uFF08下\uFF09\u2192赤\uFF08右\uFF09\u2192黒\uFF08上\uFF09\u2192青\uFF08左\uFF09\u3002４人対戦専用\u30FB各６枚\u3002';
}

export function qInitial() {
  const e = Array.from({ length: 9 }, () => Array(9).fill('')), t = {
      w: [
        4,
        8
      ],
      r: [
        8,
        4
      ],
      b: [
        4,
        0
      ],
      u: [
        0,
        4
      ]
    };
  for (const r of qOrder()) {
    const [n, o] = t[r];
    e[o][n] = r + 'Q';
  }
  return e;
}

export function qReset() {
  const e = {};
  for (const t of qOrder())
    e[t] = {
      2: 10,
      3: 8,
      4: 6
    }[qPlayerCount];
  set_q({
    walls: e,
    h: [],
    v: [],
    mode: 'pawn',
    candidate: null,
    winner: null
  });
}

export function qPawnPos(e, t) {
  for (let r = 0; r < 9; r++)
    for (let n = 0; n < 9; n++)
      if (e[r][n] === t + 'Q')
        return {
          x: n,
          y: r
        };
  return null;
}

export function qBlocked(e, t, r) {
  const n = r.x - t.x, o = r.y - t.y;
  if (Math.abs(n) + Math.abs(o) !== 1)
    return true;
  if (n) {
    const n = Math.min(t.x, r.x), o = t.y;
    return e.v.some(e => e.x === n && (e.y === o || e.y + 1 === o));
  }
  const a = Math.min(t.y, r.y), s = t.x;
  return e.h.some(e => e.y === a && (e.x === s || e.x + 1 === s));
}

export function qPawnMoves(e, t, r = q) {
  const n = qPawnPos(e, t);
  if (!n)
    return [];
  const o = [];
  for (const [t, a] of [
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
    const s = {
      x: n.x + t,
      y: n.y + a
    };
    if (!inBoard(s.x, s.y, 9) || qBlocked(r, n, s))
      continue;
    if (!e[s.y][s.x]) {
      o.push(s);
      continue;
    }
    const i = {
      x: s.x + t,
      y: s.y + a
    };
    if (inBoard(i.x, i.y, 9) && !e[i.y][i.x] && !qBlocked(r, s, i)) {
      o.push(i);
      continue;
    }
    for (const [t, n] of a ? [
        [
          1,
          0
        ],
        [
          -1,
          0
        ]
      ] : [
        [
          0,
          1
        ],
        [
          0,
          -1
        ]
      ]) {
      const a = {
        x: s.x + t,
        y: s.y + n
      };
      if (inBoard(a.x, a.y, 9) && !e[a.y][a.x] && !qBlocked(r, s, a))
        o.push(a);
    }
  }
  return o.filter((e, t, r) => r.findIndex(t => t.x === e.x && t.y === e.y) === t);
}

export function qDistanceMap(e, t) {
  const r = t + '|' + e.h.map(qWallKey).sort().join(';') + '|' + e.v.map(qWallKey).sort().join(';');
  if (strategyDistanceCache.has(r))
    return strategyDistanceCache.get(r);
  const n = Array.from({ length: 81 }, () => []);
  for (const t of e.h)
    for (const e of [
        t.x,
        t.x + 1
      ]) {
      const r = t.y * 9 + e, o = r + 9;
      n[r].push(o);
      n[o].push(r);
    }
  for (const t of e.v)
    for (const e of [
        t.y,
        t.y + 1
      ]) {
      const r = e * 9 + t.x, o = r + 1;
      n[r].push(o);
      n[o].push(r);
    }
  const o = Array(81).fill(99), a = [];
  for (let e = 0; e < 9; e++) {
    const r = t === 'w' ? e : t === 'b' ? 72 + e : t === 'r' ? e * 9 : e * 9 + 8;
    o[r] = 0;
    a.push(r);
  }
  for (let e = 0; e < a.length; e++) {
    const t = a[e], r = t % 9, s = Math.floor(t / 9);
    for (const e of [
        r > 0 ? t - 1 : -1,
        r < 8 ? t + 1 : -1,
        s > 0 ? t - 9 : -1,
        s < 8 ? t + 9 : -1
      ])
      if (e >= 0 && o[e] === 99 && !n[t].includes(e)) {
        o[e] = o[t] + 1;
        a.push(e);
      }
  }
  if (strategyDistanceCache.size > 2000)
    strategyDistanceCache.clear();
  strategyDistanceCache.set(r, o);
  return o;
}

export function qShortest(e, t, r = q) {
  const n = qPawnPos(e, t);
  return n ? qDistanceMap(r, t)[n.y * 9 + n.x] : 99;
}

export function qPawnRouteMap(e, t, r) {
  const n = e.flatMap((e, r) => e.flatMap((e, n) => e && e !== t + 'Q' ? [
    e,
    n,
    r
  ].join(':') : []));
  const o = 'pawn-route|' + t + '|' + n.join(',') + '|' + r.h.map(qWallKey).sort().join(';') + '|' + r.v.map(qWallKey).sort().join(';');
  if (strategyDistanceCache.has(o))
    return strategyDistanceCache.get(o);
  const a = e.map(e => e.map(e => e === t + 'Q' ? '' : e)), s = Array.from({ length: 81 }, () => []), i = Array(81).fill(99), l = [];
  for (let e = 0; e < 9; e++)
    for (let n = 0; n < 9; n++) {
      if (a[e][n])
        continue;
      if (qGoalReached(t, n, e)) {
        i[e * 9 + n] = 0;
        l.push(e * 9 + n);
        continue;
      }
      a[e][n] = t + 'Q';
      const o = qPawnMoves(a, t, r);
      a[e][n] = '';
      for (const t of o)
        s[t.y * 9 + t.x].push(e * 9 + n);
    }
  for (let e = 0; e < l.length; e++)
    for (const t of s[l[e]])
      if (i[t] === 99) {
        i[t] = i[l[e]] + 1;
        l.push(t);
      }
  if (strategyDistanceCache.size > 2000)
    strategyDistanceCache.clear();
  strategyDistanceCache.set(o, i);
  return i;
}

export function qWallCompatible(e, t, r, n) {
  if (![
      'h',
      'v'
    ].includes(e) || !Number.isInteger(t) || !Number.isInteger(r) || !inBoard(t, r, 8))
    return false;
  const o = n[e], a = n[e === 'h' ? 'v' : 'h'];
  if (a.some(e => e.x === t && e.y === r))
    return false;
  return !o.some(n => e === 'h' ? n.y === r && Math.abs(n.x - t) < 2 : n.x === t && Math.abs(n.y - r) < 2);
}

export function qCanPlace(e, t, r, n = q, o = board, a = turn) {
  if (n.walls[a] <= 0 || !qWallCompatible(e, t, r, n))
    return false;
  const s = {
    walls: n.walls,
    h: n.h,
    v: n.v,
    [e]: [
      ...n[e],
      {
        x: t,
        y: r
      }
    ]
  };
  return qColors(o).every(e => qShortest(o, e, s) < 99);
}

export function qWinner(e) {
  for (const t of qColors(e)) {
    const r = qPawnPos(e, t);
    if (qGoalReached(t, r.x, r.y))
      return t;
  }
  return null;
}

export function qWallError(e, t, r) {
  if (q.walls[turn] <= 0)
    return 'この陣営の壁はもう残っていません\u3002';
  if (!qWallCompatible(e, t, r, q))
    return '壁が重なるか交差するため\u3001ここには設置できません\u3002';
  if (!qCanPlace(e, t, r))
    return 'ゴールへの道を完全に塞ぐため\u3001ここには設置できません\u3002';
  return '';
}

export function qCanInteract() {
  return gameType === 'quoridor' && !!gameMode && !gameOver && !animating && !aiThinking && !humanInputBlocked();
}

export function qSetMode(e) {
  if (!qCanInteract())
    return;
  e = e === 'pawn' ? 'pawn' : 'wall';
  if (e === 'wall' && q.walls[turn] <= 0) {
    setHint('この陣営の壁はもう残っていません\u3002');
    return;
  }
  q.mode = e;
  q.candidate = null;
  setHint('');
  drawBoard();
}

export function qSelectWall(e, t, r) {
  if (!qCanInteract() || q.mode === 'pawn')
    return;
  if (![
      'h',
      'v'
    ].includes(e) || !inBoard(t, r, 8))
    return;
  q.candidate = {
    ori: e,
    x: t,
    y: r
  };
  set_helpTopic(null);
  set_hintOverride('');
  set_lastMoveMessage('');
  drawBoard();
}

export function qCancelWall() {
  if (!qCanInteract())
    return;
  q.candidate = null;
  setHint('');
  drawBoard();
}

export function qConfirmWall() {
  if (!qCanInteract() || q.mode === 'pawn' || !q.candidate)
    return;
  const {
      ori: e,
      x: t,
      y: r
    } = q.candidate, n = qWallError(e, t, r);
  if (n) {
    setHint(n);
    return;
  }
  rememberCustomHuman();
  q[e].push({
    x: t,
    y: r
  });
  q.walls[turn]--;
  set_lastMove(null);
  set_lastMoveMessage((e === 'h' ? '横' : '縦') + '壁を設置\u3002');
  q.mode = 'pawn';
  q.candidate = null;
  finishCustomTurn();
}

export function qClick(e, t) {
  if (!inBoard(e, t, 9))
    return;
  if (q.mode !== 'pawn') {
    setHint('マスの中ではなく\u3001マスの間の線をタップして壁の候補を選んでください\u3002');
    return;
  }
  const r = qPawnMoves(board, turn).find(r => r.x === e && r.y === t);
  if (!r) {
    setHint('\u25CFの移動先を選ぶか\u3001\u300C壁を置く\u300Dへ切り替えてください\u3002');
    return;
  }
  rememberCustomHuman();
  const n = qPawnPos(board, turn);
  board[n.y][n.x] = '';
  board[t][e] = turn + 'Q';
  set_lastMove({
    sx: n.x,
    sy: n.y,
    tx: e,
    ty: t
  });
  q.winner = qWinner(board);
  set_lastMoveMessage('');
  q.candidate = null;
  finishCustomTurn();
}

export function qEnding() {
  q.winner = q.winner || qWinner(board);
  return q.winner ? fourColorName(q.winner) + 'が対岸へ到達\uFF01' : '';
}

export function drawQuoridor() {
  if (q.mode === 'h' || q.mode === 'v')
    q.mode = 'wall';
  setBoardGrid(9, 'quoridorBoard');
  setCustomFacing();
  const e = terminalStatus();
  set_gameOver(!!e);
  finishLearning(e);
  document.getElementById('message').textContent = e || sideName(turn) + 'の手番\uFF08' + {
    w: '上辺へ \u2191',
    r: '左辺へ \u2190',
    b: '下辺へ \u2193',
    u: '右辺へ \u2192'
  }[turn] + '\uFF09' + (lastMoveMessage ? ' / ' + lastMoveMessage : '');
  boardEl.innerHTML = '';
  const t = qCanInteract(), r = t && q.mode === 'wall';
  const n = t && q.mode === 'pawn' ? qPawnMoves(board, turn) : [], o = r ? q.candidate : null, a = o ? qWallError(o.ori, o.x, o.y) : '';
  for (let e = 0; e < 9; e++)
    for (let t = 0; t < 9; t++) {
      const s = document.createElement('div'), i = board[e][t];
      s.className = 'cell';
      if (q.h.some(r => r.y === e && (r.x === t || r.x + 1 === t)))
        s.classList.add('qWallS');
      if (q.v.some(r => r.x === t && (r.y === e || r.y + 1 === e)))
        s.classList.add('qWallE');
      if (i) {
        const e = document.createElement('span');
        e.className = 'piece tableToken qPawn ' + fourPieceClass(i[0]) + ' ' + {
          w: 'lightToken',
          b: 'darkToken',
          r: 'redToken',
          u: 'blueToken'
        }[i[0]];
        s.appendChild(e);
      }
      if (n.some(r => r.x === t && r.y === e)) {
        s.classList.add('highlight');
        const e = document.createElement('span');
        e.className = 'moveDot';
        s.appendChild(e);
      }
      if (r)
        for (const r of [
            'h',
            'v'
          ]) {
          if (r === 'h' ? e >= 8 : t >= 8)
            continue;
          const n = document.createElement('span');
          n.className = 'qWallHit qWallHit' + r.toUpperCase();
          n.setAttribute('aria-hidden', 'true');
          n.onclick = n => {
            n.stopPropagation();
            qSelectWall(r, Math.min(t, 7), Math.min(e, 7));
          };
          s.appendChild(n);
        }
      if (o && o.x === t && o.y === e) {
        const e = document.createElement('span');
        e.className = 'qCandidate qCandidate' + o.ori.toUpperCase() + (a ? ' qCandidateInvalid' : '');
        e.setAttribute('aria-hidden', 'true');
        s.appendChild(e);
      }
      if (lastMove && (lastMove.sx === t && lastMove.sy === e || lastMove.tx === t && lastMove.ty === e))
        s.classList.add('lastMove');
      s.dataset.x = t;
      s.dataset.y = e;
      s.setAttribute('aria-label', (i ? fourColorName(i[0]) + 'の駒' : '空きマス') + ' ' + (t + 1) + '列' + (e + 1) + '行' + (r ? '\u3002Enterで横壁\u3001Shift\uFF0BEnterで縦壁の候補' : ''));
      s.onclick = () => clickCell(t, e);
      boardEl.appendChild(s);
    }
  document.getElementById('qStatus').textContent = '残りの壁\uFF1A' + qOrder().map(e => (e === turn ? '\u25B6' : '') + fourColorName(e) + ' ' + q.walls[e]).join(' \uFF0F ');
  for (const [e, r] of [
      [
        'qPawn',
        'pawn'
      ],
      [
        'qWall',
        'wall'
      ]
    ]) {
    const n = document.getElementById(e);
    n.setAttribute('aria-pressed', String(q.mode === r));
    n.disabled = !t || r === 'wall' && q.walls[turn] <= 0;
  }
  const s = document.getElementById('qConfirm'), i = document.getElementById('qCancel'), l = document.getElementById('qPlacementStatus');
  s.hidden = i.hidden = !o;
  s.disabled = !o || !!a;
  l.hidden = !r;
  l.textContent = o ? a || '２マス分の壁の候補\u3002\u300C設置\u300Dで確定します\u3002' : 'マスの間の線をタップしてください\u3002';
  l.classList.toggle('qPlacementError', !!a);
  updateSoloUI([]);
  set_currentRisks([]);
  updateHint();
  updatePoints();
}
