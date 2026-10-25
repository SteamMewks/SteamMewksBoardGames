import { allMoves, evaluateBoard, isKingInCheck, nextState } from './chess.js';
import { aiColor, analysisBefore, animating, board, boardEl, enPassant, gameMode, gameOver, halfmove, helpTopic, humanInputBlocked, inside, isAITurn, isSkillMode, isSoloMode, lastMove, lastMoveMessage, liveState, localTurnFlipped, moveAnimations, moved, opposite, pendingSkill, pieces, playerColor, points, profile, saveTransaction, selected, session, setHint, set_analysisBefore, set_animating, set_board, set_enPassant, set_halfmove, set_helpTopic, set_lastMove, set_lastMoveMessage, set_moveAnimations, set_moved, set_pendingSkill, set_saveTransaction, set_selected, set_shuffleSelection, set_shuffleVisualCleanup, shuffleSelection, shuffleVisualCleanup, turn } from '../core/state.js';
import { levelConfig } from '../core/ai.js';
import { drawBoard, endTurn, pushUndoSnapshot, updatePoints } from '../core/ui.js';

export const skillHints = {
  placePawn: '配置\uFF082pt\uFF09\uFF1A自陣側の空きマスにポーンを置きます\u3002白は2\u301C4段\u3001黒は5\u301C7段\u3002光るマスを選択\u3002',
  deleteEnemyPawn: '除去\uFF083pt\uFF09\uFF1A敵のポーンを1つ消去\u3002光る敵ポーンを選択\u3002',
  shuffleEnemy: '撹乱\uFF084pt\uFF09\uFF1A白\u30FB黒それぞれ0または2\u301C5駒をタップで選択\u3002同じ陣営の選択マス内で入れ替えます\u3002王\u30FBポーンも選択可能\u3002同じ撹乱ボタンで解除\u3002チェック中は使用不可\u3002',
  promotePawn: '昇格\uFF086pt\uFF09\uFF1A中央を越えた自分のポーンをクイーンに変更\u3002光るポーンを選択\u3002'
};

export const skills = {
  placePawn: {
    cost: 2,
    label: 'ポーン配置'
  },
  deleteEnemyPawn: {
    cost: 3,
    label: '敵ポーン除去'
  },
  shuffleEnemy: {
    cost: 4,
    label: '撹乱'
  },
  promotePawn: {
    cost: 6,
    label: '昇格'
  }
};

export function aiActionScore(e, t) {
  const r = allMoves(playerColor(), {
    board: e,
    moved: t,
    enPassant: null
  });
  if (!r.length)
    return isKingInCheck(playerColor(), e) ? 99999 : 0;
  const n = aiColor() === 'b' ? 1 : -1, o = n * evaluateBoard(e);
  let a = o;
  for (const o of r) {
    const r = nextState({
      board: e,
      moved: t,
      enPassant: null
    }, o);
    a = Math.min(a, n * evaluateBoard(r.board));
  }
  return o * 0.55 + a * 0.45;
}

export function chooseAISkill(e, t = Math.random) {
  if (gameMode !== 'singleSkill' || !isAITurn())
    return null;
  const r = liveState();
  let n = -1 / 0;
  if (e) {
    const t = nextState(r, e);
    n = aiActionScore(t.board, t.moved);
  }
  const o = [];
  for (const e of [
      'placePawn',
      'deleteEnemyPawn',
      'promotePawn'
    ]) {
    if (points[aiColor()] < skills[e].cost)
      continue;
    for (const t of skillTargets(e, aiColor())) {
      const r = skillBoard(e, t, aiColor());
      if (!r)
        continue;
      const n = { ...moved };
      delete n['pawn' + t.x + ',' + t.y];
      o.push({
        name: e,
        payload: t,
        score: aiActionScore(r, n) - skills[e].cost * 18
      });
    }
  }
  if (points[aiColor()] >= 4 && !isKingInCheck(aiColor())) {
    const e = shuffleSelection, r = {
        w: [],
        b: []
      };
    for (let e = 0; e < 8; e++)
      for (let t = 0; t < 8; t++) {
        const n = board[e][t];
        if (n)
          r[n[0]].push({
            x: t,
            y: e
          });
      }
    try {
      for (let e = 0; e < 4; e++) {
        const e = {
          w: [],
          b: []
        };
        for (const n of [
            'w',
            'b'
          ]) {
          const o = [...r[n]];
          for (let e = o.length - 1; e > 0; e--) {
            const r = Math.floor(t() * (e + 1));
            [o[e], o[r]] = [
              o[r],
              o[e]
            ];
          }
          if (o.length >= 2) {
            const r = Math.min(5, o.length);
            e[n] = o.slice(0, 2 + Math.floor(t() * (r - 1)));
          }
        }
        set_shuffleSelection(e);
        const n = findShuffleArrangement();
        if (n)
          o.push({
            name: 'shuffleEnemy',
            selection: e,
            arrangement: n,
            score: aiActionScore(n.board, n.moved) - 72
          });
      }
    } finally {
      set_shuffleSelection(e);
    }
  }
  if (!o.length)
    return null;
  const a = levelConfig(profile.level).noise;
  const s = o.map(e => ({
    ...e,
    ranking: e.score + (t() - 0.5) * a
  })).sort((e, t) => t.ranking - e.ranking);
  const i = s[0];
  if (!e)
    return i;
  if (i.ranking < n + 12)
    return null;
  return t() < 0.6 + 0.4 * (profile.level - 1) / 49 ? i : null;
}

export function skillBoard(e, t, r, n = board) {
  const o = n.map(e => e.slice());
  if (e === 'shuffleEnemy')
    return null;
  else {
    if (!t || !inside(t.x, t.y))
      return null;
    const {
        x: n,
        y: a
      } = t, s = o[a][n];
    if (e === 'placePawn') {
      if (s || !(r === 'w' ? a >= 4 && a <= 6 : a >= 1 && a <= 3))
        return null;
      o[a][n] = r + 'P';
    } else if (e === 'deleteEnemyPawn') {
      if (s !== opposite(r) + 'P')
        return null;
      o[a][n] = '';
    } else if (e === 'promotePawn') {
      if (s !== r + 'P' || !(r === 'w' ? a <= 3 : a >= 4))
        return null;
      o[a][n] = r + 'Q';
    } else
      return null;
  }
  return isKingInCheck(r, o) ? null : o;
}

export function skillTargets(e, t) {
  if (e === 'shuffleEnemy') {
    if (isKingInCheck(t))
      return [];
    for (const e of [
        'w',
        'b'
      ]) {
      const t = new Set();
      for (const r of board)
        for (const n of r)
          if (n?.[0] === e)
            t.add(n[1]);
      if (t.size > 1)
        return [{}];
    }
    return [];
  }
  const r = [];
  for (let n = 0; n < 8; n++)
    for (let o = 0; o < 8; o++) {
      const a = {
        x: o,
        y: n
      };
      if (skillBoard(e, a, t))
        r.push(a);
    }
  return r;
}

export function hasSkillEscape(e) {
  return isSkillMode() && Object.keys(skills).some(t => points[e] >= skills[t].cost && skillTargets(t, e).length > 0);
}

export function activateSkill(e, t = turn) {
  if (e === 'shuffleEnemy') {
    beginShuffle();
    return;
  }
  if (!isSkillMode() || gameOver || animating || humanInputBlocked() || t !== turn || !skills[e])
    return;
  set_helpTopic(null);
  if (pendingSkill === e) {
    set_pendingSkill(null);
    setHint('スキルをキャンセルしました\u3002');
    drawBoard();
    return;
  }
  if (points[turn] < skills[e].cost) {
    setHint('ポイントが足りません\u3002');
    return;
  }
  if (!skillTargets(e, turn).length) {
    setHint('今はこのスキルを使える対象がありません\u3002');
    return;
  }
  set_selected(null);
  set_pendingSkill(e);
  setHint('');
  drawBoard();
}

export function useSkill(e, t, r = turn) {
  if (!isSkillMode() || gameOver || animating || humanInputBlocked() || r !== turn || !skills[e])
    return;
  if (points[turn] < skills[e].cost) {
    setHint('ポイントが足りません\u3002');
    return;
  }
  if (e === 'shuffleEnemy') {
    beginShuffle();
    return;
  }
  const n = skillBoard(e, t, turn);
  if (!n) {
    setHint('その対象には使えません\u3002自分のキングの安全も確認してください\u3002');
    return;
  }
  rememberHumanSkill();
  delete moved['pawn' + t.x + ',' + t.y];
  set_board(n);
  points[turn] -= skills[e].cost;
  set_enPassant(null);
  set_halfmove(0);
  set_lastMove(null);
  set_lastMoveMessage(skills[e].label + 'を使いました\u3002');
  setHint('');
  endTurn();
}

export function validShuffleSelection() {
  const e = [
    'w',
    'b'
  ].map(e => shuffleSelection[e].length);
  return e.every(e => e === 0 || e >= 2 && e <= 5) && e.some(e => e >= 2);
}

export function beginShuffle() {
  if (!isSkillMode() || gameOver || animating || humanInputBlocked())
    return;
  if (pendingSkill === 'shuffleEnemy') {
    cancelShuffle();
    return;
  }
  set_helpTopic(null);
  if (points[turn] < skills.shuffleEnemy.cost) {
    setHint('撹乱には4pt必要です\u3002');
    return;
  }
  if (isKingInCheck(turn)) {
    setHint('チェック中は撹乱を使えません\u3002先にキングを守ってください\u3002');
    return;
  }
  if (!skillTargets('shuffleEnemy', turn).length) {
    setHint('入れ替えで見た目が変わる駒の組がありません\u3002');
    return;
  }
  set_selected(null);
  set_shuffleSelection({
    w: [],
    b: []
  });
  set_pendingSkill('shuffleEnemy');
  setHint('');
  drawBoard();
}

export function cancelShuffle() {
  if (animating || humanInputBlocked())
    return;
  set_pendingSkill(null);
  set_shuffleSelection({
    w: [],
    b: []
  });
  setHint('撹乱をキャンセルしました\u3002ポイントは消費していません\u3002');
  drawBoard();
}

export function toggleShuffleTarget(e, t) {
  if (humanInputBlocked())
    return;
  const r = board[t][e];
  if (!r) {
    setHint('駒があるマスを選んでください\u3002');
    return;
  }
  const n = shuffleSelection[r[0]], o = n.findIndex(r => r.x === e && r.y === t);
  if (o >= 0)
    n.splice(o, 1);
  else if (n.length < 5)
    n.push({
      x: e,
      y: t
    });
  else {
    setHint((r[0] === 'w' ? '白' : '黒') + 'は5駒までです\u3002選択した駒を再タップすると解除できます\u3002');
    return;
  }
  setHint('');
  drawBoard();
}

export function shufflePermutations(e) {
  if (!e.length)
    return [[]];
  const t = [], r = new Set();
  function visit(n, o) {
    if (!o.length) {
      const o = n.map(t => board[e[t].y][e[t].x]).join(',');
      if (r.has(o))
        return;
      r.add(o);
      if (!n.some((t, r) => board[e[t].y][e[t].x] !== board[e[r].y][e[r].x]))
        return;
      if (n.some((t, r) => board[e[t].y][e[t].x][1] === 'P' && (e[r].y === 0 || e[r].y === 7)))
        return;
      t.push(n);
      return;
    }
    for (const e of o)
      visit([
        ...n,
        e
      ], o.filter(t => t !== e));
  }
  visit([], e.map((e, t) => t));
  for (let e = t.length - 1; e > 0; e--) {
    const r = Math.floor(Math.random() * (e + 1));
    [t[e], t[r]] = [
      t[r],
      t[e]
    ];
  }
  return t;
}

export function findShuffleArrangement() {
  if (!validShuffleSelection())
    return null;
  const e = {
    w: shufflePermutations(shuffleSelection.w),
    b: shufflePermutations(shuffleSelection.b)
  };
  for (const t of e.w)
    for (const r of e.b) {
      const e = board.map(e => e.slice()), n = { ...moved }, o = [];
      for (const n of [
          'w',
          'b'
        ]) {
        const a = shuffleSelection[n], s = n === 'w' ? t : r;
        for (let t = 0; t < a.length; t++) {
          const r = a[s[t]], n = a[t], i = board[r.y][r.x];
          e[n.y][n.x] = i;
          if (i !== board[n.y][n.x])
            o.push({
              sx: r.x,
              sy: r.y,
              tx: n.x,
              ty: n.y,
              piece: i
            });
        }
      }
      for (const e of o) {
        delete n['pawn' + e.sx + ',' + e.sy];
        delete n['pawn' + e.tx + ',' + e.ty];
        if (e.piece[1] === 'K')
          n[e.piece] = true;
        if (e.piece[1] === 'R' && e.sy === (e.piece[0] === 'w' ? 7 : 0) && (e.sx === 0 || e.sx === 7))
          n[e.piece[0] + 'R' + e.sx] = true;
      }
      for (const o of [
          'w',
          'b'
        ]) {
        const a = shuffleSelection[o], s = o === 'w' ? t : r;
        for (let t = 0; t < a.length; t++) {
          const r = a[s[t]], o = a[t], i = 'pawn' + o.x + ',' + o.y;
          delete n[i];
          if (e[o.y][o.x][1] === 'P' && (r.x !== o.x || r.y !== o.y || moved['pawn' + r.x + ',' + r.y]))
            n[i] = true;
        }
      }
      if (isKingInCheck('w', e) || isKingInCheck('b', e))
        continue;
      const a = {
        board: e,
        moved: n,
        enPassant: null
      };
      if (!allMoves('w', a).length || !allMoves('b', a).length)
        continue;
      return {
        board: e,
        moved: n,
        paths: o
      };
    }
  return null;
}

export async function confirmShuffle(e = null) {
  if (!isSkillMode() || humanInputBlocked() || pendingSkill !== 'shuffleEnemy' || gameOver || animating || !validShuffleSelection() || points[turn] < 4)
    return;
  const t = e || findShuffleArrangement();
  if (!t) {
    setHint('この組では安全な入替ができません\u3002駒を選び直してください\u3002ポイントと手番は消費していません\u3002');
    return;
  }
  rememberHumanSkill();
  const r = session;
  set_saveTransaction(r);
  set_board(t.board);
  set_moved(t.moved);
  set_enPassant(null);
  set_halfmove(0);
  points[turn] -= 4;
  set_selected(null);
  set_lastMove(null);
  set_lastMoveMessage('撹乱\uFF1A' + t.paths.length + '駒を入れ替えました\u3002');
  drawBoard();
  set_animating(true);
  updatePoints();
  try {
    await animateShuffle(t.paths, r);
  } finally {
    if (saveTransaction === r)
      set_saveTransaction(false);
    if (r === session) {
      for (const e of moveAnimations)
        e.cancel();
      set_moveAnimations([]);
      set_animating(false);
      set_pendingSkill(null);
      set_shuffleSelection({
        w: [],
        b: []
      });
      setHint('');
      endTurn();
    }
  }
}

export function rememberHumanSkill() {
  if (!isSoloMode() || turn !== playerColor())
    return;
  pushUndoSnapshot();
  set_analysisBefore(null);
}

export async function animateShuffle(e, t) {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    return;
  const r = [], n = [], o = [];
  let a = false;
  const cleanup = () => {
    if (a)
      return;
    a = true;
    for (const e of r)
      e.style.visibility = '';
    for (const e of n)
      e.remove();
    for (const e of o)
      e.classList.remove('shuffleActive');
  };
  set_shuffleVisualCleanup(cleanup);
  try {
    for (const t of e) {
      const e = boardEl.querySelector('[data-x="' + t.tx + '"][data-y="' + t.ty + '"]'), o = e.querySelector('.piece');
      if (o) {
        o.style.visibility = 'hidden';
        r.push(o);
      }
      const a = document.createElement('span');
      a.className = 'piece shuffleGhost ' + (t.piece[0] === 'w' ? 'whitePiece' : 'blackPiece');
      a.textContent = pieces[t.piece];
      const s = boardEl.getBoundingClientRect().width / 8;
      Object.assign(a.style, {
        left: t.sx * s + 'px',
        top: t.sy * s + 'px',
        width: s + 'px',
        height: s + 'px'
      });
      boardEl.appendChild(a);
      n.push(a);
    }
    const s = {
      P: 'ポーン',
      N: 'ナイト',
      B: 'ビショップ',
      R: 'ルーク',
      Q: 'クイーン',
      K: 'キング'
    };
    for (let r = 0; r < e.length; r++) {
      if (t !== session || a)
        return;
      const i = e[r], l = n[r], u = boardEl.getBoundingClientRect().width / 8;
      const c = boardEl.querySelector('[data-x="' + i.sx + '"][data-y="' + i.sy + '"]'), d = boardEl.querySelector('[data-x="' + i.tx + '"][data-y="' + i.ty + '"]');
      c.classList.add('shuffleActive');
      d.classList.add('shuffleActive');
      o.push(c, d);
      l.style.zIndex = String(20 + r);
      setHint('撹乱 ' + (r + 1) + '/' + e.length + '\uFF1A' + (i.piece[0] === 'w' ? '白' : '黒') + 'の' + s[i.piece[1]] + 'を移動中\u2026');
      const f = localTurnFlipped() || isSoloMode() && playerColor() === 'b' ? ' rotate(180deg)' : '';
      const m = l.animate([
        { transform: 'translate(0,0)' + f },
        { transform: 'translate(' + (i.tx - i.sx) * u + 'px,' + (i.ty - i.sy) * u + 'px)' + f }
      ], {
        duration: 260,
        easing: 'ease-in-out',
        fill: 'forwards'
      });
      moveAnimations.push(m);
      await m.finished.catch(() => {
      });
      c.classList.remove('shuffleActive');
      d.classList.remove('shuffleActive');
    }
  } finally {
    cleanup();
    if (shuffleVisualCleanup === cleanup)
      set_shuffleVisualCleanup(null);
  }
}
