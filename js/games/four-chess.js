import { board, boardEl, currentRisks, currentThreats, fourKingLosses, fourMode, fourScores, fourTurnCounts, gameOver, gameType, hintOverride, lastMove, lastMoveMessage, pieces, selected, setHint, set_board, set_currentRisks, set_currentThreats, set_fourKingLosses, set_fourMode, set_gameOver, set_hintOverride, set_lastMove, set_lastMoveMessage, set_selected, set_turn, turn } from '../core/state.js';
import { clickCell, drawBoard, recordPosition, setBoardGrid, startGame, terminalStatus, updateHint, updatePoints, updateSoloUI } from '../core/ui.js';
import { finishLearning } from '../core/ai.js';

export const fourChessValid = (e, t) => e >= 0 && e < 14 && t >= 0 && t < 14 && !((e < 3 || e > 10) && (t < 3 || t > 10));

export const fourChessInitialBoard = () => {
  const e = Array.from({ length: 14 }, () => Array(14).fill(''));
  const t = [
      'bR',
      'bN',
      'bB',
      'bQ',
      'bK',
      'bB',
      'bN',
      'bR'
    ], r = [
      'wR',
      'wN',
      'wB',
      'wQ',
      'wK',
      'wB',
      'wN',
      'wR'
    ];
  const n = [
      'uR',
      'uN',
      'uB',
      'uQ',
      'uK',
      'uB',
      'uN',
      'uR'
    ], o = [
      'rR',
      'rN',
      'rB',
      'rQ',
      'rK',
      'rB',
      'rN',
      'rR'
    ];
  for (let a = 0; a < 8; a++) {
    e[0][a + 3] = t[a];
    e[1][a + 3] = 'bP';
    e[13][a + 3] = r[a];
    e[12][a + 3] = 'wP';
    e[a + 3][0] = n[a];
    e[a + 3][1] = 'uP';
    e[a + 3][13] = o[a];
    e[a + 3][12] = 'rP';
  }
  return e;
};

export const FOUR_CHESS_GUIDE = [
  [
    '卓の選び方と手番',
    'FFAは4人それぞれが敵の個人戦\u30022v2は白\uFF0B黒\u3001赤\uFF0B青のチーム戦です\u3002手番は白\u2192赤\u2192黒\u2192青\u3002自分の駒を選び\u3001\u25CFへ進めるか\u3001輪の付いた敵駒を取ります\u3002味方の活動中の駒は取れません\u3002'
  ],
  [
    '得点と勝利',
    'ポーン1点\u3001ナイト3点\u3001ビショップ3点\u3001ルーク5点\u3001クイーン9点\u3001キング20点\u3002自分にキングがあり\u3001相手が通常状態のときに得点できます\u3002FFAは終局時に累積スコアが最も高い人\u30012v2はチーム合計が高い側の勝ちです\u3002完全脱落した人の得点も最終集計に含みます\u3002同点なら同率の勝者\u30FB引き分けになります\u3002'
  ],
  [
    '初めの失冠\uFF1A警告状態',
    '初めてキングを取られると\u3001その陣営の残りの全駒に左上の\u26A0が付きます\u3002手番は続き\u3001移動も捕獲もできますが\u3001その陣営は得点できません\u3002また\u3001相手が警告駒を取っても0点です\u3002すでに得た点は失いません\u3002初めの失冠だけでは完全脱落になりません\u3002'
  ],
  [
    '一度だけの復帰',
    '自陣の最奥を1段目と数え\u3001進行方向の11段目へポーンを進めると昇格します\u3002通常はクイーンですが\u3001警告状態ではキングに昇格し\u3001陣営全体の\u26A0を解除します\u3002このキングへの昇格は各陣営一度だけ\u3002復帰する手で敵駒を取っても0点で\u3001次の自分の手番から得点を再開します\u3002キングが残っているときの追加の昇格はクイーンです\u3002'
  ],
  [
    '二度目の失冠\uFF1A完全脱落',
    '復帰したキングを再び取られると完全脱落です\u3002残りの駒は灰色となり\u3001動かない障害物として最終盤面に残ります\u3002灰色駒に得点は付きません\u3002この版では誰か1人の完全脱落で直ちに対局が終わるため\u3001その後に駒を動かすことはありません\u3002残りの駒を全て失った場合も完全脱落として扱います\u3002'
  ],
  [
    '四隅の残機帳',
    '四隅のキングは盤上で動く駒ではなく\u3001残機の表示です\u3002最初は現在の王と復帰枠で2\u3002半透明の王は予備\u3001打消線の王は失った残機を示します\u3002初めの失冠後は残機1\u30FB\u26A0復帰待ち\u3001復帰後も残機1\u30FB復帰済み\u3002二度目の失冠で残機0\u30FB脱落になります\u3002'
  ],
  [
    '終局する条件',
    'FFA\u30FB2v2とも\u3001\u24601人が完全脱落した時点\u3001\u24614人全員が一度以上キングを失った時点\u3001\u2462全陣営が動けなくなった時点\u3001のいずれかで終了します\u3002\u2461は\u300C現在全員がキング不在\u300Dではなく失冠の履歴で判定するため\u3001途中で復帰した人も数えます\u3002終局を起こした捕獲の得点を反映してから\u3001累積スコアで勝敗を決めます\u3002得点が一定値に達することによる終了は\u3001この版にはありません\u3002'
  ],
  [
    '序盤の保護と危険な一手',
    '各陣営は自分の手番を10回終えるまで敵キングを捕獲できず\u3001自分の11手目から解禁されます\u3002復帰しても\u3001この手数はリセットされません\u3002縞と右下の\u26A0は\u3001自分のキングが敵から取れる状態になる移動先です\u3002通常チェスと違い\u3001その手は禁止されず\u3001確認して実行できます\u3002危険な場所でのキング復帰にも確認が出ます\u3002キャスリングとアンパッサンはありません\u3002'
  ],
  [
    '卓主の手引き',
    'キングの前の駒を動かすと\u3001遠くの射線が通ることがあります\u3002序盤10手は守りを整える猶予です\u3002失冠後はポーンの進路を確保しましょう\u3002誰かを完全脱落させる手は対局を直ちに終わらせるので\u3001指す前に全員の得点を確かめるのが肝心です\u3002'
  ]
];

export const fourTurnOrder = [
  'w',
  'r',
  'b',
  'u'
];

export const fourColorName = e => ({
  w: '白',
  b: '黒',
  r: '赤',
  u: '青'
}[e] || e);

export const fourPieceClass = e => ({
  w: 'whitePiece',
  b: 'blackPiece',
  r: 'redPiece',
  u: 'bluePiece'
}[e] || 'whitePiece');

export const FOUR_KING_PROTECTION_TURNS = 10;

export const fourCaptureValue = {
  P: 1,
  N: 3,
  B: 3,
  R: 5,
  Q: 9,
  K: 20
};

export const fourTeam = e => e === 'w' || e === 'b' ? 'wb' : 'ru';

export const fourSameSide = (e, t) => fourMode === 'teams' && fourTeam(e) === fourTeam(t);

export const fourIsEliminated = (e, t = fourKingLosses) => t[e] >= 2;

export const fourIsWarning = (e, t = board, r = fourKingLosses) => r[e] === 1 && !fourHasKing(e, t);

export const fourKingCaptureUnlocked = e => fourTurnCounts[e] >= FOUR_KING_PROTECTION_TURNS;

export function startFourChess(e) {
  set_fourMode(e === 'teams' ? 'teams' : 'ffa');
  startGame('normal');
}

export function fourHasKing(e, t = board) {
  return t.some(t => t.some(t => t === e + 'K'));
}

export function fourIsActive(e, t = board, r = fourKingLosses) {
  return !fourIsEliminated(e, r) && t.some(t => t.some(t => t?.[0] === e));
}

export function fourPathClear(e, t, r, n, o) {
  const a = Math.sign(n - t), s = Math.sign(o - r);
  let i = t + a, l = r + s;
  while (i !== n || l !== o) {
    if (e[l][i])
      return false;
    i += a;
    l += s;
  }
  return true;
}

export function fourCanMoveRaw(e, t, r, n, o = board, a = fourKingLosses) {
  if (!fourChessValid(e, t) || !fourChessValid(r, n) || e === r && t === n)
    return false;
  const s = o[t][e], i = o[n][r];
  if (!s || fourIsEliminated(s[0], a))
    return false;
  if (i && !fourIsEliminated(i[0], a) && (i[0] === s[0] || fourSameSide(i[0], s[0])))
    return false;
  const l = s[0], u = s[1], c = r - e, d = n - t, f = Math.abs(c), m = Math.abs(d);
  if (u === 'P') {
    if (l === 'w') {
      if (c === 0 && !i && (d === -1 || d === -2 && t === 12 && !o[11][e]))
        return true;
      return f === 1 && d === -1 && !!i;
    }
    if (l === 'b') {
      if (c === 0 && !i && (d === 1 || d === 2 && t === 1 && !o[2][e]))
        return true;
      return f === 1 && d === 1 && !!i;
    }
    if (l === 'u') {
      if (d === 0 && !i && (c === 1 || c === 2 && e === 1 && !o[t][2]))
        return true;
      return c === 1 && m === 1 && !!i;
    }
    if (l === 'r') {
      if (d === 0 && !i && (c === -1 || c === -2 && e === 12 && !o[t][11]))
        return true;
      return c === -1 && m === 1 && !!i;
    }
    return false;
  }
  if (u === 'N')
    return f * m === 2;
  if (u === 'K')
    return Math.max(f, m) === 1;
  if (u === 'B')
    return f === m && fourPathClear(o, e, t, r, n);
  if (u === 'R')
    return (c === 0 || d === 0) && fourPathClear(o, e, t, r, n);
  if (u === 'Q')
    return (c === 0 || d === 0 || f === m) && fourPathClear(o, e, t, r, n);
  return false;
}

export function fourMoveAllowed(e, t, r, n, o = board, a = fourKingLosses) {
  if (!fourCanMoveRaw(e, t, r, n, o, a))
    return false;
  const s = o[t][e], i = o[n][r];
  return !(i?.[1] === 'K' && !fourIsEliminated(i[0], a) && !fourKingCaptureUnlocked(s[0]));
}

export function fourLegalMovesFrom(e, t, r = board, n = fourKingLosses) {
  const o = [];
  for (let a = 0; a < 14; a++)
    for (let s = 0; s < 14; s++)
      if (fourMoveAllowed(e, t, s, a, r, n))
        o.push({
          x: s,
          y: a
        });
  return o;
}

export function fourLockedKingMovesFrom(e, t, r = board) {
  const n = r[t]?.[e];
  if (!n || fourKingCaptureUnlocked(n[0]))
    return [];
  const o = [];
  for (let n = 0; n < 14; n++)
    for (let a = 0; a < 14; a++)
      if (r[n][a]?.[1] === 'K' && !fourIsEliminated(r[n][a][0]) && fourCanMoveRaw(e, t, a, n, r))
        o.push({
          x: a,
          y: n
        });
  return o;
}

export function fourAllMoves(e, t = board, r = fourKingLosses) {
  const n = [];
  if (!fourIsActive(e, t, r))
    return n;
  for (let o = 0; o < 14; o++)
    for (let a = 0; a < 14; a++)
      if (t[o][a]?.[0] === e)
        for (const e of fourLegalMovesFrom(a, o, t, r))
          n.push({
            sx: a,
            sy: o,
            tx: e.x,
            ty: e.y
          });
  return n;
}

export function fourNextTurn(e, t = board) {
  const r = fourTurnOrder.indexOf(e);
  for (let e = 1; e <= 4; e++) {
    const n = fourTurnOrder[(r + e) % 4];
    if (fourIsActive(n, t) && fourAllMoves(n, t).length)
      return n;
  }
  return e;
}

export function fourPromotion(e, t, r) {
  return e === 'wP' && r === 3 || e === 'bP' && r === 10 || e === 'uP' && t === 10 || e === 'rP' && t === 3;
}

export function fourSimulateMove(e, t = board, r = fourKingLosses) {
  const n = t.map(e => e.slice()), o = n[e.sy][e.sx], a = n[e.ty][e.tx], s = { ...r };
  const i = fourPromotion(o, e.tx, e.ty) && fourIsWarning(o[0], t, r);
  const l = a && fourHasKing(o[0], t) && !fourIsEliminated(o[0], r) && !fourIsEliminated(a[0], r) && !fourIsWarning(a[0], t, r) ? fourCaptureValue[a[1]] || 0 : 0;
  n[e.sy][e.sx] = '';
  n[e.ty][e.tx] = fourPromotion(o, e.tx, e.ty) ? o[0] + (i ? 'K' : 'Q') : o;
  if (a?.[1] === 'K' && !fourIsEliminated(a[0], r))
    s[a[0]] = Math.min(2, s[a[0]] + 1);
  return {
    board: n,
    piece: o,
    target: a,
    losses: s,
    crowned: i,
    gain: l
  };
}

export function fourKingPosition(e, t = board) {
  for (let r = 0; r < 14; r++)
    for (let n = 0; n < 14; n++)
      if (t[r][n] === e + 'K')
        return {
          x: n,
          y: r
        };
  return null;
}

export function fourKingThreatened(e, t = board, r = fourKingLosses) {
  const n = fourKingPosition(e, t);
  if (!n || fourIsEliminated(e, r))
    return false;
  for (let o = 0; o < 14; o++)
    for (let a = 0; a < 14; a++) {
      const s = t[o][a];
      if (!s || s[0] === e || fourSameSide(s[0], e) || fourIsEliminated(s[0], r))
        continue;
      if (fourMoveAllowed(a, o, n.x, n.y, t, r))
        return true;
    }
  return false;
}

export function fourMoveExposesKing(e, t = turn) {
  const r = fourSimulateMove(e);
  return fourKingThreatened(t, r.board, r.losses);
}

export function fourArmyStatus(e) {
  return !fourIsActive(e) ? '脱落' : fourIsWarning(e) ? '\u26A0 失冠\u30FB得点停止' : fourKingLosses[e] === 1 ? '再冠\u30FB復帰済み' : '在位';
}

export function fourScoreText() {
  if (fourMode === 'teams')
    return '白\uFF0B黒 ' + (fourScores.w + fourScores.b) + '点 \uFF0F 赤\uFF0B青 ' + (fourScores.r + fourScores.u) + '点';
  return '白 ' + fourScores.w + ' / 赤 ' + fourScores.r + ' / 黒 ' + fourScores.b + ' / 青 ' + fourScores.u + '点';
}

export function fourTerminalResult() {
  const e = fourTurnOrder.filter(e => fourIsActive(e));
  const t = fourTurnOrder.some(e => !fourIsActive(e));
  const r = fourTurnOrder.every(e => fourKingLosses[e] >= 1);
  const n = t || r;
  const o = n ? false : e.some(e => fourAllMoves(e).length);
  const a = t ? '1陣営が完全脱落' : r ? '全陣営が一度以上失冠' : '全陣営が移動不能';
  if (fourMode === 'teams') {
    if (!n && o)
      return '';
    const e = fourScores.w + fourScores.b, t = fourScores.r + fourScores.u;
    return '2v2終了\uFF08' + a + '\uFF09\uFF01 ' + (e === t ? '引き分け ' + e + '対' + t : e > t ? '白\uFF0B黒チームの勝ち ' + e + '対' + t : '赤\uFF0B青チームの勝ち ' + t + '対' + e);
  }
  if (!n && o)
    return '';
  const s = Math.max(...fourTurnOrder.map(e => fourScores[e])), i = fourTurnOrder.filter(e => fourScores[e] === s);
  return 'FFA終了\uFF08' + a + '\uFF09\uFF01 ' + (i.length === 1 ? fourColorName(i[0]) + 'の勝ち ' + s + '点' : '同点 ' + i.map(fourColorName).join('\u30FB') + ' ' + s + '点');
}

export function fourPerformMove(e, t = false) {
  if (gameOver)
    return;
  const r = board[e.sy]?.[e.sx], n = board[e.ty]?.[e.tx];
  if (!r || r[0] !== turn || !fourMoveAllowed(e.sx, e.sy, e.tx, e.ty))
    return;
  if (!t && fourMoveExposesKing(e, r[0])) {
    const e = window.confirm('\u26A0 この手を指すと\u3001' + fourColorName(r[0]) + 'のキングが敵から取れる状態になります\u3002\nこの手を指しますか\uFF1F');
    if (!e) {
      setHint('移動を取り消しました\u3002キングを守る手を選んでください\u3002');
      drawBoard();
      return;
    }
  }
  const o = r[0], a = fourSimulateMove(e);
  set_board(a.board);
  set_fourKingLosses(a.losses);
  fourScores[o] += a.gain;
  fourTurnCounts[o]++;
  set_selected(null);
  set_hintOverride('');
  set_lastMove({ ...e });
  const s = [];
  if (n) {
    s.push(fourColorName(n[0]) + 'の' + {
      P: 'ポーン',
      N: 'ナイト',
      B: 'ビショップ',
      R: 'ルーク',
      Q: 'クイーン',
      K: 'キング'
    }[n[1]] + 'を捕獲 ' + (a.gain ? '+' + a.gain + '点' : '\uFF08得点なし\uFF09'));
    if (n[1] === 'K')
      s.push(fourIsEliminated(n[0]) ? fourColorName(n[0]) + 'は二度目の失冠\u30FB脱落' : fourColorName(n[0]) + 'は失冠\u30FB昇格で復帰可能');
  }
  if (a.crowned)
    s.push(fourColorName(o) + 'のポーンがキングへ昇格\uFF01警告解除\u30FB次の手から得点再開');
  else if (fourPromotion(r, e.tx, e.ty))
    s.push('クイーンへ昇格');
  if (fourTurnCounts[o] === FOUR_KING_PROTECTION_TURNS)
    s.push('次の' + fourColorName(o) + '手番からキング捕獲解禁');
  set_lastMoveMessage(s.join(' \uFF0F '));
  set_turn(fourNextTurn(o, board));
  recordPosition();
  drawBoard();
}

export function fourClick(e, t) {
  if (!fourChessValid(e, t)) {
    set_selected(null);
    drawBoard();
    return;
  }
  const r = board[t][e];
  if (selected && selected.x === e && selected.y === t) {
    set_selected(null);
    drawBoard();
    return;
  }
  if (selected && fourCanMoveRaw(selected.x, selected.y, e, t) && !fourMoveAllowed(selected.x, selected.y, e, t)) {
    const e = board[selected.y][selected.x]?.[0];
    setHint('\uD83D\uDD12 ' + fourColorName(e) + 'は自分の手番を10回終えるまでキングを捕獲できません\u3002現在 ' + fourTurnCounts[e] + '/10\u3002');
    drawBoard();
    return;
  }
  if (selected && fourMoveAllowed(selected.x, selected.y, e, t)) {
    fourPerformMove({
      sx: selected.x,
      sy: selected.y,
      tx: e,
      ty: t
    });
    return;
  }
  if (r && r[0] === turn && !fourIsEliminated(r[0])) {
    set_selected({
      x: e,
      y: t
    });
    setHint('');
    drawBoard();
  } else {
    set_selected(null);
    setHint('今の手番の駒を選び\u3001光るマスへ動かしてください\u3002');
    drawBoard();
  }
}

export function fourEnding() {
  const e = fourTerminalResult();
  return e ? e : '';
}

export function drawFourLives() {
  const e = {
    b: 'northWest',
    r: 'northEast',
    w: 'southEast',
    u: 'southWest'
  };
  for (const t of fourTurnOrder) {
    const r = fourKingLosses[t], n = fourIsActive(t), o = n ? Math.max(0, 2 - r) : 0, a = n && fourIsWarning(t);
    const s = document.createElement('section');
    s.className = 'fourLifePanel ' + e[t];
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', fourColorName(t) + ' 残機' + o + ' ' + fourArmyStatus(t) + (a ? '\u30FBポーンをキングに昇格して復帰' : ''));
    const i = document.createElement('b');
    i.textContent = fourColorName(t) + ' 残機 ' + o;
    s.appendChild(i);
    const l = document.createElement('div');
    l.className = 'fourLifeKings';
    for (let e = 0; e < 2; e++) {
      const o = document.createElement('span'), s = !n || e < r, i = !s && (r === 0 ? e === 1 : a);
      o.className = 'fourLifeKing ' + (s ? 'spentLife' : fourPieceClass(t)) + (i ? ' reserveLife' : '');
      o.textContent = pieces[t + 'K'];
      o.setAttribute('aria-hidden', 'true');
      l.appendChild(o);
    }
    s.appendChild(l);
    const u = document.createElement('small');
    u.textContent = !n ? '脱落' : a ? '\u26A0 復帰待ち' : r === 1 ? '復帰済み' : '王 \uFF0B 復帰枠';
    s.appendChild(u);
    boardEl.appendChild(s);
  }
}

export function drawFourChess() {
  setBoardGrid(14, '');
  document.getElementById('gameUI').dataset.game = gameType;
  document.getElementById('gameUI').classList.remove('solo', 'soloBlack', 'turnFlipped');
  document.getElementById('gameUI').dataset.facing = 'white';
  const e = terminalStatus();
  set_gameOver(!!e);
  finishLearning(e);
  updateSoloUI([]);
  set_currentRisks([]);
  set_currentThreats([]);
  const t = !e && fourKingThreatened(turn);
  const r = (fourKingCaptureUnlocked(turn) ? '王捕獲 解禁' : '王捕獲保護 ' + fourTurnCounts[turn] + '/10') + (fourIsWarning(turn) ? ' \xB7 \u26A0 失冠\u30FB得点停止' : '');
  document.getElementById('message').textContent = e || fourColorName(turn) + 'の手番 \xB7 ' + r + (t ? ' \u2014 キング危険\uFF01' : '') + (lastMoveMessage ? ' / ' + lastMoveMessage : '');
  document.getElementById('normalTools').textContent = (fourMode === 'teams' ? '2v2 \xB7 ' : 'FFA \xB7 ') + fourScoreText() + '\n' + fourTurnOrder.map(e => fourColorName(e) + '\uFF1A' + fourArmyStatus(e)).join(' \uFF0F ');
  boardEl.innerHTML = '';
  const n = selected ? fourLegalMovesFrom(selected.x, selected.y) : [];
  const o = selected ? fourLockedKingMovesFrom(selected.x, selected.y) : [];
  const a = selected ? n.filter(e => fourMoveExposesKing({
    sx: selected.x,
    sy: selected.y,
    tx: e.x,
    ty: e.y
  }, turn)) : [];
  for (let e = 0; e < 14; e++)
    for (let t = 0; t < 14; t++) {
      const r = fourChessValid(t, e), s = document.createElement('div');
      s.className = 'cell ' + (r ? (t + e) % 2 ? 'black' : 'white' : 'voidCell');
      if (r) {
        const r = board[e][t];
        if (r) {
          const e = fourIsEliminated(r[0]), t = fourIsWarning(r[0]);
          const n = document.createElement('span');
          n.className = 'piece ' + (e ? 'greyPiece' : fourPieceClass(r[0]));
          n.textContent = pieces[r];
          s.appendChild(n);
          if (t) {
            s.classList.add('fourWarningPiece');
            const e = document.createElement('span');
            e.className = 'fourWarningBadge';
            e.textContent = '\u26A0';
            e.setAttribute('aria-hidden', 'true');
            s.appendChild(e);
            s.title = fourColorName(r[0]) + 'は失冠中\u3002得点停止\u30FBこの駒を取っても0点\u3002ポーン昇格で一度だけ復帰できます\u3002';
          }
          if (e) {
            s.classList.add('fourGreyPiece');
            s.title = fourColorName(r[0]) + 'の脱落駒\u3002動かない障害物で\u3001どの陣営も0点で取れます\u3002';
          }
        }
        if (selected && selected.x === t && selected.y === e)
          s.classList.add('selected');
        if (n.some(r => r.x === t && r.y === e)) {
          s.classList.add(r ? 'capture' : 'highlight');
          const e = document.createElement('span');
          e.className = r ? 'moveRing' : 'moveDot';
          s.appendChild(e);
        }
        if (o.some(r => r.x === t && r.y === e)) {
          s.classList.add('kingLockedTarget');
          const e = document.createElement('span');
          e.className = 'kingLockBadge';
          e.textContent = '\uD83D\uDD12';
          e.setAttribute('aria-hidden', 'true');
          s.appendChild(e);
          s.title = '自分の10手目まではキングを捕獲できません\u3002';
        }
        if (a.some(r => r.x === t && r.y === e)) {
          s.classList.add('dangerDestination');
          const e = document.createElement('span');
          e.className = 'dangerBadge';
          e.textContent = '\u26A0';
          e.setAttribute('aria-hidden', 'true');
          s.appendChild(e);
          s.title = 'この手を指すと自分のキングが敵から取れる状態になります\u3002';
        }
        if (lastMove && (lastMove.sx === t && lastMove.sy === e || lastMove.tx === t && lastMove.ty === e))
          s.classList.add('lastMove');
        s.setAttribute('aria-label', String.fromCharCode(97 + t) + (14 - e) + (r ? ' ' + fourColorName(r[0]) + ' ' + r[1] + (fourIsEliminated(r[0]) ? ' 灰色\u30FB脱落\u30FB捕獲0点' : fourIsWarning(r[0]) ? ' 警告\u30FB失冠\u30FB捕獲0点' : '') : ' 空き') + (o.some(r => r.x === t && r.y === e) ? ' キング捕獲保護中' : '') + (a.some(r => r.x === t && r.y === e) ? ' キング危険' : ''));
        s.dataset.x = t;
        s.dataset.y = e;
        s.onclick = () => clickCell(t, e);
      } else
        s.setAttribute('aria-hidden', 'true');
      boardEl.appendChild(s);
    }
  drawFourLives();
  updateHint();
  updatePoints();
}
