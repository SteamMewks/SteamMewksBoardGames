import { AI_GAMES, MATCH_SAVE_KEY, activeProfileId, aiColor, aiExecuting, aiThinking, aiTimer, aiWorker, analysisBefore, ar, board, forcedCapture, gameMode, gameOver, gameType, halfmove, inBoard, inside, isAITurn, isSoloMode, isVariant, lastMove, lastMoveMessage, lastSearch, liveState, morris, opposite, pendingSkill, playerColor, profile, profileStorageKey, q, recentAI, roundRewarded, savedMatch, selected, session, setHint, set_aiExecuting, set_aiThinking, set_aiTimer, set_aiWorker, set_analysisBefore, set_board, set_forcedCapture, set_halfmove, set_lastMove, set_lastMoveMessage, set_lastSearch, set_pendingSkill, set_profile, set_roundRewarded, set_selected, set_session, set_shuffleSelection, set_taflWinner, set_turn, set_workerURL, shuffleSelection, taflWinner, turn, workerURL } from './state.js';
import { readStorage, writeStorage } from './persistence.js';
import { animateMove, askUIAction, cancelAnimations, drawBoard, endTurn, finishCustomTurn, pushUndoSnapshot, recordPosition, updateHint, updatePoints, updateSoloOrder } from './ui.js';
import { breakthroughChoose, breakthroughWinner, breakthroughWorkerSource } from '../games/breakthrough.js';
import { engineChoose, isCheckmate, isLegalMove, playMove, workerSource } from '../games/chess.js';
import { chooseAISkill, confirmShuffle, useSkill } from '../games/chess-variant.js';
import { getGameModule } from './registry.js';
import { animateReversi, reversiApply, reversiCounts, reversiFlips, reversiMoves, reversiWinner } from '../games/reversi.js';
import { draughtsApply, draughtsCaptures, draughtsMoves, draughtsWinner } from '../games/checkers.js';
import { hnefAllMoves, hnefCorner, hnefEval, hnefKingCaptured, hnefKingPos, hnefMovesFrom, hnefNext, hnefRestricted, hnefStrategyChildren, hnefStrategyEval, hnefSupport, hnefThrone, hnefWinner } from '../games/hnefatafl.js';
import { qBlocked, qCanPlace, qColors, qDistanceMap, qGoalReached, qPawnMoves, qPawnPos, qPawnRouteMap, qShortest, qStrategyChildren, qStrategyEval, qWallCompatible, qWallKey, qWinner } from '../games/quoridor.js';
import { MORRIS_EDGES, MORRIS_MILLS, MORRIS_POINTS, morrisCount, morrisDoBase, morrisKey, morrisMillAt, morrisNeighbors, morrisRemoveTargets, morrisStrategyChildren, morrisStrategyEval, morrisWinner } from '../games/morris.js';

export function emptyProfile() {
  return {
    level: 1,
    samples: 0,
    quality: 0,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0
  };
}

export function loadProfile(e = activeProfileId) {
  const t = emptyProfile();
  try {
    const r = JSON.parse(readStorage(profileStorageKey(e)));
    if (r && Number.isFinite(r.level)) {
      const count = e => Number.isFinite(e) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(e))) : 0;
      t.level = Math.max(1, Math.min(50, Math.round(r.level)));
      t.samples = Math.min(5, count(r.samples));
      t.quality = Math.max(0, Math.min(5, Number(r.quality) || 0));
      for (const e of [
          'games',
          'wins',
          'losses',
          'draws'
        ])
        t[e] = count(r[e]);
      t.games = Math.max(t.games, t.wins + t.losses + t.draws);
    }
  } catch {
  }
  return t;
}

export function saveProfile() {
  return writeStorage(profileStorageKey(), profile);
}

export function openAIRecords() {
  if (gameMode)
    return;
  document.getElementById('aiRecordsStatus').textContent = '';
  renderAIRecords();
  document.getElementById('aiRecordsDialog').showModal();
}

export function closeAIRecords() {
  document.getElementById('aiRecordsDialog').close();
}

export function renderAIRecords() {
  const e = document.getElementById('aiRecordsList');
  e.replaceChildren();
  for (const [t, r] of AI_GAMES) {
    const n = loadProfile(t), o = document.createElement('section');
    o.className = 'aiRecordRow';
    const a = document.createElement('div'), s = document.createElement('strong'), i = document.createElement('span'), l = document.createElement('p');
    s.textContent = r;
    i.className = 'aiRecordLevel';
    i.textContent = 'Lv.' + n.level + ' / 50';
    l.textContent = n.games + '戦 \xB7 ' + n.wins + '勝 ' + n.losses + '敗 ' + n.draws + '分';
    const u = n.games - n.wins - n.losses - n.draws;
    if (u > 0) {
      const e = document.createElement('small');
      e.textContent = '過去' + u + '戦は勝敗内訳なし';
      l.appendChild(e);
    }
    a.append(s, i, l);
    const c = document.createElement('button');
    c.type = 'button';
    c.textContent = 'リセット';
    c.setAttribute('aria-label', r + 'の成績とAIレベルをリセット');
    c.onclick = () => resetAIRecord(t);
    o.append(a, c);
    e.appendChild(o);
  }
}

export function resetAIRecord(e) {
  if (gameMode)
    return;
  const t = AI_GAMES.find(t => t[0] === e);
  if (!t)
    return;
  askUIAction('記録を白紙に戻しますか\uFF1F', t[1] + 'の戦績と強さの調整履歴を消去し\u3001AIをLv.1に戻します\u3002この操作は取り消せません\u3002', 'リセットする', () => performAIRecordReset(e));
}

export function performAIRecordReset(e) {
  if (gameMode)
    return;
  const t = AI_GAMES.find(t => t[0] === e);
  if (!t)
    return;
  const r = emptyProfile();
  if (!writeStorage(profileStorageKey(e), r)) {
    document.getElementById('aiRecordsStatus').textContent = 'リセットを保存できませんでした\u3002ブラウザの保存設定を確認してください\u3002';
    return;
  }
  if (activeProfileId === e)
    set_profile(r);
  if (savedMatch?.profileId === e) {
    savedMatch.state.profile = { ...r };
    savedMatch.undoHistory = [];
    savedMatch.analysisBefore = null;
    writeStorage(MATCH_SAVE_KEY, savedMatch);
  }
  updateSoloOrder();
  renderAIRecords();
  document.getElementById('aiRecordsStatus').textContent = t[1] + 'をリセットしました\u3002';
  const n = document.getElementById('aiRecordsList').querySelectorAll('button');
  n[AI_GAMES.findIndex(t => t[0] === e)]?.focus();
}

export function terminateAIWorker() {
  if (aiWorker) {
    aiWorker.terminate();
    set_aiWorker(null);
  }
}

export function serializeWorkerFunctions(e) {
  return Object.entries(e).map(([e, t]) => 'const ' + e + '=' + t.toString() + ';').join('\n');
}

export function stopAI() {
  cancelAnimations();
  clearTimeout(aiTimer);
  terminateAIWorker();
  set_session(session + 1) - 1;
  set_aiThinking(false);
}

export function applyLearning(e) {
  profile.samples++;
  profile.quality += e;
  if (profile.samples >= 6) {
    const e = profile.quality / profile.samples;
    if (e >= 0.72)
      profile.level = Math.min(50, profile.level + 1);
    else if (e < 0.35)
      profile.level = Math.max(1, profile.level - 1);
    profile.samples = 0;
    profile.quality = 0;
  }
  saveProfile();
}

export function finishLearning(e) {
  if (!isSoloMode() || !e || roundRewarded)
    return;
  let t = null;
  if (gameType === 'hnefatafl')
    t = taflWinner;
  else if (gameType === 'quoridor')
    t = q.winner;
  else if (gameType === 'morris')
    t = morris.winner;
  else if (gameType === 'arimaa')
    t = ar.winner;
  else if (isVariant())
    t = variantWinner(liveState(), gameType, turn);
  else if (gameType === 'breakthrough')
    t = breakthroughWinner(board, turn);
  else if (isCheckmate(aiColor()))
    t = playerColor();
  else if (isCheckmate(playerColor()))
    t = aiColor();
  set_roundRewarded(true);
  profile.games++;
  if (t === playerColor()) {
    profile.wins++;
    profile.level = Math.min(50, profile.level + 3);
  } else if (t === aiColor()) {
    profile.losses++;
    profile.level = Math.max(1, profile.level - 2);
  } else
    profile.draws++;
  saveProfile();
}

export function levelConfig(e) {
  const t = (e - 1) / 49;
  return {
    depth: e < 8 ? 1 : e < 20 ? 2 : e < 34 ? 3 : e < 45 ? 4 : 5,
    budget: 120 + e * 14,
    nodes: 800 + e * 500,
    noise: 150 * (1 - t) ** 2 + 3,
    error: 0.5 * (1 - t) ** 2,
    mateMiss: 0.78 * (1 - t) ** 3
  };
}

export function acceptAI(e, t, r) {
  if (r !== session || !isSoloMode() || !isAITurn())
    return;
  terminateAIWorker();
  set_aiThinking(false);
  if (typeof t === 'number')
    applyLearning(t);
  set_analysisBefore(null);
  set_lastSearch({
    depth: e.depth,
    nodes: e.nodes
  });
  const n = e.move;
  if (gameMode === 'singleSkill') {
    const e = chooseAISkill(n);
    if (e) {
      set_aiExecuting(true);
      try {
        if (e.name === 'shuffleEnemy') {
          set_shuffleSelection(e.selection);
          set_pendingSkill('shuffleEnemy');
          confirmShuffle(e.arrangement);
        } else
          useSkill(e.name, e.payload, aiColor());
      } finally {
        set_aiExecuting(false);
      }
      return;
    }
  }
  if (n && isLegalMove(n.sx, n.sy, n.tx, n.ty)) {
    recentAI.push([
      n.sx,
      n.sy,
      n.tx,
      n.ty
    ].join(','));
    if (recentAI.length > 12)
      recentAI.shift();
    playMove(n);
  } else
    drawBoard();
}

export function makeAIMove() {
  const e = getGameModule().ai;
  if (e) {
    e();
    return;
  }
  if (!isSoloMode() || !isAITurn() || gameOver) {
    set_aiThinking(false);
    return;
  }
  const t = session, r = liveState();
  set_aiThinking(true);
  updateHint();
  const fallback = () => {
    if (t !== session)
      return;
    terminateAIWorker();
    set_aiTimer(setTimeout(() => {
      if (t !== session)
        return;
      acceptAI(isVariant() ? variantChoose(r, gameType, aiColor(), Math.min(7, profile.level)) : gameType === 'breakthrough' ? breakthroughChoose(r, Math.min(7, profile.level), Math.random, aiColor()) : engineChoose(r, Math.min(7, profile.level), Math.random, recentAI, aiColor()), null, t);
    }, 0));
  };
  try {
    if (!workerURL)
      set_workerURL(URL.createObjectURL(new Blob([isVariant() ? variantWorkerSource() : gameType === 'breakthrough' ? breakthroughWorkerSource() : workerSource()], { type: 'text/javascript' })));
    set_aiWorker(new Worker(workerURL));
    aiWorker.onmessage = e => {
      if (t !== session)
        return;
      if (e.data.error) {
        fallback();
        return;
      }
      acceptAI(e.data.result, e.data.quality, t);
    };
    aiWorker.onerror = e => {
      e.preventDefault();
      fallback();
    };
    aiWorker.postMessage({
      state: r,
      level: profile.level,
      history: recentAI,
      before: analysisBefore,
      type: gameType,
      ai: aiColor()
    });
  } catch {
    fallback();
  }
}

export function variantEvaluate(e, t, r) {
  let n = 0;
  if (t === 'checkers')
    for (let t = 0; t < 8; t++)
      for (let o = 0; o < 8; o++) {
        const a = e[t][o];
        if (!a)
          continue;
        const s = a[0] === 'w' ? 7 - t : t;
        const i = a[1] === 'D' ? 310 : 100 + s * 7 + (o > 0 && o < 7 ? 4 : 0);
        n += (a[0] === r ? 1 : -1) * i;
      }
  else {
    let t = 0;
    for (const r of e)
      for (const e of r)
        if (e)
          t++;
    for (let o = 0; o < 8; o++)
      for (let a = 0; a < 8; a++) {
        const s = e[o][a];
        if (!s)
          continue;
        const i = (a === 0 || a === 7) && (o === 0 || o === 7), l = a === 0 || a === 7 || o === 0 || o === 7;
        let u = i ? 140 : l ? 16 : t > 48 ? 12 : 2;
        if ((a === 1 || a === 6) && (o === 1 || o === 6) && !e[o === 1 ? 0 : 7][a === 1 ? 0 : 7])
          u = -45;
        n += (s[0] === r ? 1 : -1) * u;
      }
    n += (reversiMoves(e, r).length - reversiMoves(e, opposite(r)).length) * 8;
  }
  return n;
}

export function variantChoose(e, t, r, n, o = Math.random) {
  const a = levelConfig(n), s = Date.now() + a.budget, i = {};
  let l = 0, u = 0;
  function search(e, n, o, u, c, d) {
    if (++l > a.nodes || Date.now() > s)
      throw i;
    const f = variantWinner(e, t, n);
    if (f)
      return f === 'draw' ? 0 : f === r ? 100000 - d : -100000 + d;
    if (!o)
      return variantEvaluate(e.board, t, r);
    const m = variantMoves(e, t, n);
    let h = n === r ? -1 / 0 : 1 / 0;
    for (const a of m) {
      const s = variantApply(e, a, t, n), i = search(s, s.nextColor, o - 1, u, c, d + 1);
      if (n === r) {
        h = Math.max(h, i);
        u = Math.max(u, h);
      } else {
        h = Math.min(h, i);
        c = Math.min(c, h);
      }
      if (c <= u)
        break;
    }
    return h;
  }
  const c = variantMoves(e, t, r);
  if (!c.length)
    return {
      move: null,
      depth: 0,
      nodes: l
    };
  let d = c.map(n => {
    const o = variantApply(e, n, t, r), a = variantWinner(o, t, o.nextColor);
    return {
      m: n,
      s: o,
      score: a === r ? 99999 : a === opposite(r) ? -99999 : variantEvaluate(o.board, t, r)
    };
  });
  const f = d.find(e => e.score === 99999);
  if (f)
    return {
      move: f.m,
      depth: 1,
      nodes: l
    };
  for (let e = 1; e <= a.depth; e++) {
    const t = [];
    try {
      for (const r of d)
        t.push(search(r.s, r.s.nextColor, e - 1, -1 / 0, 1 / 0, 1));
    } catch (e) {
      if (e !== i)
        throw e;
      break;
    }
    d = d.map((e, r) => ({
      ...e,
      score: t[r]
    })).sort((e, t) => t.score - e.score);
    u = e;
  }
  const m = Math.max(...d.map(e => e.score)), h = o() < a.error, p = d.filter(e => e.score >= m - (h ? 160 : a.noise));
  const g = p.map(e => ({
    ...e,
    rank: e.score + (o() - 0.5) * a.noise
  })).sort((e, t) => t.rank - e.rank);
  const y = h ? g[Math.floor(o() * Math.min(4, g.length))] : g[0];
  return {
    move: y.m,
    depth: u,
    nodes: l
  };
}

export function variantQuality(e, t, r, n) {
  let o = -1 / 0, a = -1 / 0;
  for (const s of variantMoves(e, r, n)) {
    const i = variantApply(e, s, r, n);
    const l = variantWinner(i, r, i.nextColor);
    const u = l === n ? 100000 : l && l !== 'draw' ? -100000 : variantEvaluate(i.board, r, n);
    o = Math.max(o, u);
    if (s.sx === t.sx && s.sy === t.sy && s.tx === t.tx && s.ty === t.ty)
      a = u;
  }
  const s = o - a;
  return s <= 35 ? 1 : s <= 100 ? 0.7 : s <= 200 ? 0.35 : 0;
}

export function variantWorkerSource() {
  const e = {
    opposite: opposite,
    inside: inside,
    draughtsCaptures: draughtsCaptures,
    draughtsMoves: draughtsMoves,
    draughtsApply: draughtsApply,
    draughtsWinner: draughtsWinner,
    reversiFlips: reversiFlips,
    reversiMoves: reversiMoves,
    reversiApply: reversiApply,
    reversiCounts: reversiCounts,
    reversiWinner: reversiWinner,
    variantMoves: variantMoves,
    variantApply: variantApply,
    variantWinner: variantWinner,
    variantEvaluate: variantEvaluate,
    variantChoose: variantChoose,
    variantQuality: variantQuality,
    levelConfig: levelConfig
  };
  return serializeWorkerFunctions(e) + `\n onmessage=event=>{try{const {state,level,before,type,ai}=event.data;const quality=before?variantQuality(before.state,before.move,type,ai==='w'?'b':'w'):null;postMessage({result:variantChoose(state,type,ai,level),quality});}catch(error){postMessage({error:String(error)});}};`;
}

export function queueAITurn() {
  if (gameType === 'arimaa' && ar.setup)
    return;
  if (isSoloMode() && isAITurn() && !gameOver) {
    set_aiThinking(true);
    const e = session;
    updateHint();
    updatePoints();
    set_aiTimer(setTimeout(() => {
      if (e === session)
        makeAIMove();
    }, 300));
  }
}

export function strategyEval(e, t, r, n = null) {
  return {
    hnefatafl: hnefStrategyEval,
    quoridor: qStrategyEval,
    morris: morrisStrategyEval
  }[e](t, r, n);
}

export function strategyChildren(e, t, r, n) {
  return {
    hnefatafl: hnefStrategyChildren,
    quoridor: qStrategyChildren,
    morris: morrisStrategyChildren
  }[e](t, r, n);
}

export function strategyChoose(e, t, r, n) {
  const o = Date.now() + 180 + n * 14, a = {}, s = e === 'hnefatafl' ? 12 + Math.floor(n / 3) : 8 + Math.floor(n / 5), i = n < 10 ? 2 : n < 30 ? 3 : 4;
  let l = 0, u = 0;
  const ordered = (t, r) => strategyChildren(e, t, r, c).sort((e, t) => r === c ? t.score - e.score : e.score - t.score);
  const c = r;
  function search(t, r, n, i, u, d) {
    if (Date.now() > o || ++l > 30000)
      throw a;
    const f = strategyEval(e, t, c, r);
    if (Math.abs(f) >= 90000)
      return f > 0 ? f - d : f + d;
    if (!n)
      return f;
    const m = ordered(t, r);
    if (!m.length)
      return r === c ? -100000 + d : 100000 - d;
    let h = r === c ? -1 / 0 : 1 / 0;
    for (const e of m.slice(0, s)) {
      const t = search(e.s, opposite(r), n - 1, i, u, d + 1);
      if (r === c) {
        h = Math.max(h, t);
        i = Math.max(i, h);
      } else {
        h = Math.min(h, t);
        u = Math.min(u, h);
      }
      if (u <= i)
        break;
    }
    return h;
  }
  let d = ordered(t, r);
  if (!d.length)
    return {
      move: null,
      depth: 0,
      nodes: l
    };
  if (d[0].score >= 90000)
    return {
      move: d[0].m,
      depth: 1,
      nodes: l
    };
  d = d.slice(0, e === 'quoridor' ? Math.max(10, Math.floor(s * 0.85)) : Math.max(s * 2, 24));
  for (let e = 1; e <= i; e++) {
    const t = [];
    try {
      for (const n of d)
        t.push(search(n.s, opposite(r), e - 1, -1 / 0, 1 / 0, 1));
    } catch (e) {
      if (e !== a)
        throw e;
      break;
    }
    d = d.map((e, r) => ({
      ...e,
      score: t[r]
    })).sort((e, t) => t.score - e.score);
    u = e;
  }
  if (e === 'quoridor' && t.walls[r] === 0) {
    const e = qPawnRouteMap(t.board, r, t), n = d[0].score;
    const o = d.filter(e => e.m.kind === 'pawn' && (n <= -90000 || e.score === n));
    o.sort((t, r) => e[t.m.y * 9 + t.m.x] - e[r.m.y * 9 + r.m.x] || t.m.y - r.m.y || t.m.x - r.m.x);
    return {
      move: o[0].m,
      depth: u,
      nodes: l
    };
  }
  const f = n >= 30 ? 0 : (30 - n) * 0.6, m = d.filter(e => e.score >= d[0].score - f);
  return {
    move: m[Math.floor(Math.random() * m.length)].m,
    depth: u,
    nodes: l
  };
}

export function strategyWorkerSource() {
  const e = {
    opposite: opposite,
    inBoard: inBoard,
    hnefCorner: hnefCorner,
    hnefThrone: hnefThrone,
    hnefRestricted: hnefRestricted,
    hnefMovesFrom: hnefMovesFrom,
    hnefAllMoves: hnefAllMoves,
    hnefSupport: hnefSupport,
    hnefKingPos: hnefKingPos,
    hnefKingCaptured: hnefKingCaptured,
    hnefNext: hnefNext,
    hnefWinner: hnefWinner,
    hnefEval: hnefEval,
    hnefStrategyEval: hnefStrategyEval,
    qStrategyEval: qStrategyEval,
    morrisStrategyEval: morrisStrategyEval,
    hnefStrategyChildren: hnefStrategyChildren,
    qStrategyChildren: qStrategyChildren,
    morrisStrategyChildren: morrisStrategyChildren,
    qWallKey: qWallKey,
    qColors: qColors,
    qGoalReached: qGoalReached,
    qPawnPos: qPawnPos,
    qBlocked: qBlocked,
    qPawnMoves: qPawnMoves,
    qDistanceMap: qDistanceMap,
    qShortest: qShortest,
    qPawnRouteMap: qPawnRouteMap,
    qCanPlace: qCanPlace,
    qWallCompatible: qWallCompatible,
    qWinner: qWinner,
    morrisKey: morrisKey,
    morrisCount: morrisCount,
    morrisMillAt: morrisMillAt,
    morrisNeighbors: morrisNeighbors,
    morrisRemoveTargets: morrisRemoveTargets,
    strategyEval: strategyEval,
    strategyChildren: strategyChildren,
    strategyChoose: strategyChoose
  };
  return 'let strategyDistanceCache=new Map();const MORRIS_POINTS=' + JSON.stringify(MORRIS_POINTS) + ',MORRIS_MILLS=' + JSON.stringify(MORRIS_MILLS) + ',MORRIS_EDGES=' + JSON.stringify(MORRIS_EDGES) + ';\n' + serializeWorkerFunctions(e) + '\nonmessage=e=>{try{const d=e.data;postMessage({result:strategyChoose(d.type,d.state,d.color,d.level)});}catch(err){postMessage({error:String(err)});}}';
}

export function makeStrategyAI() {
  if (!isSoloMode() || !isAITurn() || gameOver)
    return;
  const e = session, t = gameType, r = turn, n = t === 'quoridor' ? {
      board: board,
      walls: { ...q.walls },
      h: q.h,
      v: q.v
    } : t === 'morris' ? {
      board: board,
      toPlace: { ...morris.toPlace }
    } : { board: board };
  const accept = n => {
    if (e !== session)
      return;
    terminateAIWorker();
    set_aiThinking(false);
    set_lastSearch({
      depth: n.depth,
      nodes: n.nodes
    });
    const o = n.move;
    if (!o) {
      drawBoard();
      return;
    }
    if (t === 'hnefatafl') {
      const e = hnefNext(board, o, r);
      set_board(e.board);
      set_taflWinner(e.winner);
      set_lastMove(o);
      set_lastMoveMessage(e.captures ? e.captures + '枚を挟み取り\u3002' : '');
    } else if (t === 'quoridor') {
      if (o.kind === 'pawn') {
        const e = qPawnPos(board, r);
        board[e.y][e.x] = '';
        board[o.y][o.x] = r + 'Q';
        set_lastMove({
          sx: e.x,
          sy: e.y,
          tx: o.x,
          ty: o.y
        });
        set_lastMoveMessage('');
        q.winner = qWinner(board);
      } else {
        if (!qCanPlace(o.ori, o.x, o.y, q, board, r)) {
          drawBoard();
          return;
        }
        q[o.ori].push({
          x: o.x,
          y: o.y
        });
        q.walls[r]--;
        set_lastMove(null);
        set_lastMoveMessage((o.ori === 'h' ? '横' : '縦') + '壁を設置\u3002');
      }
      q.mode = 'pawn';
    } else {
      const e = morrisDoBase(o, r);
      if (e && o.remove && morrisRemoveTargets(board, r).some(e => e.x === o.remove.x && e.y === o.remove.y))
        board[o.remove.y][o.remove.x] = '';
      morris.remove = null;
      morris.winner = morrisWinner(board, opposite(r));
      set_lastMoveMessage(e ? 'ミルで1石を除去\u3002' : '');
    }
    finishCustomTurn();
  };
  const fallback = () => {
    if (e !== session)
      return;
    terminateAIWorker();
    set_aiTimer(setTimeout(() => {
      if (e === session)
        accept(strategyChoose(t, n, r, 1));
    }, 0));
  };
  try {
    if (!workerURL)
      set_workerURL(URL.createObjectURL(new Blob([strategyWorkerSource()], { type: 'text/javascript' })));
    set_aiWorker(new Worker(workerURL));
    aiWorker.onmessage = e => e.data.error ? fallback() : accept(e.data.result);
    aiWorker.onerror = e => {
      e.preventDefault();
      fallback();
    };
    aiWorker.postMessage({
      type: t,
      state: n,
      color: r,
      level: profile.level
    });
  } catch {
    fallback();
  }
}

export function variantMoves(e, t, r) {
  return t === 'checkers' ? draughtsMoves(e.board, r, e.chain) : reversiMoves(e.board, r);
}

export function variantApply(e, t, r, n) {
  return r === 'checkers' ? draughtsApply(e, t, n) : reversiApply(e, t, n);
}

export function variantWinner(e, t, r) {
  return t === 'checkers' ? draughtsWinner(e.board, r) : reversiWinner(e.board);
}

export function variantRemember(e) {
  if (isSoloMode() && turn === playerColor() && !forcedCapture) {
    pushUndoSnapshot();
    set_analysisBefore({
      state: liveState(),
      move: { ...e }
    });
  }
}

export function playVariantMove(e) {
  variantRemember(e);
  const t = turn, r = gameType === 'checkers' ? board[e.sy][e.sx] : null, n = variantApply(liveState(), e, gameType, t);
  set_board(n.board);
  set_forcedCapture(n.chain);
  set_lastMove({ ...e });
  set_selected(null);
  set_pendingSkill(null);
  setHint('');
  if (gameType === 'checkers') {
    set_halfmove(n.capture || n.man ? 0 : halfmove + 1);
    set_lastMoveMessage(n.promotion ? 'キングに昇格\uFF01' : n.capture ? '駒を取りました\u3002' : '');
    if (forcedCapture) {
      set_selected({ ...forcedCapture });
      set_lastMoveMessage('連続取り\uFF1A同じ駒で続けて取ってください\u3002');
      drawBoard();
      animateMove(e, r);
      queueAITurn();
    } else {
      endTurn();
      animateMove(e, r);
    }
  } else {
    set_turn(n.nextColor);
    set_lastMoveMessage(n.passed ? (opposite(turn) === 'w' ? '白' : '黒') + 'は置ける場所がないためパス\u3002' : n.flips.length + '枚を返しました\u3002');
    recordPosition();
    drawBoard();
    animateReversi(n.flips, e);
    queueAITurn();
  }
}

export function variantRules() {
  return gameType === 'checkers' ? 'チェッカー\uFF08白先手\uFF09\uFF1A通常駒は斜め前へ1マス\u3002取れるときは必ず飛び越えて取り\u3001続けて取れる間は同じ駒を動かします\u3002最奥でキングになり\u3001その手は終了\u3002キングは前後へ1マス\u30FB飛び取りが可能\u3002駒がなくなるか動けなければ負け\u3002同一局面3回\u3001または双方40手ずつ捕獲も通常駒の移動もない場合は引き分け\u3002' : 'リバーシ\uFF08黒先手\uFF09\uFF1A相手の石を縦\u30FB横\u30FB斜めに挟める空きマスへ置きます\u3002挟んだ石は全て自分の色に\u3002置けない側は自動パス\u3002双方が置けなくなった時点で石が多い側の勝ちです\u3002ソロでは選んだ手番の色を操作します\u3002';
}
