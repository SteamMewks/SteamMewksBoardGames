import { activeProfileId, aiColor, aiExecuting, aiThinking, analysisBefore, animating, ar, arEnemy, arMode, board, boardDimension, boardEl, currentRisks, currentThreats, enPassant, firstColor, forcedCapture, fourKingLosses, fourScores, fourTurnCounts, gameIntroductions, gameMode, gameOver, gameType, halfmove, helpTopic, hintOverride, humanInputBlocked, initialBoard, initialMoved, inside, isAITurn, isSkillMode, isSoloMode, isVariant, keyboardPosition, lastMove, lastMoveMessage, lastSearch, liveState, localTurnFlipped, morris, moveAnimations, moved, opposite, pendingSkill, pendingUIAction, pieceHints, pieces, playerColor, points, profile, q, qPlayerCount, rPlayerCount, recentAI, repetitions, roundRewarded, savedMatch, selected, setHint, set_activeProfileId, set_aiExecuting, set_analysisBefore, set_animating, set_arEnemy, set_arMode, set_board, set_currentRisks, set_currentThreats, set_enPassant, set_forcedCapture, set_fourKingLosses, set_fourScores, set_fourTurnCounts, set_gameMode, set_gameOver, set_gameType, set_halfmove, set_helpTopic, set_hintOverride, set_keyboardPosition, set_lastMove, set_lastMoveMessage, set_lastSearch, set_moveAnimations, set_moved, set_pendingSkill, set_pendingUIAction, set_points, set_profile, set_recentAI, set_repetitions, set_roundRewarded, set_selected, set_shuffleSelection, set_shuffleVisualCleanup, set_soloOrder, set_taflWinner, set_turn, set_undoHistory, set_workerURL, shuffleSelection, shuffleVisualCleanup, sideName, soloOrder, taflWinner, turn, undoHistory, workerURL } from './state.js';
import { FOUR_CHESS_GUIDE, FOUR_KING_PROTECTION_TURNS, fourIsWarning, fourTurnOrder, startFourChess } from '../games/four-chess.js';
import { finishLearning, levelConfig, loadProfile, queueAITurn, saveProfile, stopAI, variantRules, variantWinner } from './ai.js';
import { qColors, qNextTurn, qReset, qRules, qSelectWall, qWallError, qWallKey, setQuoridorPlayers } from '../games/quoridor.js';
import { morrisReset } from '../games/morris.js';
import { arDecorate, arHelp, arHint, arKey, arReset } from '../games/arimaa.js';
import { clearSavedMatch, refreshResumePanel, restoreSnapshot, saveMatch } from './persistence.js';
import { frRules, reversiCounts, reversiMoves, setReversiPlayers } from '../games/reversi.js';
import { applyPendingPWAUpdate } from './pwa.js';
import { getLegalMoves, isKingInCheck, isLegalMove, isSquareAttacked, nextState, playMove } from '../games/chess.js';
import { getGameModule } from './registry.js';
import { skillHints, skillTargets, skills, toggleShuffleTarget, useSkill, validShuffleSelection } from '../games/chess-variant.js';
import { draughtsApply, draughtsMoves } from '../games/checkers.js';

export function askUIAction(e, t, r, n) {
  set_pendingUIAction(n);
  document.getElementById('actionTitle').textContent = e;
  document.getElementById('actionText').textContent = t;
  document.getElementById('actionConfirm').textContent = r;
  document.getElementById('actionDialog').showModal();
}

export function cancelUIAction() {
  set_pendingUIAction(null);
  document.getElementById('actionDialog').close();
}

export function confirmUIAction() {
  const e = pendingUIAction;
  set_pendingUIAction(null);
  document.getElementById('actionDialog').close();
  if (e)
    e();
}

export function requestRestart() {
  if (!gameMode)
    return;
  if (gameOver) {
    restartGame();
    return;
  }
  askUIAction('盤を整え直しますか\uFF1F', '今の盤面を片付け\u3001同じ条件で初めから対局します\u3002途中の対局は勝敗に数えません\u3002', '指し直す', restartGame);
}

export function requestMenu() {
  if (gameMode)
    showGameLibrary();
}

export function filterTables(e) {
  if (![
      'all',
      '1',
      '2',
      'group'
    ].includes(e))
    return;
  for (const t of document.querySelectorAll('#gameCards .libraryCard')) {
    const r = t.dataset.players.split(' ');
    t.hidden = !(e === 'all' || (e === 'group' ? r.includes('3') || r.includes('4') : r.includes(e)));
  }
  for (const t of document.querySelectorAll('[data-filter]'))
    t.setAttribute('aria-pressed', String(t.dataset.filter === e));
}

export function openGameGuide() {
  if (!gameMode)
    return;
  const e = document.getElementById('guideBody');
  e.replaceChildren();
  document.getElementById('guideTitle').textContent = gameIntroductions[activeProfileId]?.name + ' \xB7 遊戯指南';
  const t = gameType === 'fourChess' ? FOUR_CHESS_GUIDE.map(e => e.slice()) : [
    [
      '卓のルール',
      helpDescription('rules')
    ],
    [
      '卓主の手引き',
      gameIntroductions[activeProfileId].tip
    ]
  ];
  t.push([
    '盤上の印',
    helpDescription('colors')
  ]);
  if (isSkillMode())
    t.push([
      '仕掛けの扱い',
      helpDescription('skills')
    ]);
  if (isSoloMode())
    t.push([
      '機巧士\uFF08AI\uFF09',
      helpDescription('ai')
    ], [
      '対局と記録の扱い',
      'AIレベルとAI戦の成績は\u3001ゲームごとにこのブラウザへ保存します\u3002通常チェスと変則チェスは別の記録です\u3002待ったは相手の応手と直前のレベル調整\u30FB戦績も戻します\u3002途中で対局をやめても勝敗には数えません\u3002進行中の盤面は直近の1局だけ自動保存され\u3001タイトルの\u300C続きから\u300Dで再開できます\u3002ブラウザの保存が制限されている場合は通知が出ます\u3002その場合もプレイは続けられます\u3002'
    ]);
  if (gameOver)
    t.unshift([
      'この対局の結果',
      document.getElementById('message').textContent
    ]);
  for (const [r, n] of t) {
    const t = document.createElement('section'), o = document.createElement('h3'), a = document.createElement('p');
    o.textContent = r;
    a.textContent = n.replace(/。/g, '\u3002\n');
    t.append(o, a);
    e.appendChild(t);
  }
  const r = document.getElementById('guideDialog');
  r.showModal();
  r.scrollTop = 0;
}

export function closeGameGuide() {
  document.getElementById('guideDialog').close();
}

export function resetGame() {
  stopAI();
  set_aiExecuting(false);
  set_gameOver(false);
  set_undoHistory([]);
  set_analysisBefore(null);
  set_lastSearch(null);
  set_roundRewarded(false);
  set_lastMove(null);
  set_shuffleSelection({
    w: [],
    b: []
  });
  set_hintOverride('');
  set_helpTopic(null);
  set_currentThreats([]);
  set_currentRisks([]);
  set_board(initialBoard());
  set_moved(initialMoved());
  set_enPassant(null);
  set_forcedCapture(null);
  set_turn(firstColor());
  set_taflWinner(null);
  if (gameType === 'quoridor')
    qReset();
  if (gameType === 'morris')
    morrisReset();
  if (gameType === 'fourChess') {
    set_fourScores({
      w: 0,
      r: 0,
      b: 0,
      u: 0
    });
    set_fourTurnCounts({
      w: 0,
      r: 0,
      b: 0,
      u: 0
    });
    set_fourKingLosses({
      w: 0,
      r: 0,
      b: 0,
      u: 0
    });
  }
  set_selected(null);
  set_pendingSkill(null);
  set_points({
    w: isSkillMode() ? 2 : 0,
    b: isSkillMode() ? 2 : 0
  });
  set_halfmove(0);
  set_repetitions(new Map());
  set_recentAI([]);
  set_lastMoveMessage('');
  if (gameType === 'arimaa')
    arReset();
  recordPosition();
  setHint('');
}

export function startGame(e, t = false) {
  if (!gameMode && savedMatch && !t) {
    askUIAction('保存中の一局を置き換えますか\uFF1F', '保存枠は直近の1局だけです\u3002新しい対局を始めると\u3001保存中の盤面は置き換わります\u3002', '新しい対局を始める', () => startGame(e, true));
    return;
  }
  if (gameType === 'reversi' && rPlayerCount === 4 && e !== 'normal')
    return;
  if (gameType === 'quoridor' && qPlayerCount > 2 && e !== 'normal')
    return;
  if (gameType === 'fourChess' && e !== 'normal')
    return;
  if (gameType !== 'chess' && gameType !== 'fourChess' && ![
      'normal',
      'single'
    ].includes(e))
    return;
  document.getElementById('gameLibrary').hidden = true;
  document.getElementById('startScreen').hidden = false;
  if (![
      'normal',
      'skill',
      'single',
      'singleSkill'
    ].includes(e))
    return;
  clearSavedMatch();
  set_keyboardPosition({
    x: 0,
    y: 0
  });
  set_activeProfileId(gameType === 'chess' && (e === 'skill' || e === 'singleSkill') ? 'chessVariant' : gameType);
  set_profile(loadProfile());
  set_gameMode(e);
  resetGame();
  showActiveGame();
  queueAITurn();
}

export function showActiveGame() {
  document.getElementById('gameLibrary').hidden = true;
  document.getElementById('startScreen').style.display = 'none';
  document.getElementById('gameUI').style.display = 'grid';
  document.getElementById('gameUI').classList.toggle('solo', isSoloMode());
  for (const e of document.querySelectorAll('.skills,#whitePoints,#blackPoints,#skillRules'))
    e.style.display = isSkillMode() ? '' : 'none';
  configureCompactUI();
  drawBoard();
  fitBoard();
  requestAnimationFrame(fitBoard);
}

export function restartGame() {
  if (gameMode)
    startGame(gameMode);
}

export function setSoloOrder(e) {
  if (gameMode)
    return;
  set_soloOrder(e === 'second' ? 'second' : 'first');
  updateSoloOrder();
}

export function updateSoloOrder() {
  const e = firstColor(), t = opposite(e);
  document.getElementById('orderFirst').textContent = '先手\uFF08' + sideName(e) + '\uFF09';
  document.getElementById('orderSecond').textContent = '後手\uFF08' + sideName(t) + '\uFF09';
  document.getElementById('soloOrder').value = soloOrder;
  if (gameType !== 'fourChess')
    document.getElementById('soloModeNote').textContent = 'あなたは' + sideName(playerColor()) + '\u30FB' + (soloOrder === 'first' ? '先手' : '後手') + ' / AI Lv.' + profile.level + '\u3002待ったも使えます';
  const r = document.getElementById('variantSoloNote');
  if (r)
    r.textContent = 'あなたは' + sideName(playerColor()) + '\u30FB' + (soloOrder === 'first' ? '先手' : '後手') + ' / AI Lv.' + profile.level;
}

export function renderGameIntro(e) {
  const t = gameIntroductions[e];
  document.getElementById('gameTitle').textContent = t.name;
  document.getElementById('gameCatch').textContent = t.catch;
  for (const [e, r] of [
      [
        'introLead',
        'lead'
      ],
      [
        'introGoal',
        'goal'
      ],
      [
        'introMove',
        'move'
      ],
      [
        'introTip',
        'tip'
      ],
      [
        'introNote',
        'note'
      ],
      [
        'soloModeNote',
        'solo'
      ]
    ])
    document.getElementById(e).textContent = t[r];
  updateSoloOrder();
  document.getElementById('gameIntro').scrollTop = 0;
  document.getElementById('board').setAttribute('aria-label', t.name + 'の盤面');
  document.title = t.name + ' \xB7 SteamMewks';
}

export function chooseGame(e) {
  const t = e === 'chessVariant';
  const r = t ? 'chess' : e;
  if (![
      'chess',
      'chessVariant',
      'breakthrough',
      'checkers',
      'reversi',
      'arimaa',
      'hnefatafl',
      'quoridor',
      'morris',
      'fourChess'
    ].includes(e))
    return;
  stopAI();
  set_gameMode(null);
  set_gameType(r);
  set_activeProfileId(e);
  set_profile(loadProfile());
  if (workerURL) {
    URL.revokeObjectURL(workerURL);
    set_workerURL(null);
  }
  document.getElementById('gameLibrary').hidden = true;
  document.getElementById('startScreen').hidden = false;
  document.getElementById('startScreen').style.display = '';
  document.getElementById('gameUI').style.display = 'none';
  document.getElementById('qPlayerChoices').hidden = r !== 'quoridor';
  document.getElementById('startScreen').classList.toggle('quoridorMenu', r === 'quoridor' || r === 'reversi');
  document.getElementById('rPlayerChoices').hidden = r !== 'reversi';
  const n = document.getElementById('localMode'), o = document.getElementById('soloMode'), a = document.querySelector('.soloOrder');
  n.onclick = () => startGame('normal');
  o.onclick = () => startGame('single');
  n.innerHTML = '2人で対局<small>1台の画面を交互に操作</small>';
  o.innerHTML = '機巧士と対局<small id="soloModeNote">AIとの1人対局\u30FB待ったも使えます</small>';
  if (t) {
    for (const e of document.querySelectorAll('[data-standard-mode]'))
      e.hidden = true;
    for (const e of document.querySelectorAll('[data-chess-variant]'))
      e.hidden = false;
    if (a)
      a.hidden = false;
  } else if (r === 'fourChess') {
    n.hidden = false;
    o.hidden = false;
    n.innerHTML = '四者の競い合い<small>FFA\u30FB4人の個人戦</small>';
    n.onclick = () => startFourChess('ffa');
    o.innerHTML = '盟約の対局<small id="soloModeNote">白\uFF0B黒 vs 赤\uFF0B青\u3002チーム合計点</small>';
    o.onclick = () => startFourChess('teams');
    for (const e of document.querySelectorAll('[data-chess-variant]'))
      e.hidden = true;
    if (a)
      a.hidden = true;
  } else {
    for (const e of document.querySelectorAll('[data-standard-mode]'))
      e.hidden = false;
    for (const e of document.querySelectorAll('[data-chess-variant]'))
      e.hidden = true;
    if (a)
      a.hidden = false;
  }
  document.getElementById('actionGuide').onclick = openGameGuide;
  renderGameIntro(t ? 'chessVariant' : r);
  if (r === 'fourChess')
    document.getElementById('soloModeNote').textContent = '2v2\u30FB白\uFF0B黒 vs 赤\uFF0B青';
  if (r === 'quoridor')
    setQuoridorPlayers(2);
  if (r === 'reversi')
    setReversiPlayers(2);
  document.getElementById('normalTools').textContent = r === 'chess' ? '白と黒を交互に操作する2人対戦' : r === 'checkers' ? '白先手 \xB7 飛び取りは必須\u3001連続取りあり' : r === 'reversi' ? '黒先手 \xB7 置けない場合は自動パス' : r === 'hnefatafl' ? '黒\uFF1D攻撃側 \uFF0F 白\uFF1D王を守る側' : r === 'morris' ? '白先手 \xB7 9石配置 \u2192 移動 \u2192 3石で飛び' : r === 'fourChess' ? 'FFA / 2v2 \xB7 P1 N3 B3 R5 Q9 K20点' : '相手の最奥へ\u30011駒でも先に突破すれば勝ち';
  const s = t ? 'Variant Chess' : {
    chess: 'Simple Chess',
    breakthrough: 'Breakthrough',
    checkers: 'Checkers',
    reversi: 'Reversi',
    arimaa: 'Arimaa',
    hnefatafl: 'Hnefatafl',
    quoridor: 'Quoridor',
    morris: 'Morris',
    fourChess: 'Four Player Chess'
  }[r];
  document.getElementById('gameFooter').textContent = 'SteamMewks \xB7 ' + s;
}

export function showGameLibrary() {
  if (gameMode && !gameOver)
    saveMatch();
  stopAI();
  set_gameMode(null);
  set_selected(null);
  set_pendingSkill(null);
  document.getElementById('gameUI').style.display = 'none';
  document.getElementById('startScreen').hidden = true;
  document.getElementById('gameLibrary').hidden = false;
  document.title = '機巧の遊戯卓 \xB7 SteamMewks';
  refreshResumePanel();
  applyPendingPWAUpdate();
}

export function snapshot() {
  return {
    fourScores: { ...fourScores },
    fourTurnCounts: { ...fourTurnCounts },
    fourKingLosses: { ...fourKingLosses },
    ar: JSON.parse(JSON.stringify(ar)),
    taflWinner: taflWinner,
    q: JSON.parse(JSON.stringify(q)),
    morris: JSON.parse(JSON.stringify(morris)),
    board: board.map(e => e.slice()),
    moved: { ...moved },
    enPassant: enPassant ? { ...enPassant } : null,
    turn: turn,
    points: { ...points },
    halfmove: halfmove,
    forcedCapture: forcedCapture ? { ...forcedCapture } : null,
    repetitions: [...repetitions],
    recentAI: [...recentAI],
    profile: { ...profile },
    lastSearch: lastSearch ? { ...lastSearch } : null,
    lastMove: lastMove ? { ...lastMove } : null,
    roundRewarded: roundRewarded
  };
}

export function undoMove() {
  if (!isSoloMode() || !undoHistory.length)
    return;
  stopAI();
  const e = undoHistory.pop();
  restoreSnapshot(e);
  set_profile(e.profile);
  set_arMode('step');
  set_arEnemy(null);
  set_selected(null);
  set_pendingSkill(null);
  set_gameOver(false);
  set_analysisBefore(null);
  set_lastMoveMessage('待った\uFF1Aあなたの前の手から考え直せます\u3002');
  saveProfile();
  setHint('');
  drawBoard();
}

export function positionKey() {
  if (gameType === 'fourChess')
    return board.flat().join(',') + '|' + turn + '|' + fourTurnOrder.map(e => fourKingLosses[e] + ',' + Math.min(FOUR_KING_PROTECTION_TURNS, fourTurnCounts[e])).join(';');
  if (gameType === 'hnefatafl')
    return board.flat().join(',') + '|' + turn;
  if (gameType === 'quoridor')
    return board.flat().join(',') + '|' + turn + '|' + q.h.map(qWallKey).sort().join(';') + '|' + q.v.map(qWallKey).sort().join(';') + '|' + qColors(board).map(e => e + ':' + q.walls[e]).join(',');
  if (gameType === 'morris')
    return board.flat().join(',') + '|' + turn + '|' + morris.toPlace.w + ',' + morris.toPlace.b + '|' + (morris.remove || '-');
  if (gameType === 'arimaa')
    return arKey(board, turn);
  if (isVariant())
    return board.flat().join(',') + '|' + turn + '|' + (forcedCapture ? forcedCapture.x + ',' + forcedCapture.y : '');
  if (gameType === 'breakthrough')
    return board.flat().join(',') + '|' + turn;
  let e = '-';
  if (enPassant) {
    const t = enPassant.y + (turn === 'w' ? -1 : 1);
    for (const r of [
        enPassant.x - 1,
        enPassant.x + 1
      ])
      if (inside(r, enPassant.y) && board[enPassant.y][r] === turn + 'P' && isLegalMove(r, enPassant.y, enPassant.x, t))
        e = enPassant.x + ',' + enPassant.y;
  }
  const t = [
    'w',
    'b'
  ].map(e => [
    0,
    7
  ].map(t => {
    const r = e === 'w' ? 7 : 0;
    return !moved[e + 'K'] && !moved[e + 'R' + t] && board[r][4] === e + 'K' && board[r][t] === e + 'R' ? e + t : '';
  }).join('')).join('');
  const r = [];
  for (const e of [
      'w',
      'b'
    ]) {
    const t = e === 'w' ? 6 : 1;
    for (let n = 0; n < 8; n++)
      if (board[t][n] === e + 'P' && moved['pawn' + n + ',' + t])
        r.push(n + ',' + t);
  }
  return board.flat().join(',') + '|' + turn + '|' + t + '|' + e + '|' + r.join(';') + (isSkillMode() ? '|' + points.w + ',' + points.b : '');
}

export function recordPosition() {
  const e = positionKey();
  repetitions.set(e, (repetitions.get(e) || 0) + 1);
}

export function terminalStatus() {
  return getGameModule().ending?.() || '';
}

export function endTurn() {
  set_turn(opposite(turn));
  set_selected(null);
  set_pendingSkill(null);
  recordPosition();
  drawBoard();
  queueAITurn();
}

export function pushUndoSnapshot() {
  undoHistory.push(snapshot());
  if (undoHistory.length > 200)
    undoHistory.shift();
}

export function rememberCustomHuman() {
  if (isSoloMode() && turn === playerColor())
    pushUndoSnapshot();
}

export function finishCustomTurn() {
  set_turn(gameType === 'quoridor' ? qNextTurn(turn) : opposite(turn));
  set_selected(null);
  recordPosition();
  drawBoard();
  queueAITurn();
}

export function threatInfo() {
  if ([
      'arimaa',
      'hnefatafl',
      'quoridor',
      'morris'
    ].includes(gameType))
    return [];
  if (isVariant())
    return variantThreatInfo();
  const e = [];
  for (let t = 0; t < 8; t++)
    for (let r = 0; r < 8; r++)
      if (board[t][r]?.[0] === playerColor() && isSquareAttacked(board, r, t, aiColor())) {
        const n = board[t][r];
        e.push({
          x: r,
          y: t,
          p: n,
          guarded: isSquareAttacked(board, r, t, playerColor())
        });
      }
  return e;
}

export function fitBoard() {
  const e = document.getElementById('boardWrap');
  if (!gameMode || !e.clientWidth || !e.clientHeight)
    return;
  const t = Math.min(e.clientWidth - 16, e.clientHeight - 16) / boardDimension();
  const r = Math.max(1, Math.floor(t * 100) / 100);
  document.getElementById('board').style.setProperty('--cell', r + 'px');
}

export function configureCompactUI() {
  document.getElementById('gameUI').classList.toggle('specialSolo', gameMode === 'singleSkill');
  document.getElementById('modeBadge').textContent = gameType === 'reversi' && rPlayerCount === 4 ? '4人対戦' : gameType === 'quoridor' && !isSoloMode() ? qPlayerCount + '人対戦' : gameMode === 'singleSkill' ? '特殊\u30FBひとり' : isSoloMode() ? 'ひとり' : isSkillMode() ? '特殊\u30FB2人' : '2人対戦';
  document.getElementById('soloAssist').hidden = !isSoloMode();
  document.getElementById('skillTools').hidden = !isSkillMode();
  document.getElementById('normalTools').hidden = [
    'arimaa',
    'quoridor'
  ].includes(gameType) || gameMode !== 'normal' && gameType !== 'reversi';
  document.getElementById('arTools').hidden = gameType !== 'arimaa';
  document.getElementById('qTools').hidden = gameType !== 'quoridor';
  document.getElementById('modeHelp').hidden = gameMode === 'normal';
  document.getElementById('modeHelp').textContent = isSkillMode() ? '仕掛け' : '機巧士\u30FBAI';
}

export function updateSoloUI(e = []) {
  set_currentThreats(e);
  document.getElementById('undoButton').disabled = !undoHistory.length;
  document.getElementById('aiLevel').textContent = 'あなた\uFF1A' + sideName(playerColor()) + ' \xB7 AI Lv.' + profile.level + '/50';
}

export function showHelp(e) {
  set_helpTopic(e);
  set_hintOverride('');
  updateHint();
}

export function helpDescription(e) {
  if (gameType === 'hnefatafl') {
    if (e === 'rules')
      return 'ネファタフル\uFF08遊戯卓版\u30FB11\xD711\uFF09\uFF1A黒の攻撃側が先手\u3002全駒は縦横へ好きな距離だけ進み\u3001飛び越し不可\u3002白の王だけが玉座と四隅へ止まれます\u3002敵兵は自分の駒2枚\u3001または自分の駒と空の特殊マスで挟むと捕獲\u3002白は王を四隅へ逃がせば勝ち\u3001黒は王を四方から包囲すれば勝ち\u3002手番で動けない側も負けです\u3002本作では出口砦\u30FB盾壁\u30FB包囲環などの高度なコペンハーゲン追加規定は省略しています\u3002';
    if (e === 'colors')
      return '\u25CF\uFF1D選択した駒の移動先\u3001黄枠\uFF1D選択中\u3001青\uFF1D直前の移動\u3002緑の四隅\uFF1D王の脱出口\u3001中央の印\uFF1D玉座\u3002';
    if (e === 'ai')
      return 'プレイに応じて強さが変わる\u3001ネファタフルの適応型AI Lv.' + profile.level + ' / 50\u3002王の角への距離\u3001捕獲\u3001包囲を評価します\u3002レベルが上がるほど上位候補を選びやすくなります\u3002';
  }
  if (gameType === 'quoridor') {
    if (e === 'rules')
      return qRules();
    if (e === 'colors')
      return '\u25CF\uFF1D駒の移動先\u3002\u300C壁を置く\u300Dでマス間の線をタップすると\u3001２マス分の壁の候補を表示します\u3002金色は設置可能\u3001赤色は設置不可\u3002\u300C設置\u300Dで確定\u3001\u300C取消\u300Dで候補を消します\u3002キーボードではマス上でEnterが横壁\u3001Shift\uFF0BEnterが縦壁の候補です\u3002';
    if (e === 'ai' && qPlayerCount > 2)
      return '３\u30FB４人モードは１台の画面を交互に操作する対人戦です\u3002';
    if (e === 'ai')
      return 'プレイに応じて強さが変わる\u3001コリドールの適応型AI Lv.' + profile.level + ' / 50\u3002自分と相手の最短路を比較し\u3001駒移動と壁配置を選びます\u3002';
  }
  if (gameType === 'morris') {
    if (e === 'rules')
      return 'ナイン\u30FBメンズ\u30FBモリス\uFF1A白が先手\u3002まず9石ずつ24交点へ配置し\u3001その後は線でつながった隣の点へ移動\u3002自分の石が3つ一直線の\u300Cミル\u300Dになるたび\u3001相手の石を1つ除去します\u3002相手にミル外の石があれば\u3001ミル内の石は取れません\u3002残り3石になると空いている任意の点へ飛べます\u3002相手を2石以下にするか\u3001配置終了後に動けなくすれば勝ち\u3002';
    if (e === 'colors')
      return '\u25CFや光る交点\uFF1D配置\u30FB移動できる点\u3001黄枠\uFF1D選択中\u3001赤い強調\uFF1Dミル成立後に除去できる相手石\u3001青\uFF1D直前の移動\u3002';
    if (e === 'ai')
      return 'プレイに応じて強さが変わる\u3001モリスの適応型AI Lv.' + profile.level + ' / 50\u3002ミル成立\u3001相手のミル阻止\u3001移動可能数を優先して選びます\u3002';
  }
  if (gameType === 'fourChess') {
    if (e === 'rules')
      return FOUR_CHESS_GUIDE.map(([e, t]) => e + '\uFF1A' + t).join('\n\n');
    if (e === 'colors')
      return '黄枠\uFF1D選択中\u3001\u25CF\uFF1D移動先\u3001赤い輪\uFF1D取れる駒\u3001\uD83D\uDD12\uFF1D序盤10手のキング捕獲制限\u3002駒の左上の\u26A0\uFF1D失冠した陣営の警告駒\uFF08双方とも得点なし\uFF09\u3001灰色駒\uFF1D脱落陣営の動かない障害物\uFF08捕獲0点\uFF09\u3002縞と右下の\u26A0\uFF1D自分のキングを敵の射線にさらす移動先\u3002青い強調\uFF1D直前の手\u3002四隅のキング2つ\uFF1D現在の王\uFF0B復帰枠\u3002半透明の王は予備\u3001打消線の王は失った残機\u3001\u26A0は復帰待ち\u3002白は手前\u3001黒は奥\u3001青は左\u3001赤は右から進軍します\u3002';
    if (e === 'ai')
      return '4人チェスはローカル対戦専用です\u3002AI戦はありません\u3002';
  }
  if (gameType === 'arimaa')
    return arHelp(e);
  if (gameType === 'reversi' && rPlayerCount === 4) {
    if (e === 'rules')
      return frRules();
    if (e === 'colors')
      return '黒\u30FB赤\u30FB白\u30FB青の４色で個人戦\u3002\u25CF\uFF1D置けるマス\u3001青緑の背景\uFF1D直前に置いたマス\u3002';
    if (e === 'ai')
      return '４人リバーシは１台の画面を交互に操作する対人戦です\u3002';
  }
  if (isVariant() && e === 'rules')
    return variantRules();
  if (isVariant() && e === 'colors')
    return gameType === 'reversi' ? '\u25CF\uFF1D石を置けるマス\u3001青\uFF1D直前に置いたマス\u3002ソロの担当色は開始前に選べます\u3002' : '\u25CF\uFF1D進めるマス\u3001輪付きの印\uFF1D飛び取りできるマス\u3001黄枠\uFF1D選択中\u3001青\uFF1D直前の移動\u3002取れる駒があると\u3001その捕獲手だけが光ります\u3002';
  if (isVariant() && e === 'ai') {
    const e = levelConfig(profile.level);
    return (gameType === 'reversi' ? 'リバーシ' : 'チェッカー') + '専用の適応型AI Lv.' + profile.level + ' / 50\u3002読みの目標' + e.depth + '手先\u3002手の安定度と勝敗で強さが変わります\u3002レベルはゲームごとに保存\u3002待ったは相手の応手も戻します\u3002';
  }
  if (gameType === 'breakthrough' && e === 'ai') {
    const e = levelConfig(profile.level);
    return '突破戦専用の適応型AI Lv.' + profile.level + ' / 50\u3002読みの目標' + e.depth + '手先' + (lastSearch ? '\u3001直前は' + lastSearch.depth + '手先' : '') + '\u30026手ごとの安定度と勝敗で強さが変わります\u3002待ったはAIの応手と強さの調整を戻します\u3002チェスとは別にレベルを保存します\u3002';
  }
  if (gameType === 'breakthrough' && e === 'rules')
    return '前か斜め前へ1マス進めます\u3002斜め前の敵は取れますが\u3001正面の敵は取れません\u3002後退\u30FB初手2マス\u30FB昇格はありません\u3002先に相手の最奥へ到達するか\u3001相手の駒を全て取ると勝ち\u3002手番で動けない側も負けです\u3002';
  if (gameType === 'breakthrough' && e === 'colors')
    return '\u25CF\uFF1D動けるマス\u3001\u25EF\uFF1D取れる駒\u3001黄枠\uFF1D選択中\u3001青\uFF1D直前の移動\u3002' + (isSoloMode() ? 'オレンジ\uFF0B!は狙われている駒\u3001縞\uFF0B\u26A0は移動後に取られる可能性があるマス\u3002' : '');
  if (e === 'colors')
    return '\u25CF\uFF1D動けるマス\u3001\u25EF\uFF1D取れる駒\u3001黄枠\uFF1D選択中\u3001青\uFF1D直前の移動\u3002' + (isSoloMode() ? 'オレンジ\uFF0B!\uFF1D狙われている駒\u3002縞\uFF0B\u26A0\uFF1D移動後に取られる可能性があるマス\u3002警告がなくても数手先まで安全とは限りません\u3002' : '赤枠\uFF1Dチェック中のキング\u3002');
  if (e === 'rules')
    return 'チェスは白が先手\u3002自分の駒を選び\u3001光る移動先を選びます\u3002キングは周囲1マス\u3001クイーンは縦\u30FB横\u30FB斜め\u3001ルークは縦横\u3001ビショップは斜めへ進みます\u3002ナイトは駒を飛び越えてL字に進みます\u3002ポーンは前へ1マス\u3001未移動で初期位置にいれば2マスも可能\u3002敵を取るのは斜め前です\u3002最奥では自動でクイーンへ昇格し\u3001昇格先の選択はありません\u3002相手のキングを逃げられないチェック\u300Cチェックメイト\u300Dに追い込むと勝ち\u3002自分のキングを危険にする手は指せません\u3002条件を満たすキャスリングとアンパッサンに対応します\u3002ステイルメイト\u3001詰ませる駒が不足する局面\u3001同一局面3回\u3001捕獲もポーン移動もない50手ずつの進行では自動で引き分けになります\u3002変則卓ではポイントを消費する仕掛けも1手として使え\u3001通常チェスの駒不足による引き分けは適用されません\u3002仕掛けの条件は\u300C仕掛けの扱い\u300Dで確認できます\u3002';
  if (e === 'skills')
    return '各2ptで開始\u3002駒を取られた側に1pt\uFF08上限10pt\uFF09\u3002スキルも1手を消費\u3002配置2pt\uFF1D自陣にポーン追加\u3002除去3pt\uFF1D敵ポーン消去\u3002撹乱4pt\uFF1D白黒それぞれ最大5駒を選び\u3001陣営内で入替\u3002王\u30FBポーンも対象\u3002両王が安全で\u3001最終段のポーンや即引き分けを生まない配置だけ採用\u3002撹乱はチェック中には使えません\u3002昇格6pt\uFF1D中央を越えた自分のポーンをクイーンに\u3002同じ対象選択ボタンでもう一度押すとキャンセル\u3002';
  if (e === 'ai') {
    const e = levelConfig(profile.level);
    return 'プレイに応じて強さが変わる適応型AI Lv.' + profile.level + ' / 50\u3002読みの目標' + e.depth + '手先' + (lastSearch ? '\u3001直前は' + lastSearch.depth + '手先' : '') + '\u30026手ごとの安定度で\xB11\u3001勝利+3\u30FB敗北\u22122\u3002低レベルは見落としもします\u3002変則卓ではAIもポイントと仕掛けを使います\u3002通常チェスと変則チェスのレベルは別々です\u3002待ったはAIの応手\u30FBスキルと強さの調整も戻します\u3002レベルはブラウザに保存\u3002';
  }
  return '';
}

export function cancelAnimations() {
  for (const e of moveAnimations)
    e.cancel();
  set_moveAnimations([]);
  if (shuffleVisualCleanup) {
    shuffleVisualCleanup();
    set_shuffleVisualCleanup(null);
  }
  set_animating(false);
}

export function animateMove(e, t) {
  cancelAnimations();
  if (typeof boardEl.querySelector !== 'function' || typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
    return;
  const r = [{
      sx: e.sx,
      sy: e.sy,
      tx: e.tx,
      ty: e.ty
    }];
  if (t[1] === 'K' && Math.abs(e.tx - e.sx) === 2)
    r.push({
      sx: e.tx > e.sx ? 7 : 0,
      sy: e.sy,
      tx: e.tx > e.sx ? 5 : 3,
      ty: e.sy
    });
  for (const e of r) {
    const t = boardEl.querySelector('[data-x="' + e.sx + '"][data-y="' + e.sy + '"]'), r = boardEl.querySelector('[data-x="' + e.tx + '"][data-y="' + e.ty + '"]');
    const n = r?.querySelector('.piece');
    if (!t || !n || typeof n.animate !== 'function')
      continue;
    const o = t.getBoundingClientRect(), a = r.getBoundingClientRect();
    const s = isSoloMode() && playerColor() === 'b' ? -1 : 1;
    const i = localTurnFlipped() || isSoloMode() && playerColor() === 'b' ? ' rotate(180deg)' : '';
    const l = n.animate([
      { transform: 'translate(' + (o.left - a.left) * s + 'px,' + (o.top - a.top) * s + 'px)' + i },
      { transform: 'translate(0,0)' + i }
    ], {
      duration: 240,
      easing: 'cubic-bezier(.2,.7,.25,1)'
    });
    n.style.zIndex = '5';
    l.finished.catch(() => {
    }).then(() => {
      n.style.zIndex = '';
    });
    moveAnimations.push(l);
  }
  if (moveAnimations.length) {
    set_animating(true);
    const e = moveAnimations;
    Promise.all(e.map(e => e.finished.catch(() => {
    }))).then(() => {
      if (moveAnimations === e) {
        set_animating(false);
        set_moveAnimations([]);
      }
    });
  }
}

export function clickCell(e, t) {
  if (!gameMode || gameOver || animating || isSoloMode() && isAITurn())
    return;
  set_helpTopic(null);
  const r = getGameModule().click;
  if (r) {
    r(e, t);
    return;
  }
  if (pendingSkill === 'shuffleEnemy') {
    toggleShuffleTarget(e, t);
    return;
  }
  if (pendingSkill) {
    useSkill(pendingSkill, {
      x: e,
      y: t
    }, turn);
    return;
  }
  const n = board[t][e];
  if (selected && selected.x === e && selected.y === t) {
    set_selected(null);
    drawBoard();
    return;
  }
  if (selected && isLegalMove(selected.x, selected.y, e, t)) {
    playMove({
      sx: selected.x,
      sy: selected.y,
      tx: e,
      ty: t
    });
    return;
  }
  if (n && n[0] === turn) {
    set_selected({
      x: e,
      y: t
    });
    setHint('');
    drawBoard();
  } else {
    set_selected(null);
    setHint('移動できるマスを選んでください\u3002');
    drawBoard();
  }
}

export function updatePoints() {
  document.getElementById('skillButtons').hidden = false;
  document.getElementById('skillTools').classList.toggle('shufflePlanning', pendingSkill === 'shuffleEnemy');
  const e = document.querySelector('#skillButtons button:nth-child(3)');
  e.innerHTML = pendingSkill === 'shuffleEnemy' ? '撹乱 解除' : '撹乱 <small>4pt</small>';
  document.getElementById('shuffleControls').hidden = pendingSkill !== 'shuffleEnemy';
  document.getElementById('shuffleCount').textContent = '白 ' + shuffleSelection.w.length + '/5\u30FB黒 ' + shuffleSelection.b.length + '/5';
  document.getElementById('shuffleConfirm').disabled = animating || humanInputBlocked() || !validShuffleSelection();
  document.getElementById('whitePt').textContent = points.w;
  document.getElementById('blackPt').textContent = points.b;
  document.getElementById('skillTurn').textContent = (turn === 'w' ? '白' : '黒') + 'のスキル';
  for (const e of document.querySelectorAll('.skills')) {
    const t = turn;
    [...e.querySelectorAll('button')].forEach((e, r) => {
      const n = Object.keys(skills)[r];
      e.disabled = gameOver || animating || humanInputBlocked() || t !== turn || points[t] < skills[n].cost || isSkillMode() && !skillTargets(n, t).length;
      e.setAttribute('aria-pressed', String(pendingSkill === n && t === turn));
    });
  }
}

export function updateHint() {
  if (gameType === 'fourChess') {
    const e = selected ? board[selected.y][selected.x] : null;
    const t = e ? (e[1] === 'K' ? 'キング\uFF1A周囲1マス\u3002敵の射線に入る手には確認が出ます\u3002' : e[1] === 'P' ? 'ポーン\uFF1A前進し\u3001斜め前の敵を取ります\u3002自陣から11段目で\u3001通常はクイーン\u3001失冠中は一度だけキングへ昇格\u3002' : pieceHints[e[1]]) + ' \u25CFへ移動\u3001輪のある駒を取れます\u3002' : '';
    const r = hintOverride || (helpTopic ? helpDescription(helpTopic) : gameOver ? document.getElementById('message').textContent + '\u3002\u300C指し直す\u300Dで再戦できます\u3002' : t || '白\u2192赤\u2192黒\u2192青\u3002初めの失冠は\u26A0\u3001昇格で一度だけ復帰\u30021人の完全脱落\u3001または全員が一度以上失冠すると終局し\u3001累積スコアで決着します\u3002');
    document.getElementById('hintMain').textContent = r;
    document.getElementById('hintWarning').textContent = !gameOver && fourIsWarning(turn) ? '\u26A0 失冠中は駒を取っても得点できません\u3002ポーンを昇格させてキングを取り戻しましょう\u3002' : !gameOver && fourKingLosses[turn] === 1 ? '復帰枠は使用済み\u3002次にこのキングを失うと完全脱落し\u3001その場で対局が終わります\u3002' : '';
    for (const e of document.querySelectorAll('#hintTabs button'))
      e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : helpTopic === 'ai' ? 'mode' : helpTopic)));
    return;
  }
  if ([
      'hnefatafl',
      'quoridor',
      'morris'
    ].includes(gameType)) {
    let e = hintOverride || (helpTopic ? helpDescription(helpTopic) : gameOver ? document.getElementById('message').textContent + '\u3002\u300C指し直す\u300Dで再対戦できます\u3002' : aiThinking ? '機巧士が次の一手を思案中\u2026' : '');
    if (!e && gameType === 'hnefatafl')
      e = selected ? '選んだ駒を縦横へ動かします\u3002\u25CFの移動先を選んでください\u3002' : '王を四隅へ逃がす白と\u3001包囲する黒の非対称戦です\u3002自分の駒を選んでください\u3002';
    if (!e && gameType === 'quoridor')
      e = q.mode === 'pawn' ? '\u25CFへ駒を進めます\u3002壁を使うなら\u300C壁を置く\u300Dを選択\u3002' : q.candidate ? qWallError(q.candidate.ori, q.candidate.x, q.candidate.y) || '金色の壁が設置候補です\u3002\u300C設置\u300Dで確定\u3001別の線で選び直せます\u3002' : 'マスの間の線をタップして壁の候補を選び\u3001\u300C設置\u300Dで確定します\u3002';
    if (!e && gameType === 'morris')
      e = morris.remove === turn ? 'ミル成立\uFF01赤く示された相手石を1つ取り除いてください\u3002' : morris.toPlace[turn] > 0 ? '配置段階\uFF1A光る交点へ石を置きます\u3002残り ' + morris.toPlace[turn] + '石\u3002' : selected ? '移動先の光る交点を選んでください\u3002' : '自分の石を選んで移動\u3002残り3石なら好きな空点へ飛べます\u3002';
    document.getElementById('hintMain').textContent = e;
    document.getElementById('hintWarning').textContent = '';
    for (const e of document.querySelectorAll('#hintTabs button'))
      e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : helpTopic === 'ai' ? 'mode' : helpTopic)));
    return;
  }
  if (gameType === 'arimaa') {
    arHint();
    return;
  }
  if (gameType === 'reversi' && rPlayerCount === 4) {
    document.getElementById('hintMain').textContent = hintOverride || (helpTopic ? helpDescription(helpTopic) : gameOver ? document.getElementById('message').textContent : '\u25CFへ石を置き\u3001他の色の石を挟んで返します\u3002複数色をまとめて挟めます\u3002置けない人は自動パス\u3002');
    document.getElementById('hintWarning').textContent = '';
    for (const e of document.querySelectorAll('#hintTabs button'))
      e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : helpTopic)));
    return;
  }
  if (isVariant()) {
    const e = hintOverride || (helpTopic ? helpDescription(helpTopic) : gameOver ? document.getElementById('message').textContent + '\u3002待った\u30FB指し直すで続けられます\u3002' : aiThinking ? '機巧士が次の一手を思案中\u2026' : gameType === 'reversi' ? '\u25CFのある空きマスへ置いて\u3001相手の石を挟みます\u3002' + (isSoloMode() ? 'あなたは' + (playerColor() === 'w' ? '白' : '黒') + 'です\u3002' : '黒が先手です\u3002') : forcedCapture ? '連続取り\uFF01同じ駒で\u3001光っている移動先へ続けて飛んでください\u3002' : draughtsMoves(board, turn).some(e => e.capture) ? '飛び取りできる駒があります\u3002捕獲は必須です\u3002' : '駒を選んで斜めへ進みます\u3002最奥でキングに昇格します\u3002');
    document.getElementById('hintMain').textContent = e;
    document.getElementById('hintWarning').textContent = !gameOver && isSoloMode() && currentRisks.length ? '\u26A0 縞のマスでは飛び取りされる可能性があります\u3002' : '';
    for (const e of document.querySelectorAll('#hintTabs button'))
      e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : helpTopic === 'ai' ? 'mode' : helpTopic)));
    return;
  }
  const e = hintOverride || (helpTopic ? helpDescription(helpTopic) : gameOver ? document.getElementById('message').textContent + '\u3002\u300C指し直す\u300Dで再対戦できます\u3002' : pendingSkill ? skillHints[pendingSkill] : selected ? (gameType === 'breakthrough' ? '突破兵\uFF1A前\u30FB斜め前へ1マス\u3002敵を取れるのは斜め前だけ\u3002最奥へ着けば勝利\uFF01' : pieceHints[board[selected.y][selected.x][1]]) + ' \u25CFへ移動\u3001\u25EFの駒を取れます\u3002' : isKingInCheck(turn) ? 'チェック中\uFF01キングを逃がす\u30FB攻撃を遮る\u30FB攻撃駒を取る手を探しましょう\u3002' : aiThinking ? '機巧士が次の一手を思案中\u3002待ったで前の手に戻せます\u3002' : isSkillMode() ? '駒を選んで移動\u3002スキルは上のボタンで使えます\u3002説明は\u300C仕掛け\u300Dをタップ\u3002' : '自分の駒をタップすると\u3001移動先と駒の動きが表示されます\u3002');
  document.getElementById('hintMain').textContent = e;
  let t = '';
  if (!gameOver && isSoloMode())
    if (currentRisks.length)
      t = '\u26A0 縞の移動先では\u3001この駒を取られる可能性があります\u3002';
    else if (currentThreats.length)
      t = '\u26A0 オレンジ\uFF0B!の駒が狙われています\u3002味方が守っていても表示します\u3002';
  document.getElementById('hintWarning').textContent = t;
  for (const e of document.querySelectorAll('#hintTabs button'))
    e.setAttribute('aria-pressed', String(e.dataset.help === (helpTopic === null ? 'auto' : [
      'ai',
      'skills'
    ].includes(helpTopic) ? 'mode' : helpTopic)));
}

export function isDangerousDestination(e, t, r, n) {
  if (gameType === 'arimaa')
    return false;
  if (gameType === 'reversi')
    return false;
  if (gameType === 'checkers') {
    const o = draughtsApply(liveState(), {
      sx: e,
      sy: t,
      tx: r,
      ty: n
    }, turn);
    return !o.chain && draughtsMoves(o.board, opposite(turn)).some(e => e.capture?.x === r && e.capture?.y === n);
  }
  const o = nextState(liveState(), {
      sx: e,
      sy: t,
      tx: r,
      ty: n
    }), a = board[t][e][0], s = opposite(a);
  for (let e = 0; e < 8; e++)
    for (let t = 0; t < 8; t++) {
      const a = o.board[e][t];
      if (!a || a[0] !== s)
        continue;
      if (isLegalMove(t, e, r, n, o.board, o.enPassant, o.moved))
        return true;
      if (a[1] === 'P' && o.enPassant && o.enPassant.x === r && o.enPassant.y === n && e === n && Math.abs(t - r) === 1 && isLegalMove(t, e, r, n + (s === 'w' ? -1 : 1), o.board, o.enPassant, o.moved))
        return true;
    }
  return false;
}

export function renderBoard() {
  const e = getGameModule().draw;
  if (e) {
    e();
    return;
  }
  drawStandardBoard();
}

export function drawStandardBoard() {
  setBoardGrid(8, '');
  document.getElementById('gameUI').dataset.game = gameType;
  document.getElementById('gameUI').classList.toggle('soloBlack', isSoloMode() && playerColor() === 'b');
  if (gameType === 'reversi') {
    const e = reversiCounts(board);
    document.getElementById('normalTools').textContent = '黒 ' + e.b + '枚 \uFF0F 白 ' + e.w + '枚';
  }
  const e = localTurnFlipped();
  document.getElementById('gameUI').classList.toggle('turnFlipped', e);
  document.getElementById('gameUI').dataset.facing = e || isSoloMode() && playerColor() === 'b' ? 'black' : 'white';
  const t = terminalStatus();
  set_gameOver(!!t);
  finishLearning(t);
  document.getElementById('message').textContent = t || (turn === 'w' ? '白' : '黒') + 'の手番' + (isKingInCheck(turn) ? ' \u2014 チェック\uFF01' : '') + (lastMoveMessage ? ' / ' + lastMoveMessage : '');
  const r = isSoloMode() ? threatInfo() : [];
  boardEl.innerHTML = '';
  const n = gameType === 'reversi' && !gameOver && !aiThinking && (!isSoloMode() || !isAITurn()) ? reversiMoves(board, turn).map(e => ({
    x: e.tx,
    y: e.ty
  })) : selected ? getLegalMoves(selected.x, selected.y) : [];
  const o = isSoloMode() && turn === playerColor() && selected ? n.filter(e => isDangerousDestination(selected.x, selected.y, e.x, e.y)) : [];
  updateSoloUI(r);
  set_currentRisks(o);
  const a = pendingSkill && pendingSkill !== 'shuffleEnemy' ? skillTargets(pendingSkill, turn) : [];
  for (let e = 0; e < 8; e++)
    for (let t = 0; t < 8; t++) {
      const s = document.createElement('div'), i = board[e][t];
      s.className = 'cell ' + ((t + e) % 2 ? 'black' : 'white');
      if (i) {
        const e = document.createElement('span');
        e.className = 'piece ' + (i[0] === 'w' ? 'whitePiece' : 'blackPiece');
        e.textContent = pieces[i];
        if (isVariant()) {
          e.classList.add('tableToken', i[0] === 'w' ? 'lightToken' : 'darkToken');
          e.textContent = gameType === 'checkers' && i[1] === 'D' ? '\u265B' : '';
        }
        s.appendChild(e);
        if (i[1] === 'K' && isKingInCheck(i[0]))
          s.classList.add('checkKing');
      }
      if (r.some(r => r.x === t && r.y === e))
        s.classList.add('threatened');
      if (selected && selected.x === t && selected.y === e)
        s.classList.add('selected');
      if (n.some(r => r.x === t && r.y === e) || a.some(r => r.x === t && r.y === e))
        s.classList.add(i ? 'capture' : 'highlight');
      if (lastMove && (lastMove.sx === t && lastMove.sy === e || lastMove.tx === t && lastMove.ty === e))
        s.classList.add('lastMove');
      if (n.some(r => r.x === t && r.y === e)) {
        const r = document.createElement('span');
        r.className = i || n.some(r => r.x === t && r.y === e && r.capture) ? 'moveRing' : 'moveDot';
        r.setAttribute('aria-hidden', 'true');
        s.appendChild(r);
      }
      const l = o.some(r => r.x === t && r.y === e);
      if (l) {
        s.classList.add('dangerDestination');
        const e = document.createElement('span');
        e.className = 'dangerBadge';
        e.textContent = '\u26A0';
        e.setAttribute('aria-hidden', 'true');
        s.appendChild(e);
        s.title = 'ここへ移動すると\u3001この駒を相手に取られる可能性があります\u3002';
      }
      if (pendingSkill === 'shuffleEnemy' && i) {
        const r = shuffleSelection[i[0]].findIndex(r => r.x === t && r.y === e);
        if (r >= 0) {
          s.classList.add('shuffleSelected');
          const e = document.createElement('span');
          e.className = 'shuffleLabel';
          e.textContent = (i[0] === 'w' ? '白' : '黒') + (r + 1);
          s.appendChild(e);
        }
      }
      s.dataset.x = t;
      s.dataset.y = e;
      s.setAttribute('aria-label', String.fromCharCode(97 + t) + (8 - e) + (i ? ' ' + i : '') + (n.some(r => r.x === t && r.y === e) ? ' 移動できます' : '') + (r.some(r => r.x === t && r.y === e) ? ' 狙われています' : '') + (l ? ' 警告\uFF1A移動後に取られる可能性があります' : ''));
      s.onclick = () => clickCell(t, e);
      boardEl.appendChild(s);
    }
  if (gameType === 'arimaa') {
    arDecorate();
    document.getElementById('message').textContent = t || (turn === 'w' ? '白' : '黒') + 'の' + (ar.setup ? '配置' : '手番');
  }
  updateHint();
  updatePoints();
}

export function setBoardGrid(e, t = '') {
  boardEl.classList.remove('hnefBoard', 'quoridorBoard', 'morrisBoard', 'fourChessBoard');
  if (t)
    boardEl.classList.add(t);
  boardEl.style.gridTemplateColumns = 'repeat(' + e + ', var(--cell))';
  boardEl.style.gridTemplateRows = 'repeat(' + e + ', var(--cell))';
}

export function setCustomFacing() {
  document.getElementById('gameUI').dataset.game = gameType;
  document.getElementById('gameUI').classList.toggle('soloBlack', isSoloMode() && playerColor() === 'b');
  const e = localTurnFlipped();
  document.getElementById('gameUI').classList.toggle('turnFlipped', e);
  document.getElementById('gameUI').dataset.facing = e || isSoloMode() && playerColor() === 'b' ? 'black' : 'white';
}

export function variantThreatInfo() {
  if (gameType === 'reversi')
    return [];
  const e = [];
  for (const t of draughtsMoves(board, aiColor()))
    if (t.capture && !e.some(e => e.x === t.capture.x && e.y === t.capture.y))
      e.push({
        ...t.capture,
        p: board[t.capture.y][t.capture.x]
      });
  return e;
}

export function drawBoard() {
  const e = boardEl.contains(document.activeElement);
  renderBoard();
  setupBoardKeyboard(e);
  saveMatch();
}

export function boardCells() {
  return [...boardEl.querySelectorAll('[role="gridcell"]')];
}

export function setBoardFocus(e, t = false) {
  if (!e)
    return;
  for (const t of boardCells())
    t.tabIndex = t === e ? 0 : -1;
  set_keyboardPosition({
    x: Number(e.dataset.x),
    y: Number(e.dataset.y)
  });
  if (t)
    e.focus({ preventScroll: true });
}

export function setupBoardKeyboard(e = false) {
  const t = boardDimension();
  boardEl.setAttribute('role', 'grid');
  boardEl.setAttribute('aria-rowcount', t);
  boardEl.setAttribute('aria-colcount', t);
  boardEl.setAttribute('aria-describedby', 'boardKeyboardHelp');
  const r = [...boardEl.children].filter(e => e.classList.contains('cell'));
  const n = [];
  for (let e = 0; e < t; e++) {
    const t = document.createElement('div');
    t.className = 'boardGridRow';
    t.setAttribute('role', 'row');
    t.setAttribute('aria-rowindex', e + 1);
    n.push(t);
  }
  r.forEach((e, r) => {
    const o = Math.floor(r / t), a = r % t;
    const s = e.getAttribute('aria-hidden') !== 'true' && !e.classList.contains('voidCell');
    if (s) {
      e.dataset.x = a;
      e.dataset.y = o;
      e.setAttribute('role', 'gridcell');
      e.setAttribute('aria-rowindex', o + 1);
      e.setAttribute('aria-colindex', a + 1);
      e.setAttribute('aria-selected', String(selected?.x === a && selected?.y === o));
      e.tabIndex = -1;
    } else
      e.tabIndex = -1;
    n[o].appendChild(e);
  });
  for (const e of n)
    boardEl.appendChild(e);
  const o = boardCells(), a = o.find(e => Number(e.dataset.x) === keyboardPosition.x && Number(e.dataset.y) === keyboardPosition.y) || o[0];
  setBoardFocus(a, e);
}

export function handleBoardKey(e) {
  const t = e.target.closest('[role="gridcell"]');
  if (!t || !boardEl.contains(t))
    return;
  if ([
      'Enter',
      ' '
    ].includes(e.key)) {
    e.preventDefault();
    setBoardFocus(t);
    if (gameType === 'quoridor' && q.mode !== 'pawn')
      qSelectWall(e.shiftKey ? 'v' : 'h', Math.min(Number(t.dataset.x), 7), Math.min(Number(t.dataset.y), 7));
    else
      clickCell(Number(t.dataset.x), Number(t.dataset.y));
    return;
  }
  if (![
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End'
    ].includes(e.key))
    return;
  e.preventDefault();
  const r = boardCells(), n = Number(t.dataset.x), o = Number(t.dataset.y);
  let a;
  if (e.key === 'Home' || e.key === 'End') {
    const t = e.ctrlKey ? r : r.filter(e => Number(e.dataset.y) === o);
    a = e.key === 'Home' ? t[0] : t.at(-1);
  } else {
    const t = {
        ArrowUp: [
          0,
          -1
        ],
        ArrowDown: [
          0,
          1
        ],
        ArrowLeft: [
          -1,
          0
        ],
        ArrowRight: [
          1,
          0
        ]
      }[e.key], s = isSoloMode() && playerColor() === 'b' ? -1 : 1, i = boardDimension();
    for (let e = 1; e < i; e++) {
      const l = n + t[0] * s * e, u = o + t[1] * s * e;
      if (l < 0 || u < 0 || l >= i || u >= i)
        break;
      a = r.find(e => Number(e.dataset.x) === l && Number(e.dataset.y) === u);
      if (a)
        break;
    }
  }
  setBoardFocus(a, true);
}

export function initializeBoardKeyboard() {
  boardEl.addEventListener('keydown', handleBoardKey);
  boardEl.addEventListener('pointerdown', e => {
    const t = e.target.closest('[role="gridcell"]');
    if (t)
      setBoardFocus(t);
  });
}

export function variantEnding() {
  const e = variantWinner(liveState(), gameType, turn);
  if (e) {
    const t = gameType === 'reversi' ? reversiCounts(board) : null;
    return (e === 'draw' ? '引き分け\uFF01' : (e === 'w' ? '白' : '黒') + 'の勝ち\uFF01') + (t ? ' 白' + t.w + '枚\uFF0F黒' + t.b + '枚' : '');
  }
  if (gameType === 'checkers' && ((repetitions.get(positionKey()) || 0) >= 3 || halfmove >= 80))
    return '同一局面の反復\u3001または40手ずつ進展がないため引き分け';
  return '';
}
