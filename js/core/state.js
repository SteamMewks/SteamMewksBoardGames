import { getGameModule } from './registry.js';
import { fourColorName } from '../games/four-chess.js';
import { chessInitialBoard } from '../games/chess.js';
import { loadProfile } from './ai.js';
import { updateHint } from './ui.js';

export const gameModules = Object.create(null);

export const pieceHints = {
  K: 'キング\uFF1A周囲1マス\u3002攻撃されるマスへは進めません\u3002',
  Q: 'クイーン\uFF1A縦\u30FB横\u30FB斜めに進めます\u3002',
  R: 'ルーク\uFF1A縦\u30FB横に進めます\u3002',
  B: 'ビショップ\uFF1A斜めに進めます\u3002',
  N: 'ナイト\uFF1A駒を飛び越えてL字に進めます\u3002',
  P: 'ポーン\uFF1A前に進み\u3001斜め前の敵を取ります\u3002最奥でクイーンに昇格\u3002'
};

export const gameIntroductions = {
  chess: {
    name: 'Chess',
    catch: '真鍮の王冠に\u3001静かな一手を\u3002',
    lead: '磨かれた盤に並ぶ\u3001役目の異なる六種の駒\u3002攻めと守りを組み合わせ\u3001相手の王を追い詰める古典の一卓です\u3002',
    goal: '相手のキングを\u3001攻撃から逃げられない状態\u300Cチェックメイト\u300Dにすると勝ち\u3002',
    move: '白が先手\u3002自分の駒を選び\u3001光る移動先をタップ\u3002駒ごとに動きが異なり\u3001選ぶとヒントに説明が出ます\u3002',
    tip: '強い駒だけを先に出さず\u3001味方どうしで守り合おう\u3002ソロでは危険な駒や移動先に警告が出ます\u3002',
    note: 'このゲームではポーンは最奥で自動的にクイーンへ昇格\u3002\u300C特殊ルール\u300Dは配置\u30FB除去\u30FB入替\u30FB昇格のスキルを加えた独自モードです\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  chessVariant: {
    name: 'Variant Chess',
    catch: '盤の定石に\u3001工房の仕掛けを\u3002',
    lead: 'おなじみのチェスに\u3001配置\u30FB除去\u30FB撹乱\u30FB昇格の四つの仕掛けを添えました\u3002蓄えたポイントを\u3001勝負を動かす一手へ\u3002',
    goal: '通常チェスと同じく\u3001相手のキングをチェックメイトすると勝ち\u3002スキルを使って盤面そのものを組み替えられます\u3002',
    move: '駒の移動は通常チェスと同じ\u3002加えてポイントを消費し\u3001ポーン配置\u30FB敵ポーン除去\u30FB駒の撹乱\u30FBポーン昇格を使えます\u3002',
    tip: 'スキルだけで勝とうとせず\u3001通常の駒交換と組み合わせるのが重要\u3002ポイントを終盤まで残す選択も有効です\u3002',
    note: 'この卓では仕掛けも一手を使います\u30022人対局でも機巧士\uFF08AI\uFF09との対局でも\u3001同じスキルルールです\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  breakthrough: {
    name: 'Breakthrough',
    catch: '一兵の突破が\u3001戦線を変える\u3002',
    lead: '前進だけを命じられた小さな兵たち\u3002相手の守りを抜け\u3001たった一駒を対岸へ届ける\u3001覚えやすい一卓です\u3002',
    goal: '自分の駒を1つでも相手側の最奥へ届けると勝ち\u3002相手の駒を全て取るか\u3001動けなくしても勝ちです\u3002',
    move: '白が先手\u3002前か斜め前へ1マス進みます\u3002敵の駒を取れるのは斜め前だけ\u3002後ろには戻れません\u3002',
    tip: '片側だけに集中せず\u3001左右に突破の道を作ろう\u3002敵の進路を空ける前に\u3001次の一歩を確認\u3002',
    note: '初手の2マス移動や昇格はありません\u3002全ての駒が同じ動きなので\u3001初めての一卓にも\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  checkers: {
    name: 'Checkers',
    catch: '飛び石の一手に\u3001連鎖の読みを\u3002',
    lead: '駒を飛び越えて奪う\u3001連続取りの勝負\u3002一枚を差し出す手が\u3001次の大きな収穫につながることもあります\u3002',
    goal: '相手の駒を全て取るか\u3001相手が1手も動けなくなると勝ち\u3002',
    move: '白が先手\u3002斜め前へ1マス移動\u3002隣の敵を飛び越えて取れます\u3002取れるときは捕獲が必須で\u3001続けて取れる間は同じ駒を動かします\u3002',
    tip: '飛び取った着地点も確認しよう\u3002自分が取った直後に\u3001相手の連続取りが待っていることも\u3002',
    note: '本作は白先手\u3002最奥でキングに昇格するとその手は終了\u3002キングは前後へ1マス移動\u30FB飛び取りができます\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  reversi: {
    name: 'Reversi',
    catch: '白黒の潮目は\u3001一手で変わる\u3002',
    lead: '挟んだ石が色を変え\u3001盤上の勢力が入れ替わります\u3002二者でじっくり\u3001四者なら四つの色で最後の一枚まで競い合う卓です\u3002',
    goal: '全員が置けなくなったら終了\u3002自分の石が最多なら勝ち\u3001最多が複数なら同率です\u3002',
    move: '黒が先手\u3002\u25CFのある空きマスをタップ\u3002縦\u30FB横\u30FB斜めで挟んだ相手の石が全て自分の色に変わります\u3002',
    tip: '角の石は裏返されません\u3002角のすぐ隣へ置くときは\u3001相手に角を渡さないか確認しよう\u3002',
    note: '２人\u30FB４人を選んで開始\u3002４人戦は中央８枚\uFF08各２枚\uFF09\u3001黒\u2192赤\u2192白\u2192青\u3002異なる色が混在していてもまとめて挟めます\u3002置けない人は自動パス\u3002４人戦は対人専用です\u3002',
    solo: 'あなたは黒\u30FB先手\u3002待ったも使えます'
  },
  arimaa: {
    name: 'Arimaa',
    catch: '四歩を束ね\u3001獣たちの道を開け\u3002',
    lead: '象からウサギまで\u3001強さの異なる獣たちが並びます\u3002味方の支えと押し引きを組み合わせ\u3001罠のある盤を渡りましょう\u3002',
    goal: '手番の終わりに\u3001自分のウサギが相手側の最奥にいれば勝ち\u3002相手のウサギの全滅や\u3001相手が動けない場合も勝ちです\u3002',
    move: '白が先手\u3002最初に自分の駒を2つ選んで陣形を入替\u30FB確定\u3002その後は1手番に最大4歩\u3001縦横へ移動\u3002ウサギだけは後退できません\u3002',
    tip: '強い駒で弱い敵を押す\u30FB引くと2歩消費\u3002\xD7の罠上の駒は隣の味方が支えます\u3002支援を外すと味方も罠に落ちます\u3002',
    note: '象\uFF1Eラクダ\uFF1E馬\uFF1E犬\uFF1E猫\uFF1Eウサギ\u3002強い敵の隣で味方の支援がない駒は凍結します\u3002残り歩数を使い切らず\u300C手番終了\u300Dも可能\u3002ソロAIは練習向けです\u3002',
    solo: 'あなたは白\u30FB先手\u3002AIは標準陣形'
  },
  hnefatafl: {
    name: 'Hnefatafl',
    catch: '北方の王を\u3001包囲の外へ\u3002',
    lead: '北方に伝わる\u3001王の脱出を巡る一卓\u3002守る白と囲む黒では\u3001駒の数も勝利への道も異なります\u3002',
    goal: '白\u30FB守備側は王を四隅のどれかへ逃がせば勝ち\u3002黒\u30FB攻撃側は王を四方から包囲して捕らえれば勝ちです\u3002',
    move: '黒が先手\u3002全ての駒はルークのように縦横へ何マスでも移動できます\u3002兵は敵を両側から挟むと捕獲\u3002王だけが中央の玉座と四隅へ止まれます\u3002',
    tip: '白は王だけを急がせず\u3001脱出路を開く駒を残そう\u3002黒は四隅への線を塞ぎながら\u3001王の周囲を狭めます\u3002',
    note: '本作は11\xD711のコペンハーゲン式を基礎に\u3001基本の移動\u30FB挟み取り\u30FB角脱出\u30FB王の包囲へ絞った遊戯卓版です\u3002高度な出口砦\u30FB盾壁などは省略\u3002',
    solo: '先手は黒\u30FB攻撃側\u3002担当する手番を選べます'
  },
  quoridor: {
    name: 'Quoridor',
    catch: '道を進むか\u3001道を組み替えるか\u3002',
    lead: '小さな壁が旅路を変える\u3001道造りの遊戯卓\u3002駒を奪わず\u3001相手の足取りを遠回りさせながら対岸を目指します\u3002',
    goal: '自分の出発辺の向かい側へ\u3001最初に到達した人の勝ち\u3002白は上辺\u3001黒は下辺\u3001赤は左辺\u3001青は右辺を目指します\u3002',
    move: '白が先手\u30021手で\u300C駒を1マス進める\u300Dか\u300C壁を1枚置く\u300Dのどちらか\u3002相手と向かい合えば飛び越し\u3001後ろが塞がれていれば斜めへ回れます\u3002',
    tip: '壁は相手を遠回りさせるだけでなく\u3001自分の道も変えます\u3002終盤用に数枚残すと逆転しやすい\u3002',
    note: '9\xD79盤\u3002人数を選んで開始\uFF1A２人は１人10枚\u3001３人は８枚\u3001４人は６枚\u3002壁の重なり\u30FB交差\u30FB誰かの経路の完全封鎖は禁止\u3002３\u30FB４人は対人専用です\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  morris: {
    name: 'Morris',
    catch: '三つの石で\u3001勝負の輪を回す\u3002',
    lead: '三重の方形を結ぶ二十四の交点\u3002石を置き\u3001線を渡り\u3001三つの並び\u300Cミル\u300Dを組み上げる古典の一卓です\u3002',
    goal: 'ミルで相手石を取り\u3001相手を2石以下にするか\u3001配置終了後に1手も動けなくすれば勝ち\u3002',
    move: '白が先手\u3002最初は9石を交互に配置\u3002配置後は線でつながった隣へ移動し\u3001自分が3石になれば任意の空点へ飛べます\u3002三連のミルを作ると相手石を1つ除去\u3002',
    tip: '二つのミルを行き来できる形を作ると強力\u3002相手が次に三連を完成できる空点も常に確認しよう\u3002',
    note: '正式名は Nine Men\u2019s Morris\uFF08ナイン\u30FBメンズ\u30FBモリス\uFF09\u3002相手にミル外の石が残っている間は\u3001ミルを構成する石を取れません\u30021手で複数ミルができても除去は1石です\u3002',
    solo: 'あなたは白\u30FB先手\u3002待ったも使えます'
  },
  fourChess: {
    name: '4-Player Chess',
    catch: '四つの王冠\u3001交わる思惑\u3002',
    lead: '四方の席から\u3001白\u30FB赤\u30FB黒\u30FB青の軍が進みます\u3002個人で競うか\u3001向かいの席と盟約を結ぶか\u3002最後は駒取りの得点で決着します\u3002',
    goal: 'FFAは個人の累積スコア\u30012v2はチーム合計で勝負\u30021人の完全脱落\u3001全員が一度以上失冠\u3001全員が移動不能のいずれかで終局します\u3002脱落した人の得点も最終集計に含みます\u3002',
    move: '白\u2192赤\u2192黒\u2192青の順に\u3001自分の駒\u2192光る移動先を選びます\u3002各陣営の11手目からキング捕獲が解禁\u3002初めの失冠では\u26A0付きで続行し\u3001得点は停止\u3002ポーンが自陣から11段目へ進むと\u3001一度だけキングとして復帰できます\u3002',
    tip: 'キングの前の駒を動かすと\u3001遠くの射線が通ることがあります\u3002序盤10手は守りを整える猶予です\u3002失冠後はポーンの進路を確保しましょう\u3002誰かを完全脱落させる手は対局を直ちに終わらせるので\u3001指す前に全員の得点を確かめるのが肝心です\u3002',
    note: '復帰の手は加点せず\u3001次の手番から得点再開\u3002警告駒\u30FB灰色駒の捕獲は0点\u3002四隅のキングは現在の王と復帰枠を示す残機帳です\u3002全員の失冠履歴は\u3001復帰しても残ります\u3002得点到達による終了はありません\u3002詳しい得点\u30FB終局条件は対局中の\u300C遊戯指南\u300Dへ\u3002',
    solo: '4人チェスはローカル対戦専用です\u3002AI戦はありません\u3002'
  }
};

export const pieces = {
  wP: '\u2659',
  wR: '\u2656',
  wN: '\u2658',
  wB: '\u2657',
  wQ: '\u2655',
  wK: '\u2654',
  bP: '\u265F',
  bR: '\u265C',
  bN: '\u265E',
  bB: '\u265D',
  bQ: '\u265B',
  bK: '\u265A',
  rP: '\u265F',
  rR: '\u265C',
  rN: '\u265E',
  rB: '\u265D',
  rQ: '\u265B',
  rK: '\u265A',
  uP: '\u265F',
  uR: '\u265C',
  uN: '\u265E',
  uB: '\u265D',
  uQ: '\u265B',
  uK: '\u265A'
};

export const opposite = e => e === 'w' ? 'b' : 'w';

export let fourMode = 'ffa';

export let fourScores = {
  w: 0,
  r: 0,
  b: 0,
  u: 0
};

export let fourTurnCounts = {
  w: 0,
  r: 0,
  b: 0,
  u: 0
};

export let fourKingLosses = {
  w: 0,
  r: 0,
  b: 0,
  u: 0
};

export const inside = (e, t) => e >= 0 && e < 8 && t >= 0 && t < 8;

export const inBoard = (e, t, r) => e >= 0 && e < r && t >= 0 && t < r;

export let gameType = 'chess', forcedCapture = null;

export let ar = {
    setup: true,
    remaining: 4,
    start: '',
    seen: [],
    steps: [],
    winner: null
  }, arMode = 'step', arEnemy = null, arAnimationTask = Promise.resolve();

export let taflWinner = null;

export let qPlayerCount = 2, rPlayerCount = 2;

export let q = {
  walls: {
    w: 10,
    b: 10
  },
  h: [],
  v: [],
  mode: 'pawn',
  winner: null
};

export let morris = {
  toPlace: {
    w: 9,
    b: 9
  },
  remove: null,
  winner: null
};

export const isVariant = () => gameType === 'checkers' || gameType === 'reversi';

export let soloOrder = 'first';

export const firstColor = () => getGameModule().first || 'w';

export const boardDimension = () => getGameModule().dimension || 8;

export const sideName = e => gameType === 'hnefatafl' ? e === 'b' ? '黒\u30FB攻撃側' : '白\u30FB守備側' : gameType === 'fourChess' || gameType === 'quoridor' ? fourColorName(e) : e === 'w' ? '白' : '黒';

export const playerColor = () => soloOrder === 'first' ? firstColor() : opposite(firstColor());

export const aiColor = () => opposite(playerColor());

export const isAITurn = () => turn === aiColor();

export const initialBoard = () => getGameModule().initial?.() || chessInitialBoard();

export const initialMoved = () => ({
  wK: false,
  bK: false,
  wR0: false,
  wR7: false,
  bR0: false,
  bR7: false
});

export let board = initialBoard(), moved = initialMoved(), enPassant = null, turn = 'w';

export const isSoloMode = () => gameMode === 'single' || gameMode === 'singleSkill';

export const isSkillMode = () => gameMode === 'skill' || gameMode === 'singleSkill';

export let aiExecuting = false;

export const humanInputBlocked = () => isSoloMode() && isAITurn() && !aiExecuting;

export let gameMode = null, selected = null, pendingSkill = null, points = {
    w: 0,
    b: 0
  }, gameOver = false;

export const localTurnFlipped = () => gameType === 'fourChess' || gameType === 'quoridor' && qPlayerCount > 2 || gameType === 'reversi' && rPlayerCount === 4 ? false : (gameMode === 'normal' || gameMode === 'skill') && turn !== firstColor();

export let aiTimer = null, aiThinking = false, session = 0, lastMoveMessage = '', halfmove = 0;

export let repetitions = new Map(), recentAI = [];

export let lastMove = null, moveAnimations = [], animating = false;

export let shuffleSelection = {
    w: [],
    b: []
  }, shuffleVisualCleanup = null;

export let undoHistory = [], aiWorker = null, workerURL = null, analysisBefore = null, lastSearch = null, roundRewarded = false;

export const MATCH_SAVE_KEY = 'steammewks-game-table-match-v1';

export const MATCH_SAVE_VERSION = 1;

export let savedMatch = null, storageNoticeShown = false, saveTransaction = false, restoringMatch = false;

export let keyboardPosition = {
  x: 0,
  y: 0
};

export const PROFILE_KEY = 'steammewks-chess-learning-v1';

export let activeProfileId = 'chess';

export const AI_GAMES = [
  [
    'breakthrough',
    'Breakthrough'
  ],
  [
    'reversi',
    'Reversi'
  ],
  [
    'quoridor',
    'Quoridor'
  ],
  [
    'checkers',
    'Checkers'
  ],
  [
    'hnefatafl',
    'Hnefatafl'
  ],
  [
    'morris',
    'Morris'
  ],
  [
    'chess',
    'Chess'
  ],
  [
    'chessVariant',
    'Variant Chess'
  ],
  [
    'arimaa',
    'Arimaa'
  ]
];

export const profileStorageKey = (e = activeProfileId) => e === 'chess' ? PROFILE_KEY : PROFILE_KEY + '-' + e;

export let profile = loadProfile();

export let pendingUIAction = null;

export let hintOverride = '', helpTopic = null, currentThreats = [], currentRisks = [];

export const boardEl = document.getElementById('board');

export const liveState = () => ({
  board: board,
  moved: moved,
  enPassant: enPassant,
  chain: forcedCapture
});

export const setHint = e => {
  hintOverride = e;
  updateHint();
};

export let strategyDistanceCache = new Map();

export let pwaInstallPrompt = null, pwaUpdatePending = false, pwaReloading = false;

export function set_analysisBefore(value) { return analysisBefore = value; }

export function set_board(value) { return board = value; }

export function set_moved(value) { return moved = value; }

export function set_enPassant(value) { return enPassant = value; }

export function set_halfmove(value) { return halfmove = value; }

export function set_lastMoveMessage(value) { return lastMoveMessage = value; }

export function set_lastMove(value) { return lastMove = value; }

export function set_fourMode(value) { return fourMode = value; }

export function set_fourKingLosses(value) { return fourKingLosses = value; }

export function set_selected(value) { return selected = value; }

export function set_hintOverride(value) { return hintOverride = value; }

export function set_turn(value) { return turn = value; }

export function set_gameOver(value) { return gameOver = value; }

export function set_currentRisks(value) { return currentRisks = value; }

export function set_currentThreats(value) { return currentThreats = value; }

export function set_shuffleSelection(value) { return shuffleSelection = value; }

export function set_helpTopic(value) { return helpTopic = value; }

export function set_pendingSkill(value) { return pendingSkill = value; }

export function set_saveTransaction(value) { return saveTransaction = value; }

export function set_animating(value) { return animating = value; }

export function set_moveAnimations(value) { return moveAnimations = value; }

export function set_shuffleVisualCleanup(value) { return shuffleVisualCleanup = value; }

export function set_taflWinner(value) { return taflWinner = value; }

export function set_qPlayerCount(value) { return qPlayerCount = value; }

export function set_q(value) { return q = value; }

export function set_morris(value) { return morris = value; }

export function set_rPlayerCount(value) { return rPlayerCount = value; }

export function set_storageNoticeShown(value) { return storageNoticeShown = value; }

export function set_savedMatch(value) { return savedMatch = value; }

export function set_points(value) { return points = value; }

export function set_forcedCapture(value) { return forcedCapture = value; }

export function set_repetitions(value) { return repetitions = value; }

export function set_recentAI(value) { return recentAI = value; }

export function set_lastSearch(value) { return lastSearch = value; }

export function set_roundRewarded(value) { return roundRewarded = value; }

export function set_ar(value) { return ar = value; }

export function set_fourScores(value) { return fourScores = value; }

export function set_fourTurnCounts(value) { return fourTurnCounts = value; }

export function set_restoringMatch(value) { return restoringMatch = value; }

export function set_soloOrder(value) { return soloOrder = value; }

export function set_gameMode(value) { return gameMode = value; }

export function set_activeProfileId(value) { return activeProfileId = value; }

export function set_profile(value) { return profile = value; }

export function set_undoHistory(value) { return undoHistory = value; }

export function set_arMode(value) { return arMode = value; }

export function set_arEnemy(value) { return arEnemy = value; }

export function set_keyboardPosition(value) { return keyboardPosition = value; }

export function set_arAnimationTask(value) { return arAnimationTask = value; }

export function set_aiThinking(value) { return aiThinking = value; }

export function set_aiExecuting(value) { return aiExecuting = value; }

export function set_aiWorker(value) { return aiWorker = value; }

export function set_session(value) { return session = value; }

export function set_aiTimer(value) { return aiTimer = value; }

export function set_workerURL(value) { return workerURL = value; }

export function set_pendingUIAction(value) { return pendingUIAction = value; }

export function set_gameType(value) { return gameType = value; }

export function set_pwaInstallPrompt(value) { return pwaInstallPrompt = value; }

export function set_pwaReloading(value) { return pwaReloading = value; }

export function set_pwaUpdatePending(value) { return pwaUpdatePending = value; }
