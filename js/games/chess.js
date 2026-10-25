import { analysisBefore, arEnemy, board, enPassant, forcedCapture, gameType, halfmove, inside, isSkillMode, isSoloMode, isVariant, lastMove, lastMoveMessage, liveState, moved, opposite, playerColor, points, repetitions, setHint, set_analysisBefore, set_board, set_enPassant, set_halfmove, set_lastMove, set_lastMoveMessage, set_moved, turn } from '../core/state.js';
import { levelConfig, playVariantMove, serializeWorkerFunctions } from '../core/ai.js';
import { reversiFlips, reversiMoves } from './reversi.js';
import { draughtsMoves } from './checkers.js';
import { breakthroughCanMove, breakthroughNext } from './breakthrough.js';
import { arOptions } from './arimaa.js';
import { hasSkillEscape } from './chess-variant.js';
import { animateMove, endTurn, positionKey, pushUndoSnapshot } from '../core/ui.js';

export const chessInitialBoard = () => [
  [
    'bR',
    'bN',
    'bB',
    'bQ',
    'bK',
    'bB',
    'bN',
    'bR'
  ],
  Array(8).fill('bP'),
  ...Array.from({ length: 4 }, () => Array(8).fill('')),
  Array(8).fill('wP'),
  [
    'wR',
    'wN',
    'wB',
    'wQ',
    'wK',
    'wB',
    'wN',
    'wR'
  ]
];

export const pieceValue = {
  P: 100,
  N: 300,
  B: 310,
  R: 500,
  Q: 900,
  K: 0
};

export function evaluateBoard(e) {
  let t = 0, r = {
      w: 0,
      b: 0
    };
  for (const t of e)
    for (const e of t)
      if (e)
        r[e[0]] += pieceValue[e[1]];
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++) {
      const a = e[n][o];
      if (!a)
        continue;
      const s = 7 - Math.abs(3.5 - o) - Math.abs(3.5 - n);
      let i = pieceValue[a[1]];
      if (a[1] === 'P')
        i += (a[0] === 'w' ? 6 - n : n - 1) * 8;
      if ('NB'.includes(a[1]))
        i += s * 6;
      if (a[1] === 'K')
        i += r.w + r.b < 2400 ? s * 7 : -s * 3;
      t += (a[0] === 'b' ? 1 : -1) * i;
    }
  for (const n of [
      'w',
      'b'
    ]) {
    const o = opposite(n), a = kingPosition(e, n), s = kingPosition(e, o);
    if (a && s && r[n] - r[o] >= 400 && r[o] <= 500) {
      const e = Math.max(Math.abs(3.5 - s.x), Math.abs(3.5 - s.y)) * 25 + (14 - Math.abs(a.x - s.x) - Math.abs(a.y - s.y)) * 6;
      t += (n === 'b' ? 1 : -1) * e;
    }
  }
  return t;
}

export function playerMoveQuality(e, t) {
  const r = e.board[t.sy][t.sx][0], n = opposite(r), o = r === 'b' ? 1 : -1;
  function score(t) {
    const r = nextState(e, t);
    let a = 1 / 0;
    const s = allMoves(n, r);
    if (!s.length)
      return isKingInCheck(n, r.board) ? 100000 : 0;
    for (const e of s)
      a = Math.min(a, o * evaluateBoard(nextState(r, e).board));
    return a;
  }
  const a = allMoves(r, e);
  let s = -1 / 0;
  for (const e of a)
    s = Math.max(s, score(e));
  const i = Math.max(0, s - score(t));
  return i <= 45 ? 1 : i <= 120 ? 0.7 : i <= 250 ? 0.35 : 0;
}

export function engineChoose(e, t, r = Math.random, n = [], o = 'b') {
  const a = opposite(o), s = o === 'b' ? 1 : -1;
  const i = levelConfig(t), l = Date.now(), u = l + i.budget;
  let c = 0, d = 0;
  const f = {};
  const tick = () => {
    if (++c > i.nodes || Date.now() > u)
      throw f;
  };
  function ordered(e, t) {
    return allMoves(t, e).sort((t, r) => {
      const value = t => {
        const r = e.board[t.sy][t.sx], n = e.board[t.ty][t.tx];
        return (n ? pieceValue[n[1]] * 10 - pieceValue[r[1]] : 0) + (r[1] === 'P' && (t.ty === 0 || t.ty === 7) ? 8000 : 0);
      };
      return value(r) - value(t);
    });
  }
  function search(e, t, r, n, a, i) {
    tick();
    const l = ordered(e, t);
    if (!l.length)
      return isKingInCheck(t, e.board) ? t === o ? -100000 + i : 100000 - i : 0;
    if (r === 0)
      return s * evaluateBoard(e.board);
    let u = t === o ? -1 / 0 : 1 / 0;
    for (const s of l) {
      const l = search(nextState(e, s), opposite(t), r - 1, n, a, i + 1);
      if (t === o) {
        u = Math.max(u, l);
        n = Math.max(n, u);
      } else {
        u = Math.min(u, l);
        a = Math.min(a, u);
      }
      if (a <= n)
        break;
    }
    return u;
  }
  const m = ordered(e, o);
  if (!m.length)
    return {
      move: null,
      depth: 0,
      nodes: c
    };
  let h = m.map(t => {
    const r = nextState(e, t), o = allMoves(a, r), i = !o.length && isKingInCheck(a, r.board), l = !o.length && !i;
    const u = [
      t.sx,
      t.sy,
      t.tx,
      t.ty
    ].join(',');
    return {
      m: t,
      s: r,
      mate: i,
      stalemate: l,
      repeat: n.filter(e => e === u).length,
      score: i ? 99999 : l ? 0 : s * evaluateBoard(r.board)
    };
  });
  for (let e = 1; e <= i.depth; e++) {
    const t = [];
    try {
      for (const r of h) {
        tick();
        t.push(r.mate ? 99999 : r.stalemate ? 0 : search(r.s, a, e - 1, -1 / 0, 1 / 0, 1));
      }
    } catch (e) {
      if (e !== f)
        throw e;
      break;
    }
    h = h.map((e, r) => ({
      ...e,
      score: t[r]
    }));
    d = e;
    h.sort((e, t) => t.score - e.score);
  }
  const p = h.filter(e => e.mate);
  let g = h;
  if (p.length) {
    if (r() >= i.mateMiss || h.length === p.length)
      return {
        move: p[Math.floor(r() * p.length)].m,
        depth: Math.max(1, d),
        nodes: c
      };
    g = h.filter(e => !e.mate);
  }
  const y = Math.max(...g.map(e => e.score));
  if (y > 150 && g.some(e => !e.stalemate))
    g = g.filter(e => !e.stalemate);
  const v = r() < i.error;
  const b = v ? 100 + 450 * (1 - (t - 1) / 49) : 25 + i.noise;
  const M = g.filter(e => e.score >= y - b);
  const x = M.map(e => ({
    r: e,
    value: e.score - e.repeat * 45 + (r() - 0.5) * i.noise * (v ? 3 : 1)
  })).sort((e, t) => t.value - e.value);
  let w = x[0]?.r || g[0];
  if (v && x.length > 1)
    w = x[Math.floor(r() * Math.min(5, x.length))].r;
  return {
    move: w.m,
    depth: d,
    nodes: c
  };
}

export function workerSource() {
  const e = {
    opposite: opposite,
    inside: inside,
    pathClear: pathClear,
    isSquareAttacked: isSquareAttacked,
    kingPosition: kingPosition,
    isKingInCheck: isKingInCheck,
    canCastle: canCastle,
    canMoveRaw: canMoveRaw,
    simulateMove: simulateMove,
    isLegalMove: isLegalMove,
    getLegalMoves: getLegalMoves,
    allMoves: allMoves,
    nextState: nextState,
    evaluateBoard: evaluateBoard,
    levelConfig: levelConfig,
    playerMoveQuality: playerMoveQuality,
    engineChoose: engineChoose
  };
  return 'const gameType="chess", forcedCapture=null; const isVariant=()=>false; const pieceValue=' + JSON.stringify(pieceValue) + ';\n' + serializeWorkerFunctions(e) + `\n onmessage=event=>{try{const {state,level,history,before,ai='b'}=event.data;\n const quality=before?playerMoveQuality(before.state,before.move):null;\n const result=engineChoose(state,level,Math.random,history,ai);postMessage({result,quality});\n }catch(error){postMessage({error:String(error)});}};`;
}

export function pathClear(e, t, r, n, o) {
  const a = Math.sign(n - t), s = Math.sign(o - r);
  for (let i = t + a, l = r + s; i !== n || l !== o; i += a, l += s)
    if (e[l][i])
      return false;
  return true;
}

export function isSquareAttacked(e, t, r, n) {
  for (let o = 0; o < 8; o++)
    for (let a = 0; a < 8; a++) {
      const s = e[o][a];
      if (!s || s[0] !== n)
        continue;
      const i = t - a, l = r - o;
      if (!i && !l)
        continue;
      switch (s[1]) {
      case 'P':
        if (Math.abs(i) === 1 && l === (n === 'w' ? -1 : 1))
          return true;
        break;
      case 'N':
        if (Math.abs(i) * Math.abs(l) === 2)
          return true;
        break;
      case 'K':
        if (Math.max(Math.abs(i), Math.abs(l)) === 1)
          return true;
        break;
      default: {
          const n = Math.abs(i) === Math.abs(l), u = i === 0 || l === 0;
          if ((s[1] === 'B' && n || s[1] === 'R' && u || s[1] === 'Q' && (n || u)) && pathClear(e, a, o, t, r))
            return true;
        }
      }
    }
  return false;
}

export function kingPosition(e, t) {
  for (let r = 0; r < 8; r++)
    for (let n = 0; n < 8; n++)
      if (e[r][n] === t + 'K')
        return {
          x: n,
          y: r
        };
  return null;
}

export function isKingInCheck(e, t = board) {
  if (gameType !== 'chess')
    return false;
  const r = kingPosition(t, e);
  return !r || isSquareAttacked(t, r.x, r.y, opposite(e));
}

export function canCastle(e, t, r = liveState()) {
  const {
      board: n,
      moved: o
    } = r, a = e === 'w' ? 7 : 0, s = t === 'king', i = s ? 7 : 0;
  if (n[a][4] !== e + 'K' || n[a][i] !== e + 'R' || o[e + 'K'] || o[e + 'R' + i] || isKingInCheck(e, n))
    return false;
  for (const e of s ? [
      5,
      6
    ] : [
      1,
      2,
      3
    ])
    if (n[a][e])
      return false;
  for (const t of s ? [
      5,
      6
    ] : [
      3,
      2
    ]) {
    const r = n.map(e => e.slice());
    r[a][4] = '';
    r[a][t] = e + 'K';
    if (isKingInCheck(e, r))
      return false;
  }
  return true;
}

export function canMoveRaw(e, t, r, n, o = board, a = enPassant, s = moved) {
  if (gameType === 'reversi')
    return reversiFlips(o, r, n, turn).length > 0;
  if (gameType === 'checkers')
    return draughtsMoves(o, o[t]?.[e]?.[0], forcedCapture).some(o => o.sx === e && o.sy === t && o.tx === r && o.ty === n);
  if (gameType === 'breakthrough')
    return breakthroughCanMove(e, t, r, n, o);
  if (!inside(e, t) || !inside(r, n) || e === r && t === n)
    return false;
  const i = o[t][e], l = o[n][r];
  if (!i || l && (l[0] === i[0] || l[1] === 'K'))
    return false;
  const u = r - e, c = n - t;
  switch (i[1]) {
  case 'P': {
      const n = i[0] === 'w' ? -1 : 1;
      if (!u && !l && (c === n || c === 2 * n && t === (i[0] === 'w' ? 6 : 1) && !s['pawn' + e + ',' + t] && !o[t + n][e]))
        return true;
      return Math.abs(u) === 1 && c === n && !!(l || a && a.color !== i[0] && a.x === r && a.y === t && o[t][r] === opposite(i[0]) + 'P');
    }
  case 'N':
    return Math.abs(u) * Math.abs(c) === 2;
  case 'K':
    return Math.max(Math.abs(u), Math.abs(c)) === 1 || e === 4 && t === (i[0] === 'w' ? 7 : 0) && c === 0 && Math.abs(u) === 2 && canCastle(i[0], u > 0 ? 'king' : 'queen', {
      board: o,
      enPassant: a,
      moved: s
    });
  default:
    return (i[1] === 'R' && (u === 0 || c === 0) || i[1] === 'B' && Math.abs(u) === Math.abs(c) || i[1] === 'Q' && (u === 0 || c === 0 || Math.abs(u) === Math.abs(c))) && pathClear(o, e, t, r, n);
  }
}

export function simulateMove(e, t, r, n, o, a = {
  enPassant: enPassant,
  moved: moved
}) {
  if (gameType === 'breakthrough') {
    const s = e[o][n];
    return {
      board: breakthroughNext(e, {
        sx: t,
        sy: r,
        tx: n,
        ty: o
      }),
      state: {
        moved: { ...a.moved },
        enPassant: null
      },
      captured: s,
      castle: false,
      promotion: false,
      pawn: true
    };
  }
  const s = e.map(e => e.slice()), i = s[r][t], l = { ...a.moved || moved }, u = a.enPassant;
  let c = s[o][n], d = false;
  delete l['pawn' + n + ',' + o];
  if (i[1] === 'P') {
    delete l['pawn' + t + ',' + r];
    if (o !== 0 && o !== 7)
      l['pawn' + n + ',' + o] = true;
  }
  if (i[1] === 'P' && t !== n && !c && u && u.x === n && u.y === r) {
    c = s[r][n];
    s[r][n] = '';
    delete l['pawn' + n + ',' + r];
  }
  if (i[1] === 'K' && Math.abs(n - t) === 2) {
    const e = n > t ? 7 : 0, o = n > t ? 5 : 3;
    s[r][o] = s[r][e];
    s[r][e] = '';
    l[i[0] + 'R' + e] = true;
    d = true;
  }
  if (i[1] === 'K')
    l[i] = true;
  if (i[1] === 'R' && r === (i[0] === 'w' ? 7 : 0) && (t === 0 || t === 7))
    l[i[0] + 'R' + t] = true;
  if (c && c[1] === 'R' && o === (c[0] === 'w' ? 7 : 0) && (n === 0 || n === 7))
    l[c[0] + 'R' + n] = true;
  s[r][t] = '';
  s[o][n] = i[1] === 'P' && (o === 0 || o === 7) ? i[0] + 'Q' : i;
  return {
    board: s,
    state: {
      moved: l,
      enPassant: i[1] === 'P' && Math.abs(o - r) === 2 ? {
        x: n,
        y: o,
        color: i[0]
      } : null
    },
    captured: c,
    castle: d,
    promotion: s[o][n] !== i,
    pawn: i[1] === 'P'
  };
}

export function isLegalMove(e, t, r, n, o = board, a = enPassant, s = moved) {
  if (isVariant())
    return canMoveRaw(e, t, r, n, o, a, s);
  if (!canMoveRaw(e, t, r, n, o, a, s))
    return false;
  const i = simulateMove(o, e, t, r, n, {
    enPassant: a,
    moved: s
  });
  return !isKingInCheck(o[t][e][0], i.board);
}

export function getLegalMoves(e, t, r = board, n = enPassant, o = moved) {
  if (gameType === 'arimaa')
    return arOptions().filter(e => e.kind === 'step' || arEnemy).map(e => ({
      x: e.tx,
      y: e.ty
    }));
  if (gameType === 'checkers')
    return draughtsMoves(r, r[t]?.[e]?.[0], forcedCapture).filter(r => r.sx === e && r.sy === t).map(e => ({
      x: e.tx,
      y: e.ty,
      capture: !!e.capture
    }));
  const a = [];
  for (let s = 0; s < 8; s++)
    for (let i = 0; i < 8; i++)
      if (isLegalMove(e, t, i, s, r, n, o))
        a.push({
          x: i,
          y: s
        });
  return a;
}

export function allMoves(e, t = liveState()) {
  if (gameType === 'checkers')
    return draughtsMoves(t.board, e, t.chain);
  if (gameType === 'reversi')
    return reversiMoves(t.board, e);
  const r = [];
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++)
      if (t.board[n][o]?.[0] === e)
        for (const e of getLegalMoves(o, n, t.board, t.enPassant, t.moved))
          r.push({
            sx: o,
            sy: n,
            tx: e.x,
            ty: e.y
          });
  return r;
}

export function nextState(e, t) {
  const r = simulateMove(e.board, t.sx, t.sy, t.tx, t.ty, e);
  return {
    board: r.board,
    ...r.state
  };
}

export function isCheckmate(e) {
  return isKingInCheck(e) && allMoves(e).length === 0 && !hasSkillEscape(e);
}

export function isStalemate(e) {
  return !isKingInCheck(e) && allMoves(e).length === 0 && !hasSkillEscape(e);
}

export function insufficientMaterial() {
  if (isSkillMode())
    return false;
  const e = [];
  for (let t = 0; t < 8; t++)
    for (let r = 0; r < 8; r++) {
      const n = board[t][r];
      if (!n || n[1] === 'K')
        continue;
      if ('PQR'.includes(n[1]))
        return false;
      e.push({
        type: n[1],
        shade: (r + t) % 2
      });
    }
  return e.length <= 1 || e.every(e => e.type === 'B') && e.every(t => t.shade === e[0].shade);
}

export function playMove(e) {
  if (isVariant()) {
    playVariantMove(e);
    return;
  }
  const t = board[e.sy][e.sx];
  if (isSoloMode() && turn === playerColor()) {
    pushUndoSnapshot();
    set_analysisBefore({
      state: liveState(),
      move: { ...e }
    });
  }
  const r = simulateMove(board, e.sx, e.sy, e.tx, e.ty, liveState());
  set_board(r.board);
  set_moved(r.state.moved);
  set_enPassant(r.state.enPassant);
  if (isSkillMode() && r.captured)
    points[opposite(turn)] = Math.min(10, points[opposite(turn)] + 1);
  set_halfmove(r.pawn || r.captured ? 0 : halfmove + 1);
  set_lastMoveMessage(r.promotion ? 'プロモーション\uFF01' : r.castle ? 'キャスリング\uFF01' : r.captured ? '駒を取りました\u3002' : '');
  set_lastMove({ ...e });
  setHint('');
  endTurn();
  animateMove(e, t);
}

export function chessEnding() {
  if (isCheckmate(turn))
    return 'チェックメイト\uFF01 ' + (turn === 'w' ? '黒' : '白') + 'の勝ち';
  if (isStalemate(turn))
    return 'ステイルメイト\uFF01 引き分け';
  if (insufficientMaterial())
    return '詰ませる駒が足りないため引き分け';
  if ((repetitions.get(positionKey()) || 0) >= 3)
    return '同じ局面が3回現れたため引き分け';
  if (halfmove >= 100)
    return '50手の間\u3001捕獲\u30FBポーン移動がないため引き分け';
  return '';
}
