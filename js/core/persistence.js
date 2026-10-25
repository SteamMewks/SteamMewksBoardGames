import { MATCH_SAVE_KEY, MATCH_SAVE_VERSION, activeProfileId, aiExecuting, aiThinking, analysisBefore, animating, ar, arAnimationTask, arEnemy, arMode, board, enPassant, forcedCapture, fourKingLosses, fourMode, fourScores, fourTurnCounts, gameIntroductions, gameMode, gameOver, gameType, halfmove, helpTopic, hintOverride, isAITurn, isSoloMode, keyboardPosition, lastMove, lastMoveMessage, lastSearch, morris, moved, pendingSkill, points, profile, q, qPlayerCount, rPlayerCount, recentAI, repetitions, restoringMatch, roundRewarded, saveTransaction, savedMatch, selected, session, set_activeProfileId, set_aiExecuting, set_aiThinking, set_analysisBefore, set_animating, set_ar, set_arAnimationTask, set_arEnemy, set_arMode, set_board, set_enPassant, set_forcedCapture, set_fourKingLosses, set_fourMode, set_fourScores, set_fourTurnCounts, set_gameMode, set_gameOver, set_halfmove, set_helpTopic, set_hintOverride, set_keyboardPosition, set_lastMove, set_lastMoveMessage, set_lastSearch, set_morris, set_moved, set_pendingSkill, set_points, set_profile, set_q, set_qPlayerCount, set_rPlayerCount, set_recentAI, set_repetitions, set_restoringMatch, set_roundRewarded, set_savedMatch, set_selected, set_shuffleSelection, set_soloOrder, set_storageNoticeShown, set_taflWinner, set_turn, set_undoHistory, shuffleSelection, soloOrder, storageNoticeShown, taflWinner, turn, undoHistory } from './state.js';
import { askUIAction, chooseGame, showActiveGame, showGameLibrary, snapshot, updateSoloOrder } from './ui.js';
import { loadProfile, queueAITurn, saveProfile } from './ai.js';
import { setQuoridorPlayers } from '../games/quoridor.js';
import { setReversiPlayers } from '../games/reversi.js';

export function notifyStorageFailure() {
  if (storageNoticeShown)
    return;
  set_storageNoticeShown(true);
  const e = document.getElementById('storageNotice');
  e.hidden = false;
  document.getElementById('storageNoticeText').textContent = 'このブラウザでは対局\u30FBAI戦績を保存できません\u3002プレイは続けられます\u3002';
}

export function readStorage(e) {
  try {
    return localStorage.getItem(e);
  } catch {
    notifyStorageFailure();
    return null;
  }
}

export function writeStorage(e, t) {
  try {
    localStorage.setItem(e, JSON.stringify(t));
    return true;
  } catch {
    notifyStorageFailure();
    return false;
  }
}

export function removeStorage(e) {
  try {
    localStorage.removeItem(e);
    return true;
  } catch {
    notifyStorageFailure();
    return false;
  }
}

export function validSavedMatch(e) {
  try {
    const obj = e => e !== null && typeof e === 'object' && !Array.isArray(e);
    const num = (e, t = 1000000) => Number.isInteger(e) && e >= 0 && e <= t;
    const text = (e, t = 10000) => typeof e === 'string' && e.length <= t;
    const t = [
      'w',
      'b',
      'r',
      'u'
    ];
    if (!obj(e) || e.version !== MATCH_SAVE_VERSION || !num(e.savedAt, Number.MAX_SAFE_INTEGER))
      return false;
    const r = [
      'chess',
      'breakthrough',
      'checkers',
      'reversi',
      'arimaa',
      'hnefatafl',
      'quoridor',
      'morris',
      'fourChess'
    ];
    if (!r.includes(e.gameType) || ![
        'normal',
        'single',
        'skill',
        'singleSkill'
      ].includes(e.mode) || ![
        'first',
        'second'
      ].includes(e.soloOrder))
      return false;
    const n = [
        'skill',
        'singleSkill'
      ].includes(e.mode), o = [
        'single',
        'singleSkill'
      ].includes(e.mode);
    if (n && e.gameType !== 'chess')
      return false;
    const a = e.gameType === 'chess' && n ? 'chessVariant' : e.gameType;
    if (e.profileId !== a || ![
        2,
        3,
        4
      ].includes(e.qPlayerCount) || ![
        2,
        4
      ].includes(e.rPlayerCount) || ![
        'ffa',
        'teams'
      ].includes(e.fourMode))
      return false;
    if (o && (e.gameType === 'fourChess' || e.gameType === 'quoridor' && e.qPlayerCount !== 2 || e.gameType === 'reversi' && e.rPlayerCount !== 2))
      return false;
    const s = e.gameType === 'fourChess' ? 14 : e.gameType === 'hnefatafl' ? 11 : e.gameType === 'quoridor' ? 9 : e.gameType === 'morris' ? 7 : 8;
    const i = {
      chess: /^[wb][PNBRQK]$/,
      breakthrough: /^[wb]P$/,
      checkers: /^[wb][MD]$/,
      reversi: e.rPlayerCount === 4 ? /^[wbru]O$/ : /^[wb]O$/,
      arimaa: /^[wb][RCDHME]$/,
      hnefatafl: /^(bA|wD|wK)$/,
      quoridor: /^[wbru]Q$/,
      morris: /^[wb]M$/,
      fourChess: /^[wbru][PNBRQK]$/
    }[e.gameType];
    const validBoard = e => Array.isArray(e) && e.length === s && e.every(e => Array.isArray(e) && e.length === s && e.every(e => typeof e === 'string' && (e === '' || i.test(e))));
    const xy = e => obj(e) && num(e.x, s - 1) && num(e.y, s - 1);
    const positionKey = e => text(e, 5000);
    function stateOK(r) {
      const n = e.gameType === 'fourChess' || e.gameType === 'reversi' && e.rPlayerCount === 4 ? t : e.gameType === 'quoridor' ? e.qPlayerCount === 2 ? [
        'w',
        'b'
      ] : e.qPlayerCount === 3 ? [
        'w',
        'r',
        'b'
      ] : t : [
        'w',
        'b'
      ];
      if (!obj(r) || !obj(r.ar) || !obj(r.q) || !obj(r.morris) || !validBoard(r.board) || !n.includes(r.turn) || !obj(r.moved) || !Object.values(r.moved).every(e => typeof e === 'boolean') || !obj(r.points) || !num(r.points.w, 10) || !num(r.points.b, 10) || !num(r.halfmove) || typeof r.roundRewarded !== 'boolean')
        return false;
      if (r.forcedCapture !== null && !xy(r.forcedCapture))
        return false;
      if (r.enPassant !== null && (!xy(r.enPassant) || ![
          'w',
          'b'
        ].includes(r.enPassant.color)))
        return false;
      if (!Array.isArray(r.repetitions) || r.repetitions.length > 20000 || !r.repetitions.every(e => Array.isArray(e) && e.length === 2 && positionKey(e[0]) && num(e[1])))
        return false;
      if (!Array.isArray(r.recentAI) || r.recentAI.length > 12 || !r.recentAI.every(e => text(e, 100)))
        return false;
      if (e.gameType === 'chess' && ![
          'w',
          'b'
        ].every(e => r.board.flat().filter(t => t === e + 'K').length === 1))
        return false;
      if (e.gameType === 'hnefatafl' && r.board.flat().filter(e => e === 'wK').length !== 1)
        return false;
      if (e.gameType === 'fourChess' && (!obj(r.fourScores) || !obj(r.fourTurnCounts) || !obj(r.fourKingLosses) || !t.every(e => num(r.fourScores[e]) && num(r.fourTurnCounts[e]) && num(r.fourKingLosses[e], 2))))
        return false;
      if (e.gameType === 'arimaa') {
        const e = r.ar;
        if (!obj(e) || typeof e.setup !== 'boolean' || !num(e.remaining, 4) || !text(e.start, 1000) || !Array.isArray(e.seen) || e.seen.length > 5 || !e.seen.every(e => text(e, 1000)) || !Array.isArray(e.steps) || e.steps.length > 4 || !e.steps.every(e => obj(e) && validBoard(e.board) && num(e.remaining, 4) && Array.isArray(e.seen) && e.seen.every(e => text(e, 1000))) || ![
            null,
            'w',
            'b'
          ].includes(e.winner))
          return false;
      }
      if (e.gameType === 'quoridor') {
        const n = r.q;
        const o = e.qPlayerCount === 2 ? [
          'w',
          'b'
        ] : e.qPlayerCount === 3 ? [
          'w',
          'r',
          'b'
        ] : t;
        if (!t.every(e => r.board.flat().filter(t => t === e + 'Q').length === (o.includes(e) ? 1 : 0)))
          return false;
        if (!obj(n) || !obj(n.walls) || ![
            'pawn',
            'wall',
            'h',
            'v'
          ].includes(n.mode) || ![
            null,
            ...t
          ].includes(n.winner))
          return false;
        if (!t.filter(e => r.board.some(t => t.includes(e + 'Q'))).every(e => num(n.walls[e], 10)))
          return false;
        if (n.candidate != null && (!obj(n.candidate) || ![
            'h',
            'v'
          ].includes(n.candidate.ori) || !num(n.candidate.x, 7) || !num(n.candidate.y, 7)))
          return false;
        for (const e of [
            'h',
            'v'
          ])
          if (!Array.isArray(n[e]) || n[e].length > 24 || !n[e].every(e => obj(e) && num(e.x, 7) && num(e.y, 7)))
            return false;
      }
      if (e.gameType === 'morris' && (!obj(r.morris) || !obj(r.morris.toPlace) || !num(r.morris.toPlace.w, 9) || !num(r.morris.toPlace.b, 9) || ![
          null,
          'w',
          'b'
        ].includes(r.morris.remove) || ![
          null,
          'w',
          'b'
        ].includes(r.morris.winner)))
        return false;
      if (![
          null,
          'w',
          'b'
        ].includes(r.taflWinner))
        return false;
      if (r.lastMove !== null && (!obj(r.lastMove) || ![
          'sx',
          'sy',
          'tx',
          'ty'
        ].every(e => Number.isInteger(r.lastMove[e]) && r.lastMove[e] >= -1 && r.lastMove[e] < s)))
        return false;
      if (r.profile !== void 0 && (!obj(r.profile) || !num(r.profile.level, 50) || r.profile.level < 1 || ![
          'games',
          'wins',
          'losses',
          'draws',
          'samples'
        ].every(e => num(r.profile[e] ?? 0, Number.MAX_SAFE_INTEGER)) || !Number.isFinite(r.profile.quality)))
        return false;
      return true;
    }
    if (e.analysisBefore !== null && e.analysisBefore !== void 0 && (!obj(e.analysisBefore) || !obj(e.analysisBefore.state) || !validBoard(e.analysisBefore.state.board) || !obj(e.analysisBefore.move) || ![
        'sx',
        'sy',
        'tx',
        'ty'
      ].every(t => Number.isInteger(e.analysisBefore.move[t]) && e.analysisBefore.move[t] >= -1 && e.analysisBefore.move[t] < s)))
      return false;
    if (!stateOK(e.state) || !Array.isArray(e.undoHistory) || e.undoHistory.length > 200 || !e.undoHistory.every(stateOK))
      return false;
    const l = e.ui;
    if (!obj(l) || !text(l.message, 4000) || ![
        null,
        'placePawn',
        'deleteEnemyPawn',
        'shuffleEnemy',
        'promotePawn'
      ].includes(l.pendingSkill) || ![
        'step',
        'push',
        'pull'
      ].includes(l.arMode))
      return false;
    if (l.selected !== null && (!xy(l.selected) || !e.state.board[l.selected.y][l.selected.x]))
      return false;
    if (l.arEnemy !== null && !xy(l.arEnemy))
      return false;
    if (!obj(l.shuffleSelection) || ![
        'w',
        'b'
      ].every(e => Array.isArray(l.shuffleSelection[e]) && l.shuffleSelection[e].length <= 5 && l.shuffleSelection[e].every(xy)))
      return false;
    if (!n && (l.pendingSkill !== null || l.shuffleSelection.w.length || l.shuffleSelection.b.length))
      return false;
    return true;
  } catch {
    return false;
  }
}

export function loadSavedMatch() {
  const e = readStorage(MATCH_SAVE_KEY);
  if (!e)
    return null;
  try {
    if (e.length > 5000000)
      throw Error('oversize');
    const t = JSON.parse(e);
    if (validSavedMatch(t))
      return t;
  } catch {
  }
  removeStorage(MATCH_SAVE_KEY);
  return null;
}

export function clearSavedMatch() {
  set_savedMatch(null);
  removeStorage(MATCH_SAVE_KEY);
  refreshResumePanel();
}

export function refreshResumePanel() {
  const e = document.getElementById('resumePanel');
  e.hidden = !savedMatch;
  if (!savedMatch)
    return;
  const t = savedMatch, r = gameIntroductions[t.profileId].name;
  const n = new Date(t.savedAt).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  document.getElementById('resumeSummary').textContent = r + ' \xB7 ' + ([
    'single',
    'singleSkill'
  ].includes(t.mode) ? '機巧士との対局' : t.gameType === 'fourChess' ? t.fourMode === 'teams' ? '2v2' : 'FFA' : t.gameType === 'quoridor' ? t.qPlayerCount + '人対局' : t.gameType === 'reversi' ? t.rPlayerCount + '人対局' : '2人対局') + ' \xB7 ' + n;
}

export function saveMatch() {
  if (restoringMatch || !gameMode || saveTransaction === session)
    return false;
  if (gameOver) {
    clearSavedMatch();
    return true;
  }
  if (gameType === 'arimaa' && isSoloMode() && isAITurn() && !ar.setup && ar.remaining < 4)
    return false;
  const e = {
    version: MATCH_SAVE_VERSION,
    savedAt: Date.now(),
    gameType: gameType,
    profileId: activeProfileId,
    mode: gameMode,
    soloOrder: soloOrder,
    qPlayerCount: qPlayerCount,
    rPlayerCount: rPlayerCount,
    fourMode: fourMode,
    state: snapshot(),
    undoHistory: undoHistory,
    analysisBefore: analysisBefore,
    ui: {
      selected: selected,
      pendingSkill: pendingSkill,
      shuffleSelection: shuffleSelection,
      arMode: arMode,
      arEnemy: arEnemy,
      message: lastMoveMessage,
      keyboardPosition: keyboardPosition
    }
  };
  try {
    const t = JSON.stringify(e);
    if (t.length > 5000000)
      throw Error('oversize');
    const r = JSON.parse(t);
    if (!validSavedMatch(r))
      throw Error('invalid live state');
    set_savedMatch(r);
    const n = writeStorage(MATCH_SAVE_KEY, r);
    refreshResumePanel();
    return n;
  } catch {
    notifyStorageFailure();
    return false;
  }
}

export function restoreSnapshot(e) {
  set_board(e.board);
  set_moved(e.moved);
  set_enPassant(e.enPassant);
  set_turn(e.turn);
  set_points(e.points);
  set_halfmove(e.halfmove);
  set_forcedCapture(e.forcedCapture);
  set_repetitions(new Map(e.repetitions));
  set_recentAI(e.recentAI);
  set_lastSearch(e.lastSearch);
  set_lastMove(e.lastMove);
  set_roundRewarded(e.roundRewarded);
  set_ar(e.ar);
  set_taflWinner(e.taflWinner);
  set_q(e.q);
  set_morris(e.morris);
  if (gameType === 'fourChess') {
    set_fourScores(e.fourScores);
    set_fourTurnCounts(e.fourTurnCounts);
    set_fourKingLosses(e.fourKingLosses);
  }
}

export function resumeMatch() {
  if (!savedMatch || !validSavedMatch(savedMatch)) {
    clearSavedMatch();
    return;
  }
  const e = JSON.parse(JSON.stringify(savedMatch));
  set_restoringMatch(true);
  try {
    chooseGame(e.profileId);
    set_qPlayerCount(e.qPlayerCount);
    set_rPlayerCount(e.rPlayerCount);
    set_fourMode(e.fourMode);
    set_soloOrder(e.soloOrder);
    set_gameMode(e.mode);
    set_activeProfileId(e.profileId);
    restoreSnapshot(e.state);
    set_profile(e.state.profile || loadProfile());
    saveProfile();
    set_undoHistory(e.undoHistory);
    set_analysisBefore(e.analysisBefore || null);
    set_selected(e.ui.selected);
    set_pendingSkill(e.ui.pendingSkill);
    set_shuffleSelection(e.ui.shuffleSelection);
    set_arMode(e.ui.arMode);
    set_arEnemy(e.ui.arEnemy);
    set_lastMoveMessage(e.ui.message);
    set_keyboardPosition(e.ui.keyboardPosition && Number.isInteger(e.ui.keyboardPosition.x) && Number.isInteger(e.ui.keyboardPosition.y) ? e.ui.keyboardPosition : {
      x: 0,
      y: 0
    });
    set_arAnimationTask(Promise.resolve());
    set_gameOver(false);
    set_aiThinking(false);
    set_aiExecuting(false);
    set_animating(false);
    set_hintOverride('');
    set_helpTopic(null);
    if (gameType === 'quoridor')
      setQuoridorPlayers(qPlayerCount);
    if (gameType === 'reversi')
      setReversiPlayers(rPlayerCount);
    updateSoloOrder();
    showActiveGame();
  } catch {
    set_gameMode(null);
    showGameLibrary();
    clearSavedMatch();
    document.getElementById('resumeStatus').textContent = '対局の記録を読み込めませんでした\u3002新しい一局を始められます\u3002';
  } finally {
    set_restoringMatch(false);
  }
  if (gameMode) {
    saveMatch();
    queueAITurn();
  }
}

export function requestDiscardMatch() {
  if (!savedMatch)
    return;
  askUIAction('保存中の盤を片付けますか\uFF1F', '直近の1局の続きから遊べなくなります\u3002AIレベルと戦績は残ります\u3002', '保存を破棄', clearSavedMatch);
}

export function initializePersistence() {
  set_savedMatch(loadSavedMatch());
  refreshResumePanel();
  window.addEventListener('pagehide', saveMatch);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden')
      saveMatch();
  });
}
