import { board, forcedCapture, inside, opposite, selected, setHint, set_selected, turn } from '../core/state.js';
import { playVariantMove } from '../core/ai.js';
import { drawBoard } from '../core/ui.js';

export function draughtsInitial() {
  const e = Array.from({ length: 8 }, () => Array(8).fill(''));
  for (let t = 0; t < 8; t++)
    for (let r = 0; r < 8; r++)
      if ((r + t) % 2 && (t < 3 || t > 4))
        e[t][r] = (t < 3 ? 'b' : 'w') + 'M';
  return e;
}

export function draughtsCaptures(e, t, r) {
  const n = e[r]?.[t];
  if (!n)
    return [];
  const o = n[1] === 'D' ? [
      -1,
      1
    ] : [n[0] === 'w' ? -1 : 1], a = [];
  for (const s of o)
    for (const o of [
        -1,
        1
      ]) {
      const i = t + o * 2, l = r + s * 2;
      if (inside(i, l) && !e[l][i] && e[r + s][t + o] && e[r + s][t + o][0] !== n[0])
        a.push({
          sx: t,
          sy: r,
          tx: i,
          ty: l,
          capture: {
            x: t + o,
            y: r + s
          }
        });
    }
  return a;
}

export function draughtsMoves(e, t, r = null) {
  if (r)
    return draughtsCaptures(e, r.x, r.y);
  const n = [], o = [];
  for (let r = 0; r < 8; r++)
    for (let a = 0; a < 8; a++)
      if (e[r][a]?.[0] === t) {
        n.push(...draughtsCaptures(e, a, r));
        const s = e[r][a][1] === 'D' ? [
          -1,
          1
        ] : [t === 'w' ? -1 : 1];
        for (const t of s)
          for (const n of [
              -1,
              1
            ])
            if (inside(a + n, r + t) && !e[r + t][a + n])
              o.push({
                sx: a,
                sy: r,
                tx: a + n,
                ty: r + t
              });
      }
  return n.length ? n : o;
}

export function draughtsApply(e, t, r) {
  const n = e.board.map(e => e.slice()), o = n[t.sy][t.sx], a = Math.abs(t.tx - t.sx) === 2;
  n[t.sy][t.sx] = '';
  if (a)
    n[(t.sy + t.ty) / 2][(t.sx + t.tx) / 2] = '';
  const s = o[1] === 'M' && t.ty === (r === 'w' ? 0 : 7);
  n[t.ty][t.tx] = s ? r + 'D' : o;
  const i = a && !s && draughtsCaptures(n, t.tx, t.ty).length ? {
    x: t.tx,
    y: t.ty
  } : null;
  return {
    board: n,
    chain: i,
    nextColor: i ? r : opposite(r),
    capture: a,
    promotion: s,
    man: o[1] === 'M'
  };
}

export function draughtsWinner(e, t) {
  return draughtsMoves(e, t).length ? null : opposite(t);
}

export function clickDraughts(e, t) {
  const r = draughtsMoves(board, turn, forcedCapture);
  if (selected) {
    const n = r.find(r => r.sx === selected.x && r.sy === selected.y && r.tx === e && r.ty === t);
    if (n) {
      playVariantMove(n);
      return;
    }
  }
  if (forcedCapture) {
    setHint('連続取りです\u3002光っている移動先を選んでください\u3002');
    return;
  }
  if (board[t][e]?.[0] === turn && r.some(r => r.sx === e && r.sy === t)) {
    set_selected(selected?.x === e && selected?.y === t ? null : {
      x: e,
      y: t
    });
    setHint('');
    drawBoard();
  } else
    setHint(r.some(e => e.capture) ? '取れる駒があります\u3002捕獲できる駒を選んでください\u3002' : '動かせる自分の駒を選んでください\u3002');
}
