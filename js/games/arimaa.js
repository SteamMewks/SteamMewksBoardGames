import { aiThinking, aiWorker, animating, ar, arAnimationTask, arEnemy, arMode, board, boardEl, gameOver, helpTopic, hintOverride, humanInputBlocked, inside, isAITurn, isSoloMode, lastMove, lastSearch, localTurnFlipped, moveAnimations, opposite, pieces, playerColor, profile, repetitions, selected, session, setHint, set_aiThinking, set_aiWorker, set_animating, set_ar, set_arAnimationTask, set_arEnemy, set_arMode, set_board, set_hintOverride, set_lastMove, set_lastSearch, set_moveAnimations, set_selected, set_shuffleVisualCleanup, set_turn, set_workerURL, shuffleVisualCleanup, turn, undoHistory, workerURL } from '../core/state.js';
import { applyLearning, queueAITurn, serializeWorkerFunctions, terminateAIWorker } from '../core/ai.js';
import { cancelAnimations, drawBoard, pushUndoSnapshot, recordPosition, updateHint } from '../core/ui.js';

export function arEvaluate(e, t) {
  const r = {
    R: 180,
    C: 210,
    D: 280,
    H: 390,
    M: 580,
    E: 950
  };
  let n = 0;
  const o = {
    w: 0,
    b: 0
  };
  for (let a = 0; a < 8; a++)
    for (let s = 0; s < 8; s++) {
      const i = e[a][s];
      if (!i)
        continue;
      const l = i[0], u = l === 'w' ? 7 - a : a, c = arNeighbors(s, a), d = c.filter(([t, r]) => e[r][t]?.[0] === l), f = arFrozen(e, s, a);
      let m = r[i[1]] + Math.min(2, d.length) * 7 + c.filter(([t, r]) => !e[r][t]).length * 3;
      if (f)
        m -= i[1] === 'R' ? 65 : r[i[1]] * 0.22;
      if (i[1] === 'R') {
        o[l]++;
        m += u * u * 7;
        let t = 0;
        const r = l === 'w' ? -1 : 1;
        for (let n = a + r; inside(s, n) && !e[n][s]; n += r)
          t++;
        if (!f && t >= 7 - u)
          m += u >= 3 ? 120 + u * 25 : 15;
      } else
        m += (7 - Math.abs(3.5 - s) - Math.abs(3.5 - a)) * 4;
      n += (l === t ? 1 : -1) * m;
    }
  for (const [o, a] of [
      [
        2,
        2
      ],
      [
        5,
        2
      ],
      [
        2,
        5
      ],
      [
        5,
        5
      ]
    ])
    for (const s of [
        'w',
        'b'
      ]) {
      const i = arNeighbors(o, a).filter(([t, r]) => e[r][t]?.[0] === s);
      let l = i.length * 24;
      for (const [t, r] of i) {
        const n = e[r][t];
        if (n[1] === 'E')
          l += 25;
        if (arFrozen(e, t, r))
          l -= 35;
      }
      const u = e[a][o];
      if (u?.[0] === s)
        if (i.length === 1) {
          l -= r[u[1]] * 0.25;
          const [t, n] = i[0], o = e[n][t];
          if (arNeighbors(t, n).some(([t, r]) => e[r][t] && e[r][t][0] !== s && arStrength(e[r][t]) > arStrength(o) && !arFrozen(e, t, r)))
            l -= r[u[1]] * 0.65;
        } else if (i.length >= 2)
          l += 18;
      n += (s === t ? 1 : -1) * l;
    }
  if (o[t] === 1)
    n -= 150;
  if (o[opposite(t)] === 1)
    n += 150;
  return n;
}

export function arGoalPlan(e, t, r) {
  const n = arKey(e), o = t === 'w' ? -1 : 1;
  function walk(e, a, s, i, l, u) {
    if (arFrozen(e, a, s))
      return null;
    for (const [c, d] of arNeighbors(a, s)) {
      if (e[d][c] || d - s === -o || Math.abs((t === 'w' ? 0 : 7) - d) > i - 1)
        continue;
      const f = {
          sx: a,
          sy: s,
          tx: c,
          ty: d
        }, m = arStep(e, f), h = arKey(m);
      if (m[d][c] !== t + 'R' || u.has(h))
        continue;
      const p = {
          kind: 'step',
          ...f,
          cost: 1,
          paths: [f],
          board: m
        }, g = [
          ...l,
          p
        ];
      if (d === (t === 'w' ? 0 : 7) && arCanEnd(m, t, n, r))
        return {
          board: m,
          path: g,
          value: 100000,
          used: g.length
        };
      if (i > 1) {
        const e = walk(m, c, d, i - 1, g, new Set([
          ...u,
          h
        ]));
        if (e)
          return e;
      }
    }
    return null;
  }
  for (let r = 0; r < 8; r++)
    for (let o = 0; o < 8; o++)
      if (e[r][o] === t + 'R' && Math.abs((t === 'w' ? 0 : 7) - r) <= 4) {
        const t = walk(e, o, r, 4, [], new Set([n]));
        if (t)
          return t;
      }
  return null;
}

export function arPlans(e, t, r, n, o) {
  const a = arKey(e), s = 5 + Math.floor(n * 0.8), i = Array.from({ length: 5 }, () => []), l = new Map();
  let u = 0;
  i[0].push({
    board: e,
    path: [],
    used: 0,
    seen: [a],
    value: arEvaluate(e, t)
  });
  for (let e = 0; e < 4; e++) {
    const n = new Map();
    for (const t of i[e]) {
      const e = arKey(t.board);
      if (!n.has(e) || n.get(e).value < t.value)
        n.set(e, t);
    }
    const c = [...n.values()].sort((e, t) => t.value - e.value).slice(0, s);
    for (const n of c) {
      for (const s of arActions(n.board, t, 4 - e)) {
        u++;
        const c = arKey(s.board);
        if (n.seen.includes(c))
          continue;
        const d = arGoalWinner(s.board, t), f = d ? d === t ? 100000 : -100000 : arEvaluate(s.board, t);
        const m = {
          board: s.board,
          path: [
            ...n.path,
            s
          ],
          used: e + s.cost,
          seen: [
            ...n.seen,
            c
          ],
          value: f
        };
        if (arCanEnd(s.board, t, a, r) && (!l.has(c) || l.get(c).used > m.used))
          l.set(c, m);
        if (m.used < 4)
          i[m.used].push(m);
        if (u % 64 === 0 && Date.now() > o)
          break;
      }
      if (Date.now() > o)
        break;
    }
    if (Date.now() > o)
      break;
  }
  return {
    plans: [...l.values()].sort((e, t) => t.value - e.value || e.used - t.used),
    nodes: u
  };
}

export function arChoose(e, t, r, n) {
  const o = Date.now(), a = 160 + n * 20, s = o + a, i = arGoalPlan(e, t, r);
  if (i)
    return {
      path: i.path,
      depth: 1,
      nodes: 1
    };
  const l = arPlans(e, t, r, n, o + a * 0.4), u = n < 8 ? 3 : n < 25 ? 6 : 10, c = l.plans.slice(0, u);
  let d = 1, f = l.nodes;
  for (let h = 0; h < c.length; h++) {
    const p = c[h];
    if (Math.abs(p.value) > 90000)
      continue;
    const g = new Map(r), y = arKey(p.board, opposite(t));
    g.set(y, (g.get(y) || 0) + 1);
    if (arGoalPlan(p.board, opposite(t), g)) {
      p.value = -100000;
      continue;
    }
    if (n >= 8) {
      const v = Math.max(8, (s - Date.now()) / (c.length - h));
      const b = arPlans(p.board, opposite(t), g, Math.max(8, Math.floor(n * 0.6)), Date.now() + v);
      f += b.nodes;
      if (b.plans.length) {
        p.value = -b.plans[0].value;
        d = 2;
      }
    }
  }
  c.sort((e, t) => t.value - e.value);
  let m = c[0];
  if (m && n < 40 && Math.random() < 0.3 * (1 - n / 50)) {
    const M = c.filter(e => e.value >= m.value - 120 * (1 - n / 50) && e.value > -90000);
    if (M.length)
      m = M[Math.floor(Math.random() * M.length)];
  }
  if (!m) {
    const x = arKey(e);
    function find(e, n, o, a) {
      for (const s of arActions(e, t, n)) {
        const e = arKey(s.board);
        if (a.has(e))
          continue;
        const i = [
          ...o,
          s
        ];
        if (arCanEnd(s.board, t, x, r))
          return i;
        if (n > s.cost) {
          const t = find(s.board, n - s.cost, i, new Set([
            ...a,
            e
          ]));
          if (t)
            return t;
        }
      }
      return null;
    }
    const w = find(e, 4, [], new Set([x]));
    if (w)
      m = { path: w };
  }
  return {
    path: m?.path || [],
    depth: d,
    nodes: f
  };
}

export function arWorkerSource() {
  return serializeWorkerFunctions({
    opposite: opposite,
    inside: inside,
    arKey: arKey,
    arNeighbors: arNeighbors,
    arStrength: arStrength,
    arFrozen: arFrozen,
    arTraps: arTraps,
    arStep: arStep,
    arActions: arActions,
    arGoalWinner: arGoalWinner,
    arCanEnd: arCanEnd,
    arEvaluate: arEvaluate,
    arGoalPlan: arGoalPlan,
    arPlans: arPlans,
    arChoose: arChoose
  }) + '\nonmessage=e=>{try{const d=e.data;postMessage({result:arChoose(d.board,d.color,new Map(d.reps),d.level)});}catch(err){postMessage({error:String(err)});}}';
}

export async function arMakeAI() {
  if (ar.setup || !isAITurn() || gameOver)
    return;
  const e = session;
  await arAnimationTask;
  if (e !== session || !isAITurn() || gameOver)
    return;
  set_aiThinking(true);
  updateHint();
  const accept = async t => {
    if (e !== session)
      return;
    terminateAIWorker();
    set_lastSearch({
      depth: t.depth,
      nodes: t.nodes
    });
    for (const r of t.path) {
      if (e !== session || !isAITurn() || gameOver)
        break;
      arApply(r);
      await arAnimationTask;
    }
    if (e !== session)
      return;
    set_aiThinking(false);
    if (isAITurn() && !gameOver) {
      if (!arEnd()) {
        ar.winner = playerColor();
        drawBoard();
      }
    } else
      drawBoard();
  };
  const fallback = () => {
    if (e !== session)
      return;
    terminateAIWorker();
    accept(arChoose(board, turn, repetitions, Math.min(7, profile.level)));
  };
  try {
    if (!workerURL)
      set_workerURL(URL.createObjectURL(new Blob([arWorkerSource()], { type: 'text/javascript' })));
    set_aiWorker(new Worker(workerURL));
    aiWorker.onmessage = e => e.data.error ? fallback() : accept(e.data.result);
    aiWorker.onerror = e => {
      e.preventDefault();
      fallback();
    };
    aiWorker.postMessage({
      board: board,
      color: turn,
      reps: [...repetitions],
      level: profile.level
    });
  } catch {
    fallback();
  }
}

export function arGlyph(e) {
  return pieces[e[0] + {
    E: 'K',
    M: 'Q',
    H: 'N',
    D: 'R',
    C: 'B',
    R: 'P'
  }[e[1]]];
}

export function arName(e) {
  return {
    E: '象',
    M: 'ラクダ',
    H: '馬',
    D: '犬',
    C: '猫',
    R: 'ウサギ'
  }[e[1]];
}

export function arInitial() {
  const e = Array.from({ length: 8 }, () => Array(8).fill(''));
  for (const t of [
      'w',
      'b'
    ]) {
    e[t === 'w' ? 7 : 0] = Array(8).fill(t + 'R');
    e[t === 'w' ? 6 : 1] = [
      'C',
      'D',
      'H',
      'M',
      'E',
      'H',
      'D',
      'C'
    ].map(e => t + e);
  }
  return e;
}

export function arKey(e, t) {
  return e.flat().join(',') + (t ? '|' + t : '');
}

export function arNeighbors(e, t) {
  return [
    [
      e - 1,
      t
    ],
    [
      e + 1,
      t
    ],
    [
      e,
      t - 1
    ],
    [
      e,
      t + 1
    ]
  ].filter(([e, t]) => inside(e, t));
}

export function arStrength(e) {
  return e ? 'RCDHME'.indexOf(e[1]) + 1 : 0;
}

export function arFrozen(e, t, r) {
  const n = e[r][t];
  if (!n)
    return false;
  const o = arNeighbors(t, r).map(([t, r]) => e[r][t]).filter(Boolean);
  return !o.some(e => e[0] === n[0]) && o.some(e => e[0] !== n[0] && arStrength(e) > arStrength(n));
}

export function arTraps(e) {
  const t = [];
  for (const [r, n] of [
      [
        2,
        2
      ],
      [
        5,
        2
      ],
      [
        2,
        5
      ],
      [
        5,
        5
      ]
    ]) {
    const o = e[n][r];
    if (o && !arNeighbors(r, n).some(([t, r]) => e[r][t]?.[0] === o[0])) {
      t.push({
        x: r,
        y: n,
        p: o
      });
      e[n][r] = '';
    }
  }
  return t;
}

export function arStep(e, t) {
  const r = e.map(e => e.slice());
  r[t.ty][t.tx] = r[t.sy][t.sx];
  r[t.sy][t.sx] = '';
  arTraps(r);
  return r;
}

export function arActions(e, t, r = 4) {
  const n = [];
  for (let o = 0; o < 8; o++)
    for (let a = 0; a < 8; a++) {
      const s = e[o][a];
      if (!s || s[0] !== t || arFrozen(e, a, o))
        continue;
      const i = arNeighbors(a, o).filter(([t, r]) => !e[r][t]);
      const l = arNeighbors(a, o).filter(([r, n]) => e[n][r] && e[n][r][0] !== t && arStrength(s) > arStrength(e[n][r]));
      for (const [u, c] of i) {
        if (s[1] === 'R' && c - o === (t === 'w' ? 1 : -1))
          continue;
        const i = {
          sx: a,
          sy: o,
          tx: u,
          ty: c
        };
        const d = arStep(e, i);
        n.push({
          kind: 'step',
          sx: a,
          sy: o,
          tx: u,
          ty: c,
          cost: 1,
          paths: [i],
          board: d
        });
        if (r < 2)
          continue;
        for (const [e, t] of l) {
          if (d[c][u] !== s || !d[t][e])
            continue;
          const r = {
            sx: e,
            sy: t,
            tx: a,
            ty: o
          };
          n.push({
            kind: 'pull',
            sx: a,
            sy: o,
            tx: u,
            ty: c,
            enemy: {
              x: e,
              y: t
            },
            cost: 2,
            paths: [
              i,
              r
            ],
            board: arStep(d, r)
          });
        }
      }
      if (r >= 2)
        for (const [t, r] of l)
          for (const [i, l] of arNeighbors(t, r)) {
            if (e[l][i])
              continue;
            const u = {
                sx: t,
                sy: r,
                tx: i,
                ty: l
              }, c = arStep(e, u);
            if (c[o][a] !== s)
              continue;
            const d = {
              sx: a,
              sy: o,
              tx: t,
              ty: r
            };
            n.push({
              kind: 'push',
              sx: a,
              sy: o,
              tx: i,
              ty: l,
              enemy: {
                x: t,
                y: r
              },
              cost: 2,
              paths: [
                u,
                d
              ],
              board: arStep(c, d)
            });
          }
    }
  return n;
}

export function arGoalWinner(e, t) {
  for (const r of [
      t,
      opposite(t)
    ])
    if (e[r === 'w' ? 0 : 7].includes(r + 'R'))
      return r;
  const r = e.flat();
  if (!r.includes(opposite(t) + 'R'))
    return t;
  if (!r.includes(t + 'R'))
    return opposite(t);
  return null;
}

export function arCanEnd(e, t, r, n) {
  return arKey(e) !== r && (n.get(arKey(e, opposite(t))) || 0) < 2;
}

export function arHasTurn(e, t, r) {
  const n = arKey(e);
  function visit(e, o, a) {
    for (const s of arActions(e, t, o)) {
      const e = arKey(s.board);
      if (a.has(e))
        continue;
      if (arCanEnd(s.board, t, n, r))
        return true;
      if (o > s.cost && visit(s.board, o - s.cost, new Set([
          ...a,
          e
        ])))
        return true;
    }
    return false;
  }
  return visit(e, 4, new Set([n]));
}

export function arLegalActions() {
  return arActions(board, turn, ar.remaining).filter(e => !ar.seen.includes(arKey(e.board)) && (e.cost < ar.remaining || arCanEnd(e.board, turn, ar.start, repetitions)));
}

export function arReset() {
  set_ar({
    setup: true,
    remaining: 4,
    start: arKey(board),
    seen: [arKey(board)],
    steps: [],
    winner: null
  });
  set_arMode('step');
  set_arEnemy(null);
  if (isSoloMode())
    set_turn(playerColor());
}

export function arBeginTurn() {
  ar.remaining = 4;
  ar.start = arKey(board);
  ar.seen = [ar.start];
  ar.steps = [];
  set_arMode('step');
  set_arEnemy(null);
  set_selected(null);
}

export function arConfirm() {
  if (gameOver || animating || humanInputBlocked())
    return;
  if (ar.setup) {
    set_selected(null);
    if (!isSoloMode() && turn === 'w')
      set_turn('b');
    else {
      ar.setup = false;
      set_turn('w');
      arBeginTurn();
      repetitions.clear();
      recordPosition();
    }
    drawBoard();
    queueAITurn();
    return;
  }
  arEnd();
}

export function arEnd() {
  if (ar.setup || !arCanEnd(board, turn, ar.start, repetitions)) {
    setHint('1歩以上動かし\u3001開始時と異なる配置にしてください\u3002同じ局面の3回目は選べません\u3002');
    return false;
  }
  const e = turn;
  ar.winner = arGoalWinner(board, e);
  if (isSoloMode() && e === playerColor()) {
    const e = undoHistory.at(-1);
    if (e) {
      const t = arEvaluate(board, playerColor()) - arEvaluate(e.board, playerColor());
      applyLearning(t >= -30 ? 0.85 : 0.2);
    }
  }
  set_turn(opposite(turn));
  arBeginTurn();
  recordPosition();
  if (!ar.winner && !arHasTurn(board, turn, repetitions))
    ar.winner = e;
  drawBoard();
  queueAITurn();
  return true;
}

export function arApply(e) {
  if (!arLegalActions().some(t => arActionID(t) === arActionID(e)))
    return false;
  if (isSoloMode() && turn === playerColor() && ar.remaining === 4)
    pushUndoSnapshot();
  const t = board.map(e => e.slice());
  ar.steps.push({
    board: board.map(e => e.slice()),
    remaining: ar.remaining,
    seen: [...ar.seen],
    lastMove: lastMove
  });
  set_board(e.board.map(e => e.slice()));
  ar.remaining -= e.cost;
  set_arMode('step');
  ar.seen.push(arKey(board));
  set_lastMove(e.paths.at(-1));
  set_selected(null);
  set_arEnemy(null);
  set_hintOverride('');
  if (!ar.remaining)
    arEnd();
  else
    drawBoard();
  set_arAnimationTask(arAnimate(e, t));
  return true;
}

export function arActionID(e) {
  return [
    e.kind,
    e.sx,
    e.sy,
    e.tx,
    e.ty,
    e.enemy?.x,
    e.enemy?.y
  ].join(',');
}

export function arBack() {
  if (animating || gameOver || humanInputBlocked() || ar.setup || !ar.steps.length)
    return;
  const e = ar.steps.pop();
  set_board(e.board);
  ar.remaining = e.remaining;
  ar.seen = e.seen;
  set_lastMove(e.lastMove);
  if (ar.remaining === 4 && isSoloMode() && turn === playerColor())
    undoHistory.pop();
  set_selected(null);
  set_arEnemy(null);
  set_hintOverride('');
  drawBoard();
}

export function arSetMode(e) {
  if (humanInputBlocked() || animating || gameOver || ar.setup || ar.remaining < 2 && arMode !== e)
    return;
  set_arMode(arMode === e ? 'step' : e);
  set_arEnemy(null);
  set_selected(null);
  set_hintOverride('');
  drawBoard();
}

export function arOptions() {
  if (!selected || ar.setup)
    return [];
  return arLegalActions().filter(e => e.sx === selected.x && e.sy === selected.y && e.kind === arMode && (!arEnemy || e.enemy?.x === arEnemy.x && e.enemy?.y === arEnemy.y));
}

export function arClick(e, t) {
  if (ar.setup) {
    if (board[t][e]?.[0] !== turn)
      return;
    if (selected) {
      const r = board[t][e];
      board[t][e] = board[selected.y][selected.x];
      board[selected.y][selected.x] = r;
      set_selected(null);
    } else
      set_selected({
        x: e,
        y: t
      });
    drawBoard();
    return;
  }
  const r = board[t][e];
  if (selected && arMode !== 'step' && r && r[0] !== turn) {
    const r = arLegalActions().filter(r => r.sx === selected.x && r.sy === selected.y && r.kind === arMode && r.enemy?.x === e && r.enemy?.y === t);
    if (r.length) {
      set_arEnemy({
        x: e,
        y: t
      });
      set_hintOverride('');
      drawBoard();
      return;
    }
  }
  const n = arOptions().find(r => r.tx === e && r.ty === t && (arMode === 'step' || arEnemy));
  if (n) {
    arApply(n);
    return;
  }
  if (r?.[0] === turn) {
    set_selected(selected?.x === e && selected?.y === t ? null : {
      x: e,
      y: t
    });
    set_arEnemy(null);
    set_hintOverride(arFrozen(board, e, t) ? 'この駒は凍結中\u3002隣へ味方を動かすと解除できます\u3002' : '');
    drawBoard();
  } else
    setHint('自分の駒を選択\u3002押す\u30FB引くでは\u3001続けて弱い敵と光る移動先を選びます\u3002');
}

export function arRules() {
  return '各陣営\uFF1A象1\u30FBラクダ1\u30FB馬2\u30FB犬2\u30FB猫2\u30FBウサギ8の16駒\u3002表示はキング\uFF1D象\u3001クイーン\uFF1Dラクダ\u3001ナイト\uFF1D馬\u3001ルーク\uFF1D犬\u3001ビショップ\uFF1D猫\u3001ポーン\uFF1Dウサギ\u3002白が先手\u3002最初に自陣2列の駒を入れ替え\u3001陣形を確定\u30021手番は最大4歩で\u3001縦横へ1マスずつ移動\u3002兎は後退不可\u3002強さは象6\uFF1E駱駝5\uFF1E馬4\uFF1E犬3\uFF1E猫2\uFF1E兎1\u3002強い駒は弱い敵を押す\u30FB引く\uFF082歩\uFF09\u3002強い敵の隣で味方が隣接しない駒は凍結\u3002\xD7の罠では隣の味方がいない駒は毎歩除去\u3002手番終了時\u3001自分の兎の最奥到達\u3001相手の兎の全滅\u3001相手が動けない場合に勝利\uFF08自分の到達を優先\uFF09\u3002開始と同じ配置での終了\u30FB同一局面3回目は禁止\u3002';
}

export function arEnding() {
  return ar.winner ? (ar.winner === 'w' ? '白' : '黒') + 'の勝ち\uFF01' : '';
}

export async function arAnimate(e, t) {
  cancelAnimations();
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    return;
  const r = session, n = [], o = [];
  let a = t;
  set_animating(true);
  const restore = () => {
    for (const e of o)
      e.remove();
    for (const e of n)
      e.style.visibility = '';
  };
  set_shuffleVisualCleanup(restore);
  for (const t of e.paths) {
    const e = boardEl.querySelector('[data-x="' + t.tx + '"][data-y="' + t.ty + '"] .piece');
    if (e) {
      n.push(e);
      e.style.visibility = 'hidden';
    }
  }
  try {
    for (const t of e.paths) {
      if (r !== session || shuffleVisualCleanup !== restore)
        break;
      const e = a[t.sy][t.sx];
      if (!e)
        continue;
      const n = boardEl.querySelector('[data-x="' + t.sx + '"][data-y="' + t.sy + '"]'), s = boardEl.querySelector('[data-x="' + t.tx + '"][data-y="' + t.ty + '"]');
      if (!n || !s)
        continue;
      const i = n.getBoundingClientRect(), l = s.getBoundingClientRect(), u = document.createElement('span');
      u.className = 'piece arAnimal arGhost ' + (e[0] === 'w' ? 'whitePiece' : 'blackPiece');
      u.textContent = arGlyph(e);
      u.style.left = i.left + 'px';
      u.style.top = i.top + 'px';
      u.style.width = i.width + 'px';
      u.style.height = i.height + 'px';
      u.style.setProperty('--cell', i.width + 'px');
      document.body.appendChild(u);
      o.push(u);
      const c = localTurnFlipped() ? ' rotate(180deg)' : '';
      const d = u.animate([
        { transform: c || 'none' },
        { transform: 'translate(' + (l.left - i.left) + 'px,' + (l.top - i.top) + 'px)' + c }
      ], {
        duration: 220,
        easing: 'ease-out',
        fill: 'forwards'
      });
      set_moveAnimations([d]);
      await d.finished.catch(() => {
      });
      a = arStep(a, t);
      u.remove();
      const f = s.querySelector('.piece');
      if (f)
        f.style.visibility = '';
    }
  } finally {
    restore();
    if (r === session && shuffleVisualCleanup === restore) {
      set_shuffleVisualCleanup(null);
      set_animating(false);
      set_moveAnimations([]);
      arDecorate();
    }
  }
}

export function arHelp(e) {
  if (e === 'rules')
    return arRules();
  if (e === 'colors')
    return '\xD7\uFF1D罠\u3001\u2744\uFF1D凍結\u3002数字は駒の強さ\uFF08象6\u30FBラクダ5\u30FB馬4\u30FB犬3\u30FB猫2\u30FBウサギ1\uFF09\u3002\u25CF\uFF1D移動先\u3001オレンジの枠\uFF1D押す\u30FB引く相手の候補\u3001黄枠\uFF1D選択中\u3002\u26A0の移動先では味方の駒が罠に落ちます\u3002';
  if (e === 'ai')
    return 'アリマア専用の適応型AI Lv.' + profile.level + '/50\u3002ウサギの突破経路\u3001罠の支援\u3001凍結を評価します\u30024歩を組み合わせ\u3001高レベルほど多くの候補と相手の応手を確認します\u3002低レベルでは見落としもします\u3002手の安定度\u30FB勝敗に応じてレベルが上下し\u3001待ったで応手と強さの調整を戻せます\u3002';
  return '';
}

export function arHint() {
  const e = hintOverride || (helpTopic ? arHelp(helpTopic) : gameOver ? document.getElementById('message').textContent : ar.setup ? (turn === 'w' ? '白' : '黒') + 'の配置\uFF1A自分の駒を2つタップで入替\u3002\u300C配置完了\u300Dで確定\u3002' + (isSoloMode() ? 'AIは標準陣形で開始します\u3002' : '') : aiThinking ? '機巧士が4歩の組み合わせを思案中\u2026' : arMode === 'step' ? (selected ? arName(board[selected.y][selected.x]) + '\uFF08強さ' + arStrength(board[selected.y][selected.x]) + '\uFF09\uFF1A' : '') + '自分の駒 \u2192 \u25CFの順にタップ\u3002残り' + ar.remaining + '歩\u3002好きなところで手番終了できます\u3002' : (arMode === 'push' ? '押す\uFF1A' : '引く\uFF1A') + '自分の強い駒 \u2192 オレンジ枠の弱い敵 \u2192 \u25CFの移動先\u30022歩消費\u3002実行後は通常移動へ自動解除\u3002\u300C戻す\u300Dも押し引きを一括で戻します\u3002同じボタンで解除\u3002');
  document.getElementById('hintMain').textContent = e;
  document.getElementById('hintWarning').textContent = !gameOver && !ar.setup ? '\u26A0 罠は隣の味方が支えます\u3002支える駒を離すと罠上の味方も失います\u3002' : '';
  for (const e of document.querySelectorAll('#hintTabs button'))
    e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : helpTopic === 'ai' ? 'mode' : helpTopic)));
}

export function arDecorate() {
  const e = arOptions();
  const t = selected && !ar.setup ? arLegalActions().filter(e => e.sx === selected.x && e.sy === selected.y && e.kind === arMode) : [];
  for (const r of boardEl.children) {
    const n = +r.dataset.x, o = +r.dataset.y, a = board[o][n];
    if ((n === 2 || n === 5) && (o === 2 || o === 5)) {
      r.classList.add('arTrap');
      const e = document.createElement('span');
      e.className = 'arTrapMark';
      e.textContent = '\xD7';
      r.appendChild(e);
    }
    if (a) {
      const e = r.querySelector('.piece');
      e.textContent = arGlyph(a);
      e.classList.add('arAnimal');
      const t = document.createElement('small');
      t.className = 'arRank';
      t.textContent = arStrength(a) + (arFrozen(board, n, o) ? '\u2744' : '');
      r.appendChild(t);
      r.setAttribute('aria-label', r.getAttribute('aria-label') + ' ' + arName(a) + ' 強さ' + arStrength(a) + (arFrozen(board, n, o) ? ' 凍結中' : ''));
    }
    if (t.some(e => e.enemy?.x === n && e.enemy?.y === o))
      r.classList.add('arTarget');
    if (arEnemy?.x === n && arEnemy?.y === o)
      r.classList.add('selected');
    if (a && arFrozen(board, n, o))
      r.classList.add('arFrozen');
    if (e.some(e => e.tx === n && e.ty === o && board.flat().filter(e => e?.[0] === turn).length > e.board.flat().filter(e => e?.[0] === turn).length)) {
      r.classList.add('dangerDestination');
      const e = document.createElement('span');
      e.className = 'dangerBadge';
      e.textContent = '\u26A0';
      r.appendChild(e);
    }
  }
  const r = gameOver || animating || humanInputBlocked();
  document.getElementById('arStatus').textContent = ar.setup ? (turn === 'w' ? '白' : '黒') + ' 配置中' : '残り ' + ar.remaining + ' / 4歩';
  document.getElementById('arDone').textContent = ar.setup ? '配置完了' : '手番終了';
  document.getElementById('arDone').disabled = r || !ar.setup && !arCanEnd(board, turn, ar.start, repetitions);
  document.getElementById('arBack').disabled = r || !ar.steps.length || ar.setup;
  for (const [e, t] of [
      [
        'arPush',
        'push'
      ],
      [
        'arPull',
        'pull'
      ]
    ]) {
    const n = document.getElementById(e);
    n.disabled = r || ar.setup || ar.remaining < 2 && arMode !== t;
    n.setAttribute('aria-pressed', String(arMode === t));
  }
}
