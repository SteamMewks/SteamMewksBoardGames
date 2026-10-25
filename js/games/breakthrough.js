import { board, inside, opposite, turn } from '../core/state.js';
import { levelConfig, serializeWorkerFunctions } from '../core/ai.js';

export function breakthroughEvaluate(e) {
  let t = 0;
  for (let r = 0; r < 8; r++)
    for (let n = 0; n < 8; n++) {
      const o = e[r][n];
      if (!o)
        continue;
      const a = o[0] === 'b' ? r : 7 - r;
      let s = 100 + a * a * 6 + (3.5 - Math.abs(3.5 - n)) * 2;
      if (a === 6)
        s += 110;
      t += (o[0] === 'b' ? 1 : -1) * s;
    }
  return t;
}

export function breakthroughQuality(e, t) {
  const r = e.board[t.sy][t.sx][0], n = opposite(r), o = r === 'b' ? 1 : -1;
  const a = breakthroughMoves(e.board, r);
  let s = -1 / 0, i = -1 / 0;
  for (const l of a) {
    const a = breakthroughNext(e.board, l);
    let u = breakthroughWinner(a, n) === r ? 100000 : o * breakthroughEvaluate(a);
    if (u < 100000) {
      const e = breakthroughMoves(a, n);
      let t = u;
      for (const s of e) {
        const e = breakthroughNext(a, s);
        t = Math.min(t, breakthroughWinner(e, r) === n ? -100000 : o * breakthroughEvaluate(e));
      }
      u = u * 0.5 + t * 0.5;
    }
    s = Math.max(s, u);
    if (l.sx === t.sx && l.sy === t.sy && l.tx === t.tx && l.ty === t.ty)
      i = u;
  }
  const l = s - i;
  return l <= 40 ? 1 : l <= 120 ? 0.7 : l <= 240 ? 0.35 : 0;
}

export function breakthroughChoose(e, t, r = Math.random, n = 'b') {
  const o = opposite(n), a = n === 'b' ? 1 : -1;
  const s = levelConfig(t), i = Date.now() + s.budget;
  let l = 0, u = 0;
  const c = {};
  function search(e, t, r, o, u, d) {
    if (++l > s.nodes || Date.now() > i)
      throw c;
    const f = breakthroughWinner(e, t);
    if (f)
      return f === n ? 100000 - d : -100000 + d;
    if (!r)
      return a * breakthroughEvaluate(e);
    const m = breakthroughMoves(e, t).sort((t, r) => Number(!!e[r.ty][r.tx]) - Number(!!e[t.ty][t.tx]));
    let h = t === n ? -1 / 0 : 1 / 0;
    for (const a of m) {
      const s = search(breakthroughNext(e, a), opposite(t), r - 1, o, u, d + 1);
      if (t === n) {
        h = Math.max(h, s);
        o = Math.max(o, h);
      } else {
        h = Math.min(h, s);
        u = Math.min(u, h);
      }
      if (u <= o)
        break;
    }
    return h;
  }
  const d = breakthroughMoves(e.board, n);
  if (!d.length)
    return {
      move: null,
      depth: 0,
      nodes: l
    };
  let f = d.map(t => {
    const r = breakthroughNext(e.board, t);
    return {
      m: t,
      b: r,
      score: breakthroughWinner(r, o) === n ? 99999 : a * breakthroughEvaluate(r)
    };
  });
  const m = f.find(e => e.score === 99999);
  if (m)
    return {
      move: m.m,
      depth: 1,
      nodes: l
    };
  for (let e = 1; e <= s.depth; e++) {
    let t = [];
    try {
      for (const r of f)
        t.push(search(r.b, o, e - 1, -1 / 0, 1 / 0, 1));
    } catch (e) {
      if (e !== c)
        throw e;
      break;
    }
    f = f.map((e, r) => ({
      ...e,
      score: t[r]
    })).sort((e, t) => t.score - e.score);
    u = e;
  }
  const h = Math.max(...f.map(e => e.score)), p = r() < s.error;
  const g = f.filter(e => e.score >= h - (p ? 200 : s.noise));
  const y = g.map(e => ({
    ...e,
    rank: e.score + (r() - 0.5) * s.noise
  })).sort((e, t) => t.rank - e.rank);
  const v = p ? y[Math.floor(r() * Math.min(4, y.length))] : y[0];
  return {
    move: v.m,
    depth: u,
    nodes: l
  };
}

export function breakthroughWorkerSource() {
  const e = {
    opposite: opposite,
    inside: inside,
    breakthroughCanMove: breakthroughCanMove,
    breakthroughMoves: breakthroughMoves,
    breakthroughNext: breakthroughNext,
    breakthroughWinner: breakthroughWinner,
    breakthroughEvaluate: breakthroughEvaluate,
    breakthroughQuality: breakthroughQuality,
    breakthroughChoose: breakthroughChoose,
    levelConfig: levelConfig
  };
  return serializeWorkerFunctions(e) + `\n onmessage=event=>{try{const {state,level,before,ai='b'}=event.data;const quality=before?breakthroughQuality(before.state,before.move):null;postMessage({result:breakthroughChoose(state,level,Math.random,ai),quality});}catch(error){postMessage({error:String(error)});}};`;
}

export function breakthroughInitial() {
  return [
    Array(8).fill('bP'),
    Array(8).fill('bP'),
    ...Array.from({ length: 4 }, () => Array(8).fill('')),
    Array(8).fill('wP'),
    Array(8).fill('wP')
  ];
}

export function breakthroughCanMove(e, t, r, n, o) {
  if (!inside(e, t) || !inside(r, n))
    return false;
  const a = o[t][e];
  if (!a)
    return false;
  const s = r - e, i = n - t, l = a[0] === 'w' ? -1 : 1, u = o[n][r];
  return i === l && Math.abs(s) <= 1 && (!s ? !u : !u || u[0] !== a[0]);
}

export function breakthroughMoves(e, t) {
  const r = [], n = t === 'w' ? -1 : 1;
  for (let o = 0; o < 8; o++)
    for (let a = 0; a < 8; a++)
      if (e[o][a]?.[0] === t)
        for (const t of [
            -1,
            0,
            1
          ])
          if (breakthroughCanMove(a, o, a + t, o + n, e))
            r.push({
              sx: a,
              sy: o,
              tx: a + t,
              ty: o + n
            });
  return r;
}

export function breakthroughNext(e, t) {
  const r = e.map(e => e.slice());
  r[t.ty][t.tx] = r[t.sy][t.sx];
  r[t.sy][t.sx] = '';
  return r;
}

export function breakthroughWinner(e, t = null) {
  if (e[0].some(e => e === 'wP'))
    return 'w';
  if (e[7].some(e => e === 'bP'))
    return 'b';
  let r = 0, n = 0;
  for (const t of e)
    for (const e of t) {
      if (e === 'wP')
        r++;
      if (e === 'bP')
        n++;
    }
  if (!r)
    return 'b';
  if (!n)
    return 'w';
  if (t && !breakthroughMoves(e, t).length)
    return opposite(t);
  return null;
}

export function breakthroughEnding() {
  const e = breakthroughWinner(board, turn);
  return e ? '突破戦終了\uFF01 ' + (e === 'w' ? '白' : '黒') + 'の勝ち' : '';
}
