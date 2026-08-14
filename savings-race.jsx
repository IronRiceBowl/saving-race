import React, { useState, useEffect, useRef } from "react";

// ---------- Config ----------
const YEARS = 20;
const AGE_START = 22;
const AGE_END = AGE_START + YEARS;
const INCOME = 4000;
const RAISE = 0.05;
const INFLATION = 0.02;
const FIRE_MULT = 25;
const START_JOY = 50;
const JOY_FLOOR = 30;
const JOY_WARN = 40;
const JOY_DRIFT = 7;
const BOT_FUN = 800;
const BOT_FUN_JOY = 4;
const EXP_TRICKLE = 1;
const MILE_JOY = 3;
const IMPULSE_PREMIUM = 1.5;
const TWIN = { name: "Trip abroad", cost: 4000, type: "exp", joy: 12, emoji: "✈️" };
const TWIN_Y1 = 2;
const TWIN_Y2 = 14;
const HOUSE_Y = 9;
const HOUSE_DOWN = 60000;
const HOME_GROWTH = 0.03;
const FAMILY_Y = 11;
const FAMILY_MONTHLY = 800;
const FAMILY_JOY = 2;
const CAR_YEARS = [5, 10, 15];
const CAR_COSTS = [16000, 18000, 20000];
const CAR_JOY = 12;

const infl = (y) => Math.pow(1 + INFLATION, y);
const nom = (base, y) => base * infl(y);

const TIERS = [
  { id: "frugal", name: "Frugal", spend: 2200, joy: 3, desc: "Basics covered, few extras" },
  { id: "comfortable", name: "Comfortable", spend: 2800, joy: 4, desc: "Some treats, some hobbies" },
  { id: "premium", name: "Premium", spend: 3400, joy: 5, desc: "Nice things, often" },
];
const MIXES = {
  etf: { cash: 0, etf: 1, stock: 0 },
  mix: { cash: 0, etf: 0.5, stock: 0.5 },
  stock: { cash: 0, etf: 0, stock: 1 },
  cash: { cash: 1, etf: 0, stock: 0 },
  safe: { cash: 0.5, etf: 0.5, stock: 0 },
};
const ALLOCS = [
  { id: "etf", name: "Steady ETF", mix: MIXES.etf, hint: "A slice of everything. Bumpy, reliable over time." },
  { id: "mix", name: "Half & half", mix: MIXES.mix, hint: "Half ETF, half one hot stock. More thrill, more risk." },
  { id: "stock", name: "All-in one stock", mix: MIXES.stock, hint: "One company. Could soar. Could crater." },
  { id: "cash", name: "Cash only", mix: MIXES.cash, hint: "Never drops. Never grows. Inflation eats it." },
];
const SMALL_TEMPTATIONS = [
  { name: "New game console", cost: 650, type: "stuff", joy: 15, emoji: "🎮" },
  { name: "Limited sneakers", cost: 260, type: "stuff", joy: 10, emoji: "👟" },
  { name: "Latest phone", cost: 1400, type: "stuff", joy: 16, emoji: "📱" },
  { name: "Gaming PC upgrade", cost: 2200, type: "stuff", joy: 17, emoji: "🖥️" },
  { name: "Concert weekend", cost: 480, type: "exp", joy: 8, emoji: "🎸" },
  { name: "E-bike", cost: 1900, type: "stuff", joy: 14, emoji: "🚲" },
  { name: "Ski week", cost: 1600, type: "exp", joy: 10, emoji: "🎿" },
  { name: "New TV + sound", cost: 1200, type: "stuff", joy: 12, emoji: "📺" },
  { name: "Festival with friends", cost: 700, type: "exp", joy: 9, emoji: "🎪" },
  { name: "Drone + camera kit", cost: 950, type: "stuff", joy: 12, emoji: "📷" },
];
const BURNOUT_POOL = SMALL_TEMPTATIONS.filter((t) => t.type === "stuff" && t.cost >= 900);
const EARLY_CREEP = { name: "Nicer apartment", monthly: 400, joy: 2, emoji: "🏢", blurb: "More space, better area." };
const ROUTINE_CREEPS = [
  { name: "Weekend fine dining", monthly: 400, joy: 2, emoji: "🍣", blurb: "You've earned it — every weekend now." },
  { name: "Season tickets + concert habit", monthly: 180, joy: 1, emoji: "🎫", blurb: "Remember when a concert was a splurge? Now it's a lifestyle." },
  { name: "Two real vacations, every year", monthly: 350, joy: 2, emoji: "🏖️", blurb: "Not a trip — a standing tradition." },
  { name: "Golf club membership", monthly: 300, joy: 2, emoji: "⛳", blurb: "Where the deals supposedly happen." },
  { name: "Premium everything", monthly: 120, joy: 1, emoji: "📦", blurb: "Every subscription, top tier, forever." },
];
const MILE_LABELS = ["Six months of expenses saved!", "$100K — the first one is the hardest", "$250K — the snowball is rolling"];

// ---------- Helpers ----------
const fmt = (n) => {
  const v = Math.round(n);
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1000000) return sign + "$" + (a / 1000000).toFixed(2) + "M";
  if (a >= 10000) return sign + "$" + Math.round(a / 1000) + "K";
  if (a >= 1000) return sign + "$" + (a / 1000).toFixed(1) + "K";
  return sign + "$" + a;
};
const fmtFull = (n) => "$" + Math.round(n).toLocaleString();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const incomeAt = (y) => INCOME * Math.pow(1 + RAISE, y);
const expOf = (mix) => mix.cash * 0.015 + mix.etf * 0.07 + mix.stock * 0.1;
const retOf = (mix, m) => mix.cash * m.cash + mix.etf * m.etf + mix.stock * m.stock;
const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function freedomAgeEstimate(t) {
  let net = 0;
  for (let y = 0; y < 45; y++) {
    const spendBase = t.spend + (y >= FAMILY_Y ? FAMILY_MONTHLY : 0);
    const spendNow = spendBase * infl(y);
    net = net * 1.07 + (incomeAt(y) - spendNow) * 12;
    if (net >= spendNow * 12 * FIRE_MULT) return AGE_START + y + 1;
  }
  return null;
}

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return clamp(Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), -2.2, 2.2);
}

function genMarket() {
  const yrs = [];
  let bump = 0;
  for (let i = 0; i < YEARS; i++) {
    const z = gauss();
    const etf = Math.max(-0.45, 0.07 + bump + 0.12 * z);
    let stock = 0.1 + bump + 0.25 * z + 0.2 * gauss();
    let wipe = false;
    if (Math.random() < 0.02) { stock = -0.8; wipe = true; }
    stock = clamp(stock, -0.85, 0.9);
    yrs.push({ cash: 0.015, etf, stock, wipe });
    bump = etf < -0.15 ? 0.06 : bump > 0.03 ? 0.03 : 0;
  }
  return yrs;
}

function genEvents() {
  const smalls = [...SMALL_TEMPTATIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  const routines = [...ROUTINE_CREEPS].sort(() => Math.random() - 0.5).slice(0, 2);
  const map = {};
  map[TWIN_Y1] = { ...TWIN, kind: "buy", twin: 1 };
  map[TWIN_Y2] = { ...TWIN, kind: "buy", twin: 2 };
  map[4] = { ...EARLY_CREEP, kind: "creep" };
  CAR_YEARS.forEach((y, i) => (map[y] = { kind: "car", cost: CAR_COSTS[i], nth: i + 1, emoji: "🚗" }));
  map[HOUSE_Y] = { kind: "house", emoji: "🏠" };
  map[FAMILY_Y] = { kind: "family", emoji: "👨‍👩‍👧" };
  map[1] = { ...smalls[0], kind: "buy" };
  map[3] = { ...smalls[1], kind: "buy" };
  const lateTeens = [6, 7, 8].sort(() => Math.random() - 0.5);
  map[lateTeens[0]] = { ...smalls[2], kind: "buy" };
  const thirties = [12, 13, 16, 17, 18].sort(() => Math.random() - 0.5);
  map[thirties[0]] = { ...routines[0], kind: "creep", routine: true };
  map[thirties[1]] = { ...routines[1], kind: "creep", routine: true };
  return map;
}

function freshSim(startMix, startName) {
  return {
    yearIdx: 0,
    p: { cash: 0, etf: 0, stock: 0 },
    bot: 0,
    pHome: 0, botHome: 0,
    pSeries: [0], botSeries: [0],
    pJoy: START_JOY, botJoy: START_JOY,
    pJoySeries: [START_JOY], botJoySeries: [START_JOY],
    expCount: 0, crossedP: 0, crossedB: 0,
    purchases: [], creeps: [], cars: [], reactions: [], burnouts: 0,
    lastCarYear: 0,
    house: null, famDone: false,
    spendAdd: 0, creepJoy: 0,
    curMix: { ...startMix }, curName: startName,
    freedomAgeP: null, freedomAgeB: null,
    crashPendingYear: null, fomoPendingYear: null,
    panicInfo: null,
    fomoDone: false, glideDone: false, panicDone: false,
    pendingEvent: null, pendingBurnout: null, pendingReaction: null, flash: null,
  };
}

const CountUp = ({ value, fmtFn = fmt }) => {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current, to = value;
    prev.current = value;
    if (from === to) return;
    if (reducedMotion()) { setDisp(to); return; }
    const t0 = performance.now(), dur = 550;
    let raf;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisp(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{fmtFn(disp)}</span>;
};

const useArmed = (key) => {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    setArmed(false);
    const t = setTimeout(() => setArmed(true), 350);
    return () => clearTimeout(t);
  }, [key]);
  return armed;
};

// ---------- Main ----------
export default function SavingsRace() {
  const [phase, setPhase] = useState("setup");
  const [tier, setTier] = useState(TIERS[1]);
  const [alloc, setAlloc] = useState(ALLOCS[0]);
  const [market, setMarket] = useState(() => genMarket());
  const [events, setEvents] = useState(() => genEvents());
  const [runs, setRuns] = useState([]);
  const sim = useRef(freshSim(ALLOCS[0].mix, ALLOCS[0].name));
  const [tick, setTick] = useState(0);
  const force = () => setTick((t) => t + 1);

  const informed = runs.length >= 1;
  const spendBaseP = () => tier.spend + sim.current.spendAdd;
  const spendBaseB = () => tier.spend + (sim.current.famDone ? FAMILY_MONTHLY : 0);
  const spendNowP = (y) => spendBaseP() * infl(y);
  const spendNowB = (y) => spendBaseB() * infl(y);
  const surplusP = (y) => (incomeAt(y) - spendNowP(y)) * 12;
  const surplusBot = (y) => (incomeAt(y) - spendNowB(y)) * 12;
  const freedomPAt = (y) => spendNowP(y) * 12 * FIRE_MULT;
  const freedomBAt = (y) => spendNowB(y) * 12 * FIRE_MULT;
  const invP = () => sim.current.p.cash + sim.current.p.etf + sim.current.p.stock;
  const milestones = [tier.spend * 6, 100000, 250000];

  const modalKey = (() => {
    const s = sim.current;
    if (s.pendingEvent) return "ev" + s.pendingEvent.year + (s.pendingEvent.kind || "");
    if (s.pendingReaction) return "rx" + s.pendingReaction.year + s.pendingReaction.type;
    if (s.pendingBurnout) return "bo" + s.pendingBurnout.year;
    return "none";
  })();
  const armed = useArmed(modalKey);

  const startRun = (newMarket, newEvents) => {
    if (newMarket) setMarket(genMarket());
    if (newEvents) setEvents(genEvents());
    sim.current = freshSim(alloc.mix, alloc.name);
    setPhase("play");
  };

  const cardFuture = (nomCost, y) => nomCost * Math.pow(1 + expOf(sim.current.curMix), YEARS - y - 1);
  const grownCost = (nomCost, fromYear) => {
    let v = nomCost;
    for (let y = fromYear + 1; y < YEARS; y++) v *= 1 + retOf(alloc.mix, market[y]);
    return v;
  };
  const creepTotalCost = (monthlyBase, fromYear) => {
    let t = 0;
    for (let y = fromYear; y < YEARS; y++) t += grownCost(nom(monthlyBase, y) * 12, y);
    return t;
  };
  const growVal = (v0, mix, from, to) => {
    let v = v0;
    for (let y = from; y < to; y++) v *= 1 + retOf(mix, market[y]);
    return v;
  };
  const freedomDelay = (endCost) => {
    const s = sim.current;
    const inv = Math.max(s.p.cash + s.p.etf + s.p.stock, 1);
    const monthly = (inv * expOf(alloc.mix) + surplusP(YEARS - 1)) / 12;
    return Math.max(1, Math.round(endCost / monthly));
  };

  const shiftEvent = (y) => {
    if (!events[y]) return;
    setEvents((prev) => {
      const nx = { ...prev };
      let t = y + 1;
      while (nx[t] && t < YEARS) t++;
      if (t < YEARS) nx[t] = nx[y];
      delete nx[y];
      return nx;
    });
  };

  const processYear = (y, boughtCost, boughtJoy, isExp) => {
    const s = sim.current;
    const m = market[y];
    const surY = surplusP(y);
    let b = {
      cash: s.p.cash * (1 + m.cash),
      etf: s.p.etf * (1 + m.etf),
      stock: s.p.stock * (1 + m.stock),
    };
    const contrib = surY - boughtCost;
    if (contrib >= 0) {
      b.cash += contrib * s.curMix.cash;
      b.etf += contrib * s.curMix.etf;
      b.stock += contrib * s.curMix.stock;
    } else {
      const need = -contrib;
      const tot = b.cash + b.etf + b.stock;
      if (tot > 0) {
        const f = Math.min(1, need / tot);
        b = { cash: b.cash * (1 - f), etf: b.etf * (1 - f), stock: b.stock * (1 - f) };
      }
    }
    s.p = b;
    if (s.pHome > 0) s.pHome *= 1 + HOME_GROWTH;
    if (s.botHome > 0) s.botHome *= 1 + HOME_GROWTH;
    const invNow = b.cash + b.etf + b.stock;
    const netP = invNow + s.pHome;
    s.pSeries.push(netP);
    s.bot = s.bot * (1 + m.etf) + (surplusBot(y) - nom(BOT_FUN, y));
    s.botSeries.push(s.bot + s.botHome);
    const wasFree = !!s.freedomAgeP;
    if (!s.freedomAgeP && invNow >= freedomPAt(y)) s.freedomAgeP = AGE_START + y + 1;
    if (!s.freedomAgeB && s.bot >= freedomBAt(y)) s.freedomAgeB = AGE_START + y + 1;
    if (isExp) s.expCount += 1;
    let pj = s.pJoy + tier.joy + s.creepJoy - JOY_DRIFT + boughtJoy + s.expCount * EXP_TRICKLE;
    const prevCrossed = s.crossedP;
    while (s.crossedP < milestones.length && netP >= milestones[s.crossedP]) { pj += MILE_JOY; s.crossedP++; }
    s.pJoy = clamp(pj, 0, 100);
    s.pJoySeries.push(s.pJoy);
    let bj = s.botJoy + tier.joy + (s.famDone ? FAMILY_JOY : 0) - JOY_DRIFT + BOT_FUN_JOY;
    while (s.crossedB < milestones.length && (s.bot + s.botHome) >= milestones[s.crossedB]) { bj += MILE_JOY; s.crossedB++; }
    s.botJoy = clamp(bj, 0, 100);
    s.botJoySeries.push(s.botJoy);
    const invested = b.etf + b.stock;
    if (m.etf < -0.15 && invested > 5000 && !s.panicDone) s.crashPendingYear = y + 1;
    if (m.stock > 0.4 && !m.wipe && !s.fomoDone && s.curMix.stock < 0.99 && invNow > 5000) s.fomoPendingYear = y + 1;
    if (!wasFree && s.freedomAgeP) s.flash = { text: `You hit your freedom number at ${s.freedomAgeP}! 🏁`, kind: "free" };
    else if (m.etf < -0.08) s.flash = { text: `Markets fell ${Math.round(-m.etf * 100)}% 📉`, kind: "down" };
    else if (m.wipe && s.curMix.stock > 0) s.flash = { text: "Your stock crashed 80% 💥", kind: "down" };
    else if (s.crossedP > prevCrossed) s.flash = { text: "⭐ " + MILE_LABELS[s.crossedP - 1], kind: "mile" };
    else if (m.etf > 0.16) s.flash = { text: `Markets jumped +${Math.round(m.etf * 100)}% 📈`, kind: "up" };
    else s.flash = null;
    s.yearIdx = y + 1;
    force();
  };

  const projectAge = () => {
    const s = sim.current;
    if (s.freedomAgeP) return s.freedomAgeP;
    let net = s.p.cash + s.p.etf + s.p.stock;
    for (let y = YEARS; y < YEARS + 26; y++) {
      net = net * (1 + expOf(s.curMix)) + surplusP(y);
      if (net >= freedomPAt(y)) return AGE_START + y + 1;
    }
    return null;
  };

  useEffect(() => {
    if (phase !== "play") return;
    const s = sim.current;
    if (s.yearIdx >= YEARS) {
      const t = setTimeout(() => {
        setRuns((r) => [...r, {
          diff: s.pSeries[YEARS] - s.botSeries[YEARS],
          won: s.pSeries[YEARS] >= s.botSeries[YEARS],
          burnouts: s.burnouts,
          freedomAge: s.freedomAgeP,
          projAge: projectAge(),
        }]);
        setPhase("debrief");
      }, 900);
      return () => clearTimeout(t);
    }
    if (s.pendingEvent || s.pendingBurnout || s.pendingReaction) return;
    const y = s.yearIdx;
    const inv = invP();
    if (s.pJoy < JOY_FLOOR) {
      const item = BURNOUT_POOL[Math.floor(Math.random() * BURNOUT_POOL.length)];
      s.pendingBurnout = { ...item, cost: Math.round(nom(item.cost, y) * IMPULSE_PREMIUM), year: y };
      force(); return;
    }
    if (s.crashPendingYear === y && !s.panicDone) {
      s.pendingReaction = { type: "panic", year: y };
      shiftEvent(y); force(); return;
    }
    if (s.panicInfo && !s.panicInfo.reentered && y >= s.panicInfo.reentryYear) {
      let up = 1;
      for (let k = s.panicInfo.year; k < y; k++) up *= 1 + market[k].etf;
      s.pendingReaction = { type: "reentry", year: y, upPct: Math.round((up - 1) * 100) };
      shiftEvent(y); force(); return;
    }
    if (s.fomoPendingYear === y && !s.fomoDone) {
      s.fomoPendingYear = null;
      s.pendingReaction = { type: "fomo", year: y };
      shiftEvent(y); force(); return;
    }
    if (!s.glideDone && inv >= 0.8 * freedomPAt(y) && AGE_START + y < 40 && (s.curMix.etf + s.curMix.stock) > 0.5) {
      s.pendingReaction = { type: "glide", year: y };
      shiftEvent(y); force(); return;
    }
    const ev = events[y];
    if (ev) {
      if (ev.kind === "creep" && (incomeAt(y) - spendNowP(y) - nom(ev.monthly, y)) * 12 < 1200) {
        // would sink surplus — skip
      } else {
        s.pendingEvent = { ...ev, year: y };
        force(); return;
      }
    }
    const t = setTimeout(() => processYear(y, 0, 0, false), 1150);
    return () => clearTimeout(t);
  }, [phase, tick, events, market, alloc, tier]); // eslint-disable-line

  const answerEvent = (accept) => {
    const s = sim.current;
    const ev = s.pendingEvent;
    s.pendingEvent = null;
    if (ev.kind === "creep") {
      if (accept) {
        const oldF = freedomPAt(ev.year);
        s.spendAdd += ev.monthly;
        s.creepJoy += ev.joy;
        s.creeps.push({ ...ev });
        s.flash = { text: `Your freedom number just moved: ${fmt(oldF)} → ${fmt(freedomPAt(ev.year))}`, kind: "down" };
      }
      processYear(ev.year, 0, 0, false);
      return;
    }
    if (ev.kind === "car") {
      const nomCost = Math.round(nom(ev.cost, ev.year));
      s.cars.push({ year: ev.year, cost: nomCost, bought: accept, nth: ev.nth, carAge: ev.year - s.lastCarYear });
      if (accept) s.lastCarYear = ev.year;
      processYear(ev.year, accept ? nomCost : 0, accept ? CAR_JOY : 0, false);
      return;
    }
    if (ev.kind === "house") {
      const down = Math.round(nom(HOUSE_DOWN, ev.year));
      const inv = invP();
      if (accept && inv >= down) {
        const f = down / inv;
        s.p = { cash: s.p.cash * (1 - f), etf: s.p.etf * (1 - f), stock: s.p.stock * (1 - f) };
        s.pHome = down;
        s.bot -= down;
        s.botHome = down;
        s.house = { year: ev.year, bought: true, down };
      } else {
        s.house = { year: ev.year, bought: false, locked: inv < down, down };
      }
      processYear(ev.year, 0, 0, false);
      return;
    }
    if (ev.kind === "family") {
      const oldF = freedomPAt(ev.year);
      s.famDone = true;
      s.spendAdd += FAMILY_MONTHLY;
      s.creepJoy += FAMILY_JOY;
      s.flash = { text: `Both freedom numbers moved: yours ${fmt(oldF)} → ${fmt(freedomPAt(ev.year))}`, kind: "down" };
      processYear(ev.year, 0, 0, false);
      return;
    }
    const nomCost = Math.round(nom(ev.cost, ev.year));
    if (accept) s.purchases.push({ ...ev, cost: nomCost });
    processYear(ev.year, accept ? nomCost : 0, accept ? ev.joy : 0, accept && ev.type === "exp");
  };

  const resolveBurnout = () => {
    const s = sim.current;
    const ev = s.pendingBurnout;
    s.pendingBurnout = null;
    s.purchases.push({ ...ev, burnout: true });
    s.burnouts += 1;
    processYear(ev.year, ev.cost, ev.joy, false);
  };

  const answerReaction = (act) => {
    const s = sim.current;
    const r = s.pendingReaction;
    s.pendingReaction = null;
    const total = invP();
    if (r.type === "panic") {
      s.panicDone = true;
      s.crashPendingYear = null;
      if (act) {
        s.p = { cash: total, etf: 0, stock: 0 };
        s.curMix = { ...MIXES.cash };
        s.curName = "Cash (after panic)";
        s.panicInfo = { year: r.year, value: total, reentryYear: r.year + 2 + (Math.random() < 0.5 ? 0 : 1), reentered: false };
        s.reactions.push({ type: "panic", year: r.year, value: total, sold: true });
      } else {
        s.reactions.push({ type: "panic", year: r.year, value: total, sold: false });
      }
    } else if (r.type === "reentry") {
      s.panicInfo.reentered = true;
      if (act) {
        s.p = { cash: total * alloc.mix.cash, etf: total * alloc.mix.etf, stock: total * alloc.mix.stock };
        s.curMix = { ...alloc.mix };
        s.curName = alloc.name;
        s.reactions.push({ type: "reentry", year: r.year, upPct: r.upPct, back: true });
      } else {
        s.reactions.push({ type: "reentry", year: r.year, upPct: r.upPct, back: false });
      }
    } else if (r.type === "fomo") {
      s.fomoDone = true;
      if (act) {
        s.p = { cash: 0, etf: 0, stock: total };
        s.curMix = { ...MIXES.stock };
        s.curName = "All-in one stock (FOMO)";
        s.reactions.push({ type: "fomo", year: r.year, value: total, chased: true });
      } else {
        s.reactions.push({ type: "fomo", year: r.year, value: total, chased: false });
      }
    } else if (r.type === "glide") {
      s.glideDone = true;
      if (act) {
        const target = s.curMix.stock > 0 ? MIXES.etf : MIXES.safe;
        s.p = { cash: total * target.cash, etf: total * target.etf, stock: total * target.stock };
        s.curMix = { ...target };
        s.curName = s.curMix.cash > 0 ? "Half cash, half ETF (protected)" : "Steady ETF (protected)";
        s.reactions.push({ type: "glide", year: r.year, protected: true });
      } else {
        s.reactions.push({ type: "glide", year: r.year, protected: false });
      }
    }
    processYear(r.year, 0, 0, false);
  };

  // ---------- styles: sticker-pop arcade ----------
  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Nunito:wght@600;700;800;900&family=Spline+Sans+Mono:wght@600;700&display=swap');
  .sr-root { --paper:#FFF1CE; --ink:#2A2440; --card:#FFFFFF;
    --steady:#17A05E; --impulse:#FF4D5E; --bot:#6C7BD9; --gold:#FFB300; --faint:#7B7490;
    min-height:100vh; background:var(--paper); color:var(--ink); font-family:'Nunito',system-ui,sans-serif;
    display:flex; justify-content:center; }
  .sr-root * { box-sizing:border-box; }
  .mono { font-family:'Spline Sans Mono',monospace; font-variant-numeric:tabular-nums; }
  .sr-shell { width:100%; max-width:420px; padding:18px 16px 100px; }
  .sr-title { font-family:'Lilita One',sans-serif; font-size:38px; line-height:1; margin:6px 0 6px; letter-spacing:.01em;
    text-shadow:3px 3px 0 var(--gold); }
  .sr-sub { font-size:14px; font-weight:700; color:var(--faint); margin-bottom:18px; line-height:1.45; }
  .sr-card { background:var(--card); border:2.5px solid var(--ink); border-radius:16px; padding:14px;
    box-shadow:4px 4px 0 var(--ink); margin-bottom:14px; }
  .sr-label { font-size:11px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; color:var(--faint); margin-bottom:8px; }
  .sr-opt { display:block; width:100%; text-align:left; border:2px solid var(--ink); background:#FDFBF4; border-radius:12px;
    padding:11px 12px; margin-bottom:9px; cursor:pointer; font-family:inherit; color:inherit; box-shadow:3px 3px 0 rgba(42,36,64,.18); }
  .sr-opt.sel { background:#E5F7EC; box-shadow:3px 3px 0 var(--steady); border-color:var(--steady); }
  .sr-opt .nm { font-weight:900; font-size:15px; }
  .sr-opt .ds { font-size:12.5px; font-weight:600; color:var(--faint); margin-top:2px; line-height:1.4; }
  .sr-opt .fr { font-family:'Spline Sans Mono',monospace; font-size:10.5px; font-weight:700; margin-top:7px; color:var(--ink);
    background:var(--paper); border:1.5px solid var(--ink); border-radius:8px; display:inline-block; padding:3px 8px; }
  .btn { border:2.5px solid var(--ink); border-radius:12px; padding:13px 14px; font-family:'Nunito',sans-serif; font-weight:900;
    font-size:14.5px; cursor:pointer; box-shadow:3px 3px 0 var(--ink); background:#fff; color:var(--ink); }
  .btn:active { transform:translate(3px,3px); box-shadow:none; }
  .btn:disabled { opacity:.45; cursor:not-allowed; }
  .btn.red { background:var(--impulse); color:#fff; }
  .btn.green { background:var(--steady); color:#fff; }
  .btn.ghost { background:#fff; }
  .btn.go { width:100%; background:var(--ink); color:var(--paper); font-size:17px; padding:15px; box-shadow:4px 4px 0 var(--gold); }
  .sr-btnrow { display:flex; gap:12px; }
  .sr-btnrow .btn { flex:1; }
  .sr-race { position:sticky; top:0; z-index:5; background:var(--paper); padding:8px 0 6px; margin-bottom:10px; }
  .sr-race.dim { opacity:.25; }
  .sr-board { background:var(--card); border:2.5px solid var(--ink); border-radius:16px; box-shadow:4px 4px 0 var(--ink); padding:12px; }
  .sr-year { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:6px; }
  .sr-year .big { font-family:'Lilita One',sans-serif; font-size:19px; }
  .sr-year .goal { font-family:'Spline Sans Mono',monospace; font-size:11px; font-weight:700; color:var(--faint); }
  .sr-progress { height:6px; background:#EFE9D6; border:1.5px solid var(--ink); border-radius:99px; margin-bottom:10px; overflow:hidden; }
  .sr-progress > div { height:100%; background:var(--gold); transition:width .8s; }
  .sr-lane { margin-bottom:9px; }
  .sr-lane .who { display:flex; justify-content:space-between; align-items:baseline; font-size:13px; font-weight:900; margin-bottom:3px; }
  .sr-lane .who .val { font-family:'Spline Sans Mono',monospace; font-size:14px; }
  .chip { font-size:9px; font-weight:900; border:1.5px solid currentColor; border-radius:6px; padding:0 5px; margin-left:6px; letter-spacing:.05em; vertical-align:2px; }
  .sr-track { height:18px; background:#EFE9D6; border:2px solid var(--ink); border-radius:99px; overflow:hidden; position:relative; }
  .sr-fill { height:100%; transition:width .8s cubic-bezier(.2,.8,.3,1); }
  .sr-goal { position:absolute; top:-3px; bottom:-3px; width:3px; background:var(--ink); transition:left .8s; }
  .sr-gap { text-align:center; font-size:12.5px; font-weight:900; margin-top:7px; }
  .sr-flash { text-align:center; font-weight:900; font-size:13px; border:2px solid var(--ink); border-radius:12px; padding:8px;
    margin-bottom:12px; animation:pop .25s; box-shadow:3px 3px 0 rgba(42,36,64,.18); }
  .sr-flash.down { background:#FFE1E4; }
  .sr-flash.up { background:#DCF5E7; }
  .sr-flash.mile { background:#FFF0C2; }
  .sr-flash.free { background:#DCF5E7; }
  @keyframes pop { from { transform:scale(.94); opacity:0 } to { transform:scale(1); opacity:1 } }
  @media (prefers-reduced-motion: reduce) {
    .sr-fill, .sr-goal, .sr-progress > div { transition:none; }
    .sr-flash, .sr-ev { animation:none; }
  }
  .sr-modal { position:fixed; inset:0; background:rgba(42,36,64,.55); display:flex; align-items:center; justify-content:center; z-index:20; padding:20px; }
  .sr-ev { background:var(--card); border:3px solid var(--ink); border-radius:20px; box-shadow:6px 6px 0 var(--ink);
    padding:20px; width:100%; max-width:340px; text-align:center; animation:pop .22s; }
  .sr-ev .em { font-size:52px; line-height:1.1; }
  .sr-ev h3 { font-family:'Lilita One',sans-serif; font-size:23px; margin:8px 0 2px; }
  .sr-ev .age { font-size:11.5px; font-weight:800; letter-spacing:.06em; color:var(--faint); text-transform:uppercase; }
  .sr-ev .price { font-family:'Spline Sans Mono',monospace; font-size:26px; font-weight:700; margin:8px 0 4px; }
  .sr-ev .note { font-size:13.5px; font-weight:600; color:var(--faint); margin-bottom:12px; line-height:1.45; }
  .sr-ev .tag { font-family:'Spline Sans Mono',monospace; font-size:11px; font-weight:700; background:var(--paper);
    border:2px dashed var(--ink); border-radius:10px; padding:8px; margin-bottom:12px; }
  .sr-ev .warn { font-size:12.5px; font-weight:800; color:#8A5B00; background:#FFF0C2; border:1.5px solid #D9A83B; border-radius:10px; padding:7px; margin-bottom:12px; }
  .sr-ev.burn { border-color:var(--impulse); box-shadow:6px 6px 0 var(--impulse); }
  .sr-ev.calm { border-color:var(--steady); box-shadow:6px 6px 0 var(--steady); }
  .sr-joyrow { display:flex; justify-content:space-between; align-items:baseline; }
  .sr-joyrow .val { font-family:'Spline Sans Mono',monospace; font-weight:700; font-size:14px; }
  .sr-joybar { height:14px; background:#EFE9D6; border:2px solid var(--ink); border-radius:99px; position:relative; overflow:hidden; margin-top:7px; }
  .sr-joyfill { height:100%; transition:width .6s, background .6s; }
  .sr-floor { position:absolute; top:-3px; bottom:-3px; width:3px; background:var(--impulse); left:${JOY_FLOOR}%; }
  .sr-danger { font-size:12.5px; font-weight:800; color:var(--impulse); margin-top:7px; }
  .sr-chart { width:100%; height:auto; }
  .sr-legend { display:flex; gap:14px; font-size:11.5px; font-weight:800; margin-top:6px; flex-wrap:wrap; }
  .sr-dot { display:inline-block; width:10px; height:10px; border:1.5px solid var(--ink); border-radius:3px; margin-right:5px; vertical-align:-1px; }
  .sr-line { display:flex; justify-content:space-between; gap:8px; font-size:12.5px; font-weight:600; padding:7px 0; border-bottom:2px dotted #E3DCC6; }
  .sr-line b { font-family:'Spline Sans Mono',monospace; white-space:nowrap; font-weight:700; }
  .neg { color:var(--impulse); } .pos { color:var(--steady); }
  .sr-small { font-size:12.5px; font-weight:600; color:var(--faint); line-height:1.5; }
  .stamp-wrap { text-align:center; padding:8px 0 4px; }
  .stamp { display:inline-block; font-family:'Lilita One',sans-serif; font-size:24px; letter-spacing:.03em;
    padding:10px 20px; border:3px solid var(--ink); border-radius:14px; transform:rotate(-3deg); background:var(--card); }
  .stamp.win { background:var(--steady); color:#fff; box-shadow:4px 4px 0 var(--ink); }
  .stamp.loss { background:var(--impulse); color:#fff; box-shadow:4px 4px 0 var(--ink); }
  .verdict-num { text-align:center; font-family:'Spline Sans Mono',monospace; font-weight:700; font-size:15px; margin:12px 0 6px; }
  .freescore { text-align:center; margin:10px 0 8px; }
  .freescore .pill { display:inline-block; font-family:'Lilita One',sans-serif; font-size:20px; letter-spacing:.02em;
    padding:8px 18px; border:2.5px solid var(--ink); border-radius:12px; background:var(--paper); box-shadow:3px 3px 0 var(--ink); }
  .freescore .pill.hit { background:var(--gold); }
  details.sec { border:2.5px solid var(--ink); border-radius:16px; background:var(--card); box-shadow:4px 4px 0 var(--ink); margin-bottom:14px; }
  details.sec > summary { list-style:none; cursor:pointer; padding:13px 14px; font-weight:900; font-size:14px;
    display:flex; justify-content:space-between; align-items:center; }
  details.sec > summary::-webkit-details-marker { display:none; }
  details.sec > summary:after { content:"+"; font-family:'Lilita One',sans-serif; font-size:19px; }
  details.sec[open] > summary:after { content:"–"; }
  details.sec > .inner { padding:0 14px 12px; border-top:2px dashed #E3DCC6; padding-top:10px; }
  .sr-replaybar { position:fixed; bottom:0; left:0; right:0; background:var(--paper); border-top:2.5px solid var(--ink);
    padding:10px 16px calc(10px + env(safe-area-inset-bottom)); display:flex; gap:10px; justify-content:center; z-index:15; }
  .sr-replaybar .btn { flex:1; max-width:150px; font-size:12.5px; padding:11px 8px; }
  .sr-runs div { padding:4px 0; font-size:12.5px; font-weight:700; }
  .sr-foot { text-align:center; font-size:10.5px; font-weight:700; line-height:1.6; color:var(--faint); margin-top:18px; }
  .sr-note { font-size:12px; font-weight:700; border:2px dashed var(--ink); border-radius:12px; padding:10px 12px;
    margin-bottom:14px; background:#FFFCF0; line-height:1.5; }
  .fineprint { font-size:12px; font-weight:600; color:var(--faint); line-height:1.6; }
  .fineprint b { color:var(--ink); }
  .fineprint p { margin:0 0 9px; }
  `;

  const Footer = () => (
    <div className="sr-foot">
      Educational simulation — not financial advice. Market returns are scripted, not predicted.
      <br />No taxes or registered accounts modelled. Your own numbers will differ.
    </div>
  );

  const JoyMeter = ({ joy }) => {
    const color = joy < JOY_FLOOR ? "var(--impulse)" : joy < JOY_WARN ? "#E8862E" : "var(--gold)";
    return (
      <div className="sr-card" style={{ paddingTop: 11, paddingBottom: 11 }}>
        <div className="sr-joyrow">
          <div className="sr-label" style={{ margin: 0 }}>Happiness</div>
          <div className="val">{joy < JOY_WARN ? "😩" : joy < 60 ? "🙂" : "😄"} {Math.round(joy)}</div>
        </div>
        <div className="sr-joybar">
          <div className="sr-joyfill" style={{ width: `${joy}%`, background: color }} />
          <div className="sr-floor" />
        </div>
        {joy < JOY_WARN && joy >= JOY_FLOOR && <div className="sr-danger">Running on empty — treat yourself soon or you'll crack!</div>}
      </div>
    );
  };

  const LineChart = ({ series, colors, markers, hline, hlineColor, zeroLine, yFmt = fmt, endLabel }) => {
    const W = 340, H = 186, L = 48, R = 14, T = 12, B = 22;
    const all = series.flat();
    let maxV = Math.max(...all, hline != null ? hline : -Infinity, 1);
    let minV = zeroLine ? Math.min(...all, 0) : 0;
    if (maxV === minV) maxV = minV + 1;
    const span = maxV - minV;
    const Y = (v) => T + (1 - (v - minV) / span) * (H - T - B);
    const X = (i, n) => L + (i * (W - L - R)) / (n - 1);
    const pts = (arr) => arr.map((v, i) => `${X(i, arr.length)},${Y(v)}`).join(" ");
    const yTicks = [...new Set([maxV, minV, minV < 0 && maxV > 0 ? 0 : (maxV + minV) / 2])];
    const n0 = series[0].length;
    const xTicks = [0, 5, 10, 15, 20].filter((t) => t < n0);
    const last = series[0][n0 - 1];
    const MONO = "'Spline Sans Mono',monospace";
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="sr-chart">
        {yTicks.map((v, i) => (
          <g key={"y" + i}>
            <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="#EFE7D0" strokeWidth="1.5" />
            <text x={L - 5} y={Y(v) + 3.5} textAnchor="end" fontSize="9" fontWeight="700" fill="#7B7490" fontFamily={MONO}>{yFmt(v)}</text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={"x" + t} x={X(t, n0)} y={H - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7B7490" fontFamily={MONO}>{AGE_START + t}</text>
        ))}
        {zeroLine && minV < 0 && <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} stroke="#7B7490" strokeWidth="1.5" strokeDasharray="3 4" />}
        {hline != null && (
          <g>
            <line x1={L} x2={W - R} y1={Y(hline)} y2={Y(hline)} stroke={hlineColor || "#2A2440"} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
            <text x={W - R} y={Y(hline) - 4} textAnchor="end" fontSize="9" fontWeight="700" fill={hlineColor || "#2A2440"} fontFamily={MONO}>{yFmt(hline)}</text>
          </g>
        )}
        {series.map((arr, i) => (
          <polyline key={i} points={pts(arr)} fill="none" stroke={colors[i]} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {endLabel && (
          <text x={X(n0 - 1, n0)} y={Y(last) + (last >= (maxV + minV) / 2 ? 14 : -8)} textAnchor="end" fontSize="10.5" fontWeight="700"
            fill={colors[0]} stroke="#fff" strokeWidth="3" paintOrder="stroke" fontFamily={MONO}>{yFmt(last)}</text>
        )}
        {markers && markers.map((m, i) => {
          const arr = series[0];
          const x = X(m.year + 1, arr.length);
          const y = Y(arr[m.year + 1] || 0);
          return <g key={i}><circle cx={x} cy={y} r="7" fill="#fff" stroke="#2A2440" strokeWidth="2" />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9">{m.emoji}</text></g>;
        })}
      </svg>
    );
  };

  // ---------- setup ----------
  if (phase === "setup") {
    return (
      <div className="sr-root"><style>{css}</style>
        <div className="sr-shell" style={{ paddingBottom: 40 }}>
          <div className="sr-title">SAVINGS RACE</div>
          <div className="sr-sub">You're 22 with your first paycheque. Twenty years against Steady-Bot — a copy of you with perfect discipline. Beat it, or hit your freedom number first. 🏁</div>

          <div className="sr-card">
            <div className="sr-label">Your income</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 24 }}>{fmtFull(INCOME)}<span style={{ fontSize: 13, color: "var(--faint)", fontFamily: "'Nunito'" }}> /mo at 22</span></div>
            <div className="sr-small" style={{ marginTop: 4 }}>Raises ~5%/yr. But prices rise ~2%/yr on everything — your lifestyle, every price tag, even your freedom number. The treadmill is real.</div>
          </div>

          <div className="sr-card">
            <div className="sr-label">Pick your lifestyle</div>
            {TIERS.map((t) => {
              const fa = freedomAgeEstimate(t);
              return (
                <button key={t.id} className={"sr-opt" + (tier.id === t.id ? " sel" : "")} onClick={() => setTier(t)}>
                  <div className="nm">{t.name} — <span className="mono">{fmtFull(t.spend)}/mo</span></div>
                  <div className="ds">{t.desc}. Leaves <b className="mono">{fmtFull(INCOME - t.spend)}/mo</b> to invest.</div>
                  <div className="fr">🏁 {fmt(t.spend * 12 * FIRE_MULT)} · {fa && fa <= AGE_END ? `free ≈ age ${fa}` : `free ≈ age ${fa || "45+"} — beyond the race`}</div>
                </button>
              );
            })}
            <div className="sr-small">Freedom number = 25× a year of spending. Your lifestyle drains your savings <i>and</i> moves your finish line.</div>
          </div>

          <div className="sr-card">
            <div className="sr-label">Pick your investments</div>
            {ALLOCS.map((a) => (
              <button key={a.id} className={"sr-opt" + (alloc.id === a.id ? " sel" : "")} onClick={() => setAlloc(a)}>
                <div className="nm">{a.name}</div>
                <div className="ds">{a.hint}</div>
              </button>
            ))}
          </div>

          <details className="sec">
            <summary>House rules</summary>
            <div className="inner sr-small">
              <p style={{ margin: "0 0 8px" }}>🤖 <b>Steady-Bot</b> copies your lifestyle and life chapters, holds the ETF, budgets {fmtFull(BOT_FUN)}/yr for fun (rising with inflation), and never reacts to anything.</p>
              <p style={{ margin: 0 }}>😊 <b>Happiness</b> drains a little every year. Hit the red line and you crack — a forced impulse buy at a 50% markup. Fun isn't optional; budget for it.</p>
            </div>
          </details>

          {informed && <div className="sr-card sr-small" style={{ background: "#FFF0C2" }}>🔓 <b>Price tags unlocked</b> — this run, every card shows what it costs your {AGE_END}-year-old self.</div>}

          <div className="sr-note">⚠️ <b>This isn't financial advice — it's a teaching simulation.</b> The returns here are scripted so you can see one thing clearly: how everyday decisions compound over twenty years.</div>

          <button className="btn go" onClick={() => startRun(false, false)}>START THE RACE ▶</button>
          <Footer />
        </div>
      </div>
    );
  }

  // ---------- play ----------
  const s = sim.current;
  if (phase === "play") {
    const inv = invP();
    const pNet = inv + s.pHome;
    const botNet = s.bot + s.botHome;
    const gap = pNet - botNet;
    const yNow = Math.min(s.yearIdx, YEARS - 1);
    const freeP = freedomPAt(yNow);
    const freeB = freedomBAt(yNow);
    const scaleMax = Math.max(pNet, botNet, freeP * 0.25, 1);
    const showGoal = freeP <= scaleMax * 1.02;
    const ev = s.pendingEvent;
    const rx = s.pendingReaction;
    const anyModal = !!(ev || rx || s.pendingBurnout);
    const surY = surplusP(s.yearIdx);
    const evNomCost = ev && (ev.kind === "buy" || ev.kind === "car") ? Math.round(nom(ev.cost, ev.year)) : 0;
    const canAfford = ev && (ev.kind === "buy" || ev.kind === "car") ? evNomCost <= inv + surY : true;
    const sells = ev && (ev.kind === "buy" || ev.kind === "car") && evNomCost > surY;
    const age = AGE_START + yNow;
    return (
      <div className="sr-root"><style>{css}</style>
        <div className="sr-shell">
          <div className={"sr-race" + (anyModal ? " dim" : "")}>
            <div className="sr-board">
              <div className="sr-year"><span className="big">Age {age}</span><span className="goal">🏁 {fmt(freeP)} (rising)</span></div>
              <div className="sr-progress"><div style={{ width: `${(s.yearIdx / YEARS) * 100}%` }} /></div>
              <div className="sr-lane">
                <div className="who">
                  <span>🙂 You{s.pHome > 0 ? <span className="chip">🏠</span> : null}{s.freedomAgeP ? <span className="chip" style={{ color: "var(--steady)" }}>FREE</span> : null}</span>
                  <span className="val"><CountUp value={pNet} /></span>
                </div>
                <div className="sr-track">
                  <div className="sr-fill" style={{ width: `${Math.max(3, (pNet / scaleMax) * 100)}%`, background: "var(--steady)" }} />
                  {showGoal && <div className="sr-goal" style={{ left: `${Math.min(97, (freeP / scaleMax) * 100)}%` }} />}
                </div>
              </div>
              <div className="sr-lane" style={{ marginBottom: 0 }}>
                <div className="who" style={{ color: "var(--bot)" }}>
                  <span>🤖 Bot{s.botHome > 0 ? <span className="chip">🏠</span> : null}{s.freedomAgeB ? <span className="chip">FREE</span> : null}</span>
                  <span className="val"><CountUp value={botNet} /></span>
                </div>
                <div className="sr-track">
                  <div className="sr-fill" style={{ width: `${Math.max(3, (botNet / scaleMax) * 100)}%`, background: "var(--bot)" }} />
                  {showGoal && <div className="sr-goal" style={{ left: `${Math.min(97, (freeB / scaleMax) * 100)}%` }} />}
                </div>
              </div>
              <div className="sr-gap" style={{ color: gap >= 0 ? "var(--steady)" : "var(--impulse)" }}>
                {gap >= 0 ? "▲ ahead by" : "▼ behind by"} {fmt(Math.abs(gap))}
              </div>
            </div>
          </div>

          {s.flash && !anyModal && <div className={"sr-flash " + s.flash.kind}>{s.flash.text}</div>}

          <JoyMeter joy={s.pJoy} />

          <div className="sr-card sr-small">
            Spending <b className="mono">{fmtFull(spendNowP(yNow))}/mo</b>{s.spendAdd > 0 ? " (upgraded lifestyle)" : ""} · saving <b className="mono">{fmtFull(Math.max(0, surY))}</b> this year into {s.curName}.
          </div>

          {ev && (ev.kind === "buy" || ev.kind === "creep") && (
            <div className="sr-modal">
              <div className="sr-ev">
                <div className="em">{ev.emoji}</div>
                <h3>{ev.name}</h3>
                <div className="age">Age {AGE_START + ev.year}{ev.twin === 2 ? " · same trip, older you" : ""}</div>
                {ev.kind === "creep" ? (
                  <>
                    <div className="price neg">+{fmtFull(nom(ev.monthly, ev.year))}/mo <span style={{ fontSize: 14 }}>forever</span></div>
                    <div className="note">{ev.blurb} Permanently raises your cost of living — and +{ev.joy} happiness a year, comfort you keep.</div>
                    {informed && <div className="tag">💡 ≈ {fmt(creepTotalCost(ev.monthly, ev.year))} less by {AGE_END} · finish line +{fmt(nom(ev.monthly, ev.year) * 12 * FIRE_MULT)}</div>}
                  </>
                ) : (
                  <>
                    <div className="price neg">{fmtFull(evNomCost)}</div>
                    <div className="note">{ev.type === "stuff" ? `+${ev.joy} happiness now — stuff-joy fades fast.` : `+${ev.joy} happiness now, and memories keep a small glow every year after.`}</div>
                    {informed && <div className="tag">💡 Invested instead ≈ {fmt(cardFuture(evNomCost, ev.year))} at {AGE_END}</div>}
                    {sells && canAfford && <div className="warn">Costs more than this year's savings — you'd sell {fmtFull(evNomCost - surY)} of investments.</div>}
                    {!canAfford && <div className="warn">You can't afford this one.</div>}
                  </>
                )}
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!canAfford || !armed} onClick={() => answerEvent(true)}>{ev.kind === "creep" ? "Upgrade" : "Buy it"}</button>
                  <button className="btn green" disabled={!armed} onClick={() => answerEvent(false)}>{ev.kind === "creep" ? "Keep it simple" : "Skip it"}</button>
                </div>
              </div>
            </div>
          )}

          {ev && ev.kind === "car" && (() => {
            const carAge = ev.year - s.lastCarYear;
            return (
              <div className="sr-modal">
                <div className="sr-ev">
                  <div className="em">🚗</div>
                  <h3>{ev.nth === 1 ? "Your first real car itch" : `Your car is ${carAge} years old`}</h3>
                  <div className="age">Age {AGE_START + ev.year}{ev.nth > 1 && carAge >= 15 ? " · it starts on the third try" : ev.nth > 1 && carAge >= 10 ? " · friends have started commenting" : ""}</div>
                  <div className="price neg">{fmtFull(evNomCost)} <span style={{ fontSize: 14 }}>after trade-in</span></div>
                  <div className="note">{carAge >= 10 ? `After ${carAge} years, who'd blame you? +${CAR_JOY} happiness — which still fades.` : `That new-car feeling: +${CAR_JOY} happiness, fading faster than the payments would have.`}</div>
                  {informed && <div className="tag">💡 Invested instead ≈ {fmt(cardFuture(evNomCost, ev.year))} at {AGE_END}</div>}
                  {sells && canAfford && <div className="warn">Costs more than this year's savings — you'd sell {fmtFull(evNomCost - surY)} of investments.</div>}
                  {!canAfford && <div className="warn">You can't afford the upgrade — the old car keeps rolling.</div>}
                  <div className="sr-btnrow">
                    <button className="btn red" disabled={!canAfford || !armed} onClick={() => answerEvent(true)}>Upgrade</button>
                    <button className="btn green" disabled={!armed} onClick={() => answerEvent(false)}>Keep driving</button>
                  </div>
                </div>
              </div>
            );
          })()}

          {ev && ev.kind === "house" && (() => {
            const down = Math.round(nom(HOUSE_DOWN, ev.year));
            return (
              <div className="sr-modal">
                <div className="sr-ev">
                  <div className="em">🏠</div>
                  <h3>Buy a home?</h3>
                  <div className="age">Age {AGE_START + ev.year}</div>
                  {inv >= down ? (
                    <>
                      <div className="price">{fmtFull(down)} <span style={{ fontSize: 14 }}>down payment</span></div>
                      <div className="note">Monthly costs stay about the same as rent. The down payment moves from investments into home equity — steady ~3%/yr, never crashes. The bot copies whatever you choose.</div>
                      <div className="warn">Home equity counts in net worth — NOT toward your freedom number. You can't eat a kitchen.</div>
                      <div className="sr-btnrow">
                        <button className="btn ghost" disabled={!armed} onClick={() => answerEvent(true)}>Buy the home</button>
                        <button className="btn ghost" disabled={!armed} onClick={() => answerEvent(false)}>Keep renting</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="note">A place you love just listed. Down payment: <b className="mono">{fmtFull(down)}</b>. You have <b className="mono">{fmt(inv)}</b> invested.</div>
                      <div className="warn">The door you couldn't open. Options in your 30s are purchased in your 20s.</div>
                      <div className="sr-btnrow">
                        <button className="btn ghost" disabled={!armed} onClick={() => answerEvent(false)}>Keep renting…</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {ev && ev.kind === "family" && (
            <div className="sr-modal">
              <div className="sr-ev calm">
                <div className="em">👨‍👩‍👧</div>
                <h3>Life chapter: family</h3>
                <div className="age">Age {AGE_START + ev.year}</div>
                <div className="price">+{fmtFull(nom(FAMILY_MONTHLY, ev.year))}/mo <span style={{ fontSize: 14 }}>from here on</span></div>
                <div className="note">Kids, a bigger everything, a fuller life — +{FAMILY_JOY} happiness a year, permanently. Not a choice card: life happens to you and the bot alike. Both finish lines move. The race stays fair.</div>
                <div className="sr-btnrow">
                  <button className="btn ghost" disabled={!armed} onClick={() => answerEvent(true)}>Life moves on ❤️</button>
                </div>
              </div>
            </div>
          )}

          {rx && rx.type === "panic" && (
            <div className="sr-modal">
              <div className="sr-ev burn">
                <div className="em">📉</div>
                <h3>Markets are crashing</h3>
                <div className="age">Age {AGE_START + rx.year} · your balance just took a hit</div>
                <div className="note">Friends are selling. The news says it could get worse. Your gut says get out.</div>
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!armed} onClick={() => answerReaction(true)}>Sell everything</button>
                  <button className="btn green" disabled={!armed} onClick={() => answerReaction(false)}>Hold on</button>
                </div>
              </div>
            </div>
          )}

          {rx && rx.type === "reentry" && (
            <div className="sr-modal">
              <div className="sr-ev">
                <div className="em">🚪</div>
                <h3>Get back in?</h3>
                <div className="age">Age {AGE_START + rx.year} · {rx.year - s.panicInfo.year} years since you sold</div>
                <div className="note">Markets are up {rx.upPct}% since you went to cash. Buying back means paying more than where you sold — staying out means missing everything ahead.</div>
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!armed} onClick={() => answerReaction(false)}>Stay in cash</button>
                  <button className="btn green" disabled={!armed} onClick={() => answerReaction(true)}>Back in</button>
                </div>
              </div>
            </div>
          )}

          {rx && rx.type === "fomo" && (
            <div className="sr-modal">
              <div className="sr-ev">
                <div className="em">🚀</div>
                <h3>Everyone's buying it</h3>
                <div className="age">Age {AGE_START + rx.year} · the hot stock just soared</div>
                <div className="note">Up over 40% this year. Your feed is full of people getting rich. Going all-in now means buying at the top of the hype.</div>
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!armed} onClick={() => answerReaction(true)}>Go all-in</button>
                  <button className="btn green" disabled={!armed} onClick={() => answerReaction(false)}>Stick to the plan</button>
                </div>
              </div>
            </div>
          )}

          {rx && rx.type === "glide" && (
            <div className="sr-modal">
              <div className="sr-ev calm">
                <div className="em">🛬</div>
                <h3>You're nearly free</h3>
                <div className="age">Age {AGE_START + rx.year} · 80%+ of your freedom number</div>
                <div className="note">The win is close. A calm, planned shift to steadier footing protects it — not panic, just landing the plane.</div>
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!armed} onClick={() => answerReaction(false)}>Keep pushing</button>
                  <button className="btn green" disabled={!armed} onClick={() => answerReaction(true)}>Protect it</button>
                </div>
              </div>
            </div>
          )}

          {s.pendingBurnout && (
            <div className="sr-modal">
              <div className="sr-ev burn">
                <div className="em">{s.pendingBurnout.emoji}</div>
                <h3>You cracked! 💥</h3>
                <div className="age">Age {AGE_START + s.pendingBurnout.year} · too long without any fun</div>
                <div className="note">In a moment of weakness you impulse-buy: <b>{s.pendingBurnout.name}</b>.</div>
                <div className="price neg">{fmtFull(s.pendingBurnout.cost)}</div>
                <div className="warn">Impulse premium: 50% over the going price. Unplanned spending always costs more.</div>
                <div className="sr-btnrow">
                  <button className="btn red" disabled={!armed} onClick={resolveBurnout}>Ouch… continue</button>
                </div>
              </div>
            </div>
          )}

          <Footer />
        </div>
      </div>
    );
  }

  // ---------- debrief ----------
  const finalNet = s.pSeries[YEARS];
  const finalInv = s.p.cash + s.p.etf + s.p.stock;
  const botFinal = s.botSeries[YEARS];
  const diff = finalNet - botFinal;
  const won = diff >= 0;
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const freeP = freedomPAt(YEARS - 1);
  const gapSeries = s.pSeries.map((v, i) => v - s.botSeries[i]);
  const projFreedomAge = (() => {
    if (s.freedomAgeP) return s.freedomAgeP;
    let net = finalInv;
    for (let y = YEARS; y < YEARS + 25; y++) {
      net = net * (1 + expOf(s.curMix)) + surplusP(y);
      if (net >= freedomPAt(y)) return AGE_START + y + 1;
    }
    return null;
  })();
  const twinBuys = s.purchases.filter((p) => p.twin);
  const twinNom1 = Math.round(nom(TWIN.cost, TWIN_Y1));
  const twinNom2 = Math.round(nom(TWIN.cost, TWIN_Y2));
  const carsBought = s.cars.filter((c) => c.bought);
  const carsOffered = s.cars;
  const carPaid = carsBought.reduce((t, c) => t + c.cost, 0);
  const carGrown = carsBought.reduce((t, c) => t + grownCost(c.cost, c.year), 0);
  const carPotential = carsOffered.reduce((t, c) => t + grownCost(c.cost, c.year), 0);
  const onlyTreats = s.creeps.length === 0 && carsBought.length === 0 && s.reactions.every((r) => (r.type === "panic" && !r.sold) || (r.type === "fomo" && !r.chased) || r.type === "glide" || r.type === "reentry");
  const allMarkers = [
    ...s.purchases.map((p) => ({ year: p.year, emoji: p.emoji })),
    ...s.creeps.map((c) => ({ year: c.year, emoji: c.emoji })),
    ...carsBought.map((c) => ({ year: c.year, emoji: "🚗" })),
    ...s.reactions.filter((r) => (r.type === "panic" && r.sold) || (r.type === "fomo" && r.chased)).map((r) => ({ year: r.year, emoji: r.type === "panic" ? "📉" : "🚀" })),
  ];
  const swings = [
    ...s.purchases.map((p) => ({ label: p.name + (p.burnout ? " (burnout)" : ""), v: grownCost(p.cost, p.year) })),
    ...carsBought.map((c) => ({ label: `Car upgrade #${c.nth}`, v: grownCost(c.cost, c.year) })),
    ...s.creeps.map((c) => ({ label: c.name, v: creepTotalCost(c.monthly, c.year) })),
    ...s.reactions.filter((r) => r.type === "panic" && r.sold).map((r) => {
      const end = s.panicInfo.reentered ? s.reactions.find((x) => x.type === "reentry" && x.back)?.year ?? YEARS : YEARS;
      return { label: "Panic-selling the crash", v: growVal(r.value, alloc.mix, r.year, end) - growVal(r.value, MIXES.cash, r.year, end) };
    }),
  ];
  const biggest = swings.length ? swings.reduce((a, b) => (b.v > a.v ? b : a)) : null;
  const nerveLines = s.reactions.map((r) => {
    if (r.type === "panic" && r.sold) {
      const end = s.panicInfo.reentered ? s.reactions.find((x) => x.type === "reentry" && x.back)?.year ?? YEARS : YEARS;
      const held = growVal(r.value, alloc.mix, r.year, end);
      const actual = growVal(r.value, MIXES.cash, r.year, end);
      return `📉 Sold in the age-${AGE_START + r.year} crash — panic cost ≈ ${fmt(held - actual)}`;
    }
    if (r.type === "panic" && !r.sold) {
      const to = Math.min(r.year + 2, YEARS);
      const v = s.pSeries[r.year];
      return `💪 Held through the age-${AGE_START + r.year} crash — the rebound paid ≈ ${fmt(growVal(v, alloc.mix, r.year, to) - v)}`;
    }
    if (r.type === "reentry") {
      return r.back
        ? `🚪 Got back in at ${AGE_START + r.year} — ${r.upPct}% above where you sold. The price of panic.`
        : `🧊 Stayed in cash — every rebound after ${AGE_START + r.year} happened without you.`;
    }
    if (r.type === "fomo" && r.chased) {
      const d = growVal(r.value, MIXES.stock, r.year, YEARS) - growVal(r.value, alloc.mix, r.year, YEARS);
      return d >= 0 ? `🚀 Chased the hot stock at ${AGE_START + r.year} — it paid off this time (+${fmt(d)}). Most timelines aren't so kind.` : `🚀 Chased the hot stock at ${AGE_START + r.year} — buying the hype cost ≈ ${fmt(-d)}`;
    }
    if (r.type === "fomo" && !r.chased) return `🧘 Ignored the hype at ${AGE_START + r.year} — stuck to the plan.`;
    if (r.type === "glide") return r.protected ? `🛬 Protected the win at ${AGE_START + r.year} — a planned shift, not a panicked one.` : `🎲 Kept full risk on near the finish line at ${AGE_START + r.year}.`;
    return null;
  }).filter(Boolean);

  return (
    <div className="sr-root"><style>{css}</style>
      <div className="sr-shell">
        <div className="sr-card" style={{ paddingTop: 18, paddingBottom: 16 }}>
          <div className="stamp-wrap"><span className={"stamp " + (won ? "win" : "loss")}>{won ? "YOU BEAT THE BOT" : "BOT WINS"}</span></div>
          <div className="verdict-num" style={{ color: won ? "var(--steady)" : "var(--impulse)" }}>
            {won ? "▲ ahead by " : "▼ behind by "}{fmt(Math.abs(diff))}
          </div>
          <div className="freescore">
            <span className={"pill" + (s.freedomAgeP ? " hit" : "")}>
              🏁 {s.freedomAgeP ? `FREE AT ${s.freedomAgeP} 👑` : projFreedomAge ? `FREE ≈ AGE ${projFreedomAge}` : "FREEDOM OUT OF SIGHT"}
            </span>
          </div>
          <div className="sr-small" style={{ textAlign: "center", color: "var(--ink)" }}>
            {s.freedomAgeP
              ? <>You hit your freedom number inside the race{s.freedomAgeB ? ` (bot: ${s.freedomAgeB})` : ""}. That's the crown.</>
              : <>Freedom fund <b className="mono">{fmt(finalInv)}</b> of <b className="mono">{fmt(freeP)}</b> ({Math.round((finalInv / freeP) * 100)}%){s.pHome > 0 ? <> · <b className="mono">{fmt(s.pHome)}</b> locked in your home</> : ""}. {projFreedomAge ? "Every good decision pulls this age closer — race it down next run." : "The plan is the problem, not the discipline — try a different lifestyle or allocation."}</>}
          </div>
          {biggest && <div className="sr-small" style={{ textAlign: "center", marginTop: 6 }}>Biggest swing: {biggest.label} · <b className="mono neg">−{fmt(biggest.v)}</b></div>}
        </div>

        <div className="sr-card">
          <div className="sr-label">The gap — you minus the bot</div>
          <LineChart series={[gapSeries]} colors={[won ? "#17A05E" : "#FF4D5E"]} zeroLine endLabel markers={allMarkers} />
          <div className="sr-small" style={{ marginTop: 6 }}>Above the line, you're ahead. Each mark is a decision — watch where the line bends. House and family hit you both, so they don't move it.</div>
        </div>

        {(() => {
          if (Math.abs(diff) < Math.max(15000, botFinal * 0.03)) return null;
          let botFunAdv = 0;
          for (let y = 0; y < YEARS; y++) {
            let v = nom(BOT_FUN, y);
            for (let k = y + 1; k < YEARS; k++) v *= 1 + market[k].etf;
            botFunAdv += v;
          }
          const purchasesTot = s.purchases.reduce((t, p) => t + grownCost(p.cost, p.year), 0);
          const creepTot = s.creeps.reduce((t, c) => t + creepTotalCost(c.monthly, c.year), 0);
          const allocEffect = diff - botFunAdv + purchasesTot + creepTot + carGrown;
          const investedDifferently = alloc.id !== "etf" || s.reactions.some((r) => (r.type === "panic" && r.sold) || (r.type === "fomo" && r.chased) || (r.type === "glide" && r.protected));
          const rows = [
            { t: "🤖 Bot's fun budget (your built-in edge)", v: botFunAdv },
            purchasesTot > 0 && { t: "🛍️ One-time purchases", v: -purchasesTot },
            carGrown > 0 && { t: "🚗 The car cycle", v: -carGrown },
            creepTot > 0 && { t: "🏢 Lifestyle routines", v: -creepTot },
            Math.abs(allocEffect) > 1000 && { t: investedDifferently ? "📊 Investing differently than the bot" : "📊 Timing & market luck", v: allocEffect },
          ].filter(Boolean);
          return (
            <div className="sr-card">
              <div className="sr-label">Where the gap came from</div>
              {rows.map((r, i) => (
                <div className="sr-line" key={i}>
                  <span>{r.t}</span>
                  <b className={r.v >= 0 ? "pos" : "neg"}>{r.v >= 0 ? "+" : ""}{fmt(r.v)}</b>
                </div>
              ))}
              <div className="sr-small" style={{ marginTop: 8 }}>The gap explodes in your late 30s because the pile is big by then — small yearly differences move serious dollars. <b>Early decisions set the slope; late years print the money.</b></div>
            </div>
          );
        })()}

        <details className="sec" open>
          <summary>💸 Spending ledger</summary>
          <div className="inner">
            {s.purchases.length > 0 && (
              <>
                <div className="sr-label">One-time purchases</div>
                {s.purchases.map((p, i) => (
                  <div className="sr-line" key={i}>
                    <span>{p.emoji} {p.name}{p.burnout ? " 💥" : ""} · {AGE_START + p.year}</span>
                    <b className="neg">−{fmt(grownCost(p.cost, p.year))} · +{freedomDelay(grownCost(p.cost, p.year))} mo</b>
                  </div>
                ))}
                <div className="sr-small" style={{ margin: "8px 0 12px" }}>
                  {onlyTreats && Math.abs(diff) < finalNet * 0.08
                    ? <b>Your one-time treats barely moved the needle. Routines, cars and panic decide this game.</b>
                    : <>What each would have grown into by {AGE_END}, and how many months it pushed freedom back.</>}
                </div>
              </>
            )}
            {carsOffered.length > 0 && (
              <>
                <div className="sr-label">The car cycle</div>
                {carsBought.length > 0 ? (
                  <>
                    {carsBought.map((c, i) => (
                      <div className="sr-line" key={i}>
                        <span>🚗 Upgrade #{c.nth} · {AGE_START + c.year} · <span className="mono">{fmtFull(c.cost)}</span></span>
                        <b className="neg">−{fmt(grownCost(c.cost, c.year))}</b>
                      </div>
                    ))}
                    <div className="sr-small" style={{ margin: "8px 0 12px" }}><b>{carsBought.length} upgrade{carsBought.length > 1 ? "s" : ""} = {fmt(carPaid)} paid ≈ {fmt(carGrown)} of lost growth, freedom delayed ~{freedomDelay(carGrown)} months.</b> The replacement habit, not any one car, is the expense.</div>
                  </>
                ) : (
                  <div className="sr-small" style={{ marginBottom: 12 }}>🔧 <b>You drove your cars into the ground — your ride is {YEARS - s.lastCarYear} years old at {AGE_END}.</b> Skipping the habit kept ≈ {fmt(carPotential)} in your freedom fund. Your mechanic knows you by name; your future self says thanks.</div>
                )}
              </>
            )}
            {s.creeps.length > 0 && (
              <>
                <div className="sr-label">Lifestyle routines — the double hit</div>
                {s.creeps.map((c, i) => (
                  <div className="sr-line" key={i}>
                    <span>{c.emoji} {c.name} · {AGE_START + c.year} · <span className="mono">+{fmtFull(nom(c.monthly, c.year))}/mo</span></span>
                    <b className="neg">−{fmt(creepTotalCost(c.monthly, c.year))} · 🏁 +{fmt(nom(c.monthly, c.year) * 12 * FIRE_MULT)}</b>
                  </div>
                ))}
                <div className="sr-small" style={{ margin: "8px 0 12px" }}>Each routine drained savings <i>and</i> moved your finish line. A treat became a default — that's how lifestyles inflate: nobody decides it, they just stop deciding.</div>
              </>
            )}
            <div className="sr-label">Same trip, two price tags</div>
            <div className="sr-line">
              <span>✈️ Age {AGE_START + TWIN_Y1} · sticker <span className="mono">{fmt(twinNom1)}</span> · {twinBuys.some((p) => p.twin === 1) ? "taken ✔" : "skipped"}</span>
              <b className="neg">−{fmt(grownCost(twinNom1, TWIN_Y1))}</b>
            </div>
            <div className="sr-line">
              <span>✈️ Age {AGE_START + TWIN_Y2} · sticker <span className="mono">{fmt(twinNom2)}</span> · {twinBuys.some((p) => p.twin === 2) ? "taken ✔" : "skipped"}</span>
              <b className="neg">−{fmt(grownCost(twinNom2, TWIN_Y2))}</b>
            </div>
            <div className="sr-small" style={{ margin: "8px 0 12px" }}>Inflation made the sticker <i>higher</i> at 36 — yet the true cost is <i>lower</i>, because the money had less time to grow. Early spending should be the things you'll truly remember.</div>
            {s.house && (
              <div className="sr-small" style={{ marginBottom: 8 }}>
                {s.house.bought
                  ? <>🏠 <b>Home worth {fmt(s.pHome)} at {AGE_END}</b> — in your net worth, not your freedom fund. You can't eat a kitchen.</>
                  : s.house.locked
                    ? <>🚪 <b>The door you couldn't open:</b> at 31 the down payment was {fmtFull(s.house.down)}; you had {fmt(s.pSeries[HOUSE_Y] || 0)}. Options in your 30s are purchased in your 20s.</>
                    : <>🏠 You passed on the home and kept everything invested. Renting isn't losing — it's a different plan.</>}
              </div>
            )}
            {s.famDone && (
              <div className="sr-small" style={{ marginBottom: 4 }}>👨‍👩‍👧 <b>The family chapter at 33</b> raised spending {fmtFull(nom(FAMILY_MONTHLY, FAMILY_Y))}/mo for you and the bot alike. Life happens to everyone; the race stayed fair. What differed was how ready your 20s made you for it.</div>
            )}
            {s.burnouts > 0 && (
              <div className="sr-small">💥 <b>You cracked {s.burnouts === 1 ? "once" : s.burnouts + " times"}.</b> Total deprivation doesn't work — you splurged anyway, at a 50% markup. A small planned fun budget is cheaper than willpower that snaps.</div>
            )}
          </div>
        </details>

        <details className="sec">
          <summary>🎢 Nerve & investing</summary>
          <div className="inner">
            {nerveLines.length > 0 ? nerveLines.map((n, i) => (
              <div className="sr-line" key={i} style={{ display: "block" }}>{n}</div>
            )) : <div className="sr-small">No market storms tested you this run — play a new market to face one.</div>}
            {alloc.mix.cash > 0 && (
              <div className="sr-small" style={{ marginTop: 8 }}>💸 <b>Cash drag is real:</b> cash earned 1.5% while your lifestyle — and your finish line — inflated 2% a year. Cash walked backwards on a moving treadmill.</div>
            )}
          </div>
        </details>

        <details className="sec">
          <summary>😊 Happiness</summary>
          <div className="inner">
            <LineChart series={[s.pJoySeries, s.botJoySeries]} colors={["#FFB300", "#6C7BD9"]} hline={JOY_FLOOR} hlineColor="#FF4D5E" yFmt={(v) => Math.round(v)} />
            <div className="sr-legend">
              <span><span className="sr-dot" style={{ background: "#FFB300" }} />You · avg {avg(s.pJoySeries).toFixed(1)}</span>
              <span><span className="sr-dot" style={{ background: "#6C7BD9" }} />Bot · avg {avg(s.botJoySeries).toFixed(1)}</span>
            </div>
            <div className="sr-small" style={{ marginTop: 8 }}>Stuff spikes and fades. Experiences keep a glow. Routines add steady comfort — check what they did to the gap chart.</div>
          </div>
        </details>

        <details className="sec">
          <summary>📈 The full race</summary>
          <div className="inner">
            <LineChart series={[s.pSeries, s.botSeries]} colors={["#17A05E", "#6C7BD9"]} hline={freeP} />
            <div className="sr-legend">
              <span><span className="sr-dot" style={{ background: "#17A05E" }} />You · {fmt(finalNet)}</span>
              <span><span className="sr-dot" style={{ background: "#6C7BD9" }} />Bot · {fmt(botFinal)}</span>
              <span>‐ ‐ freedom at {AGE_END}</span>
            </div>
          </div>
        </details>

        {runs.length > 0 && (
          <div className="sr-card sr-runs">
            <div className="sr-label">Run history — race your freedom age down</div>
            {runs.map((r, i) => {
              const eff = (x) => x.freedomAge ?? x.projAge ?? 99;
              const cur = eff(r);
              const prev = i > 0 ? eff(runs[i - 1]) : null;
              const delta = prev != null && cur !== prev ? cur - prev : null;
              return (
                <div key={i}>
                  Run {i + 1}: 🏁 <b className="mono">{r.freedomAge ? `${r.freedomAge} 👑` : r.projAge ? `≈${r.projAge}` : "—"}</b>
                  {delta != null && <b className={"mono " + (delta < 0 ? "pos" : "neg")}> ({delta < 0 ? "▼" : "▲"}{Math.abs(delta)} yr{Math.abs(delta) > 1 ? "s" : ""})</b>}
                  {" · "}{r.won ? "beat the bot by " : "lost to the bot by "}<b className="mono">{fmt(Math.abs(r.diff))}</b>
                  {r.burnouts > 0 ? ` · 💥×${r.burnouts}` : ""}
                </div>
              );
            })}
          </div>
        )}

        {runs.length === 1 && (
          <div className="sr-card sr-small" style={{ background: "#FFF0C2" }}>🔓 <b>Run 2 unlocks price tags</b> — every card will show what it costs your {AGE_END}-year-old self. Same-market replay is a pure test of what you just learned.</div>
        )}

        <details className="sec">
          <summary>⚠️ The fine print</summary>
          <div className="inner fineprint">
            <p><b>This isn't financial advice — it's a teaching simulation.</b> It's built to make one thing visible: how ordinary decisions compound over twenty years.</p>
            <p><b>The numbers are made up.</b> Twenty years of market returns were generated to behave roughly like real markets — but no one knows what the next twenty years look like. Real life is messier, and one run is not a prediction.</p>
            <p><b>The returns are plausible, not promised.</b> 7% average for the ETF and 1.5% for cash sit near long-run historical averages before tax. Any single stock can do anything, including go to zero permanently — the game's version is gentler than reality.</p>
            <p><b>Plenty is left out.</b> No taxes, no TFSA or RRSP rules, no job loss, no debt or student loans, no trading costs, no health surprises, no government benefits, no pensions. All of those matter in real life, and some matter a lot.</p>
            <p><b>The freedom number is a rule of thumb.</b> 25× a year of spending comes from the "4% rule," which is a starting point for discussion, not a guarantee — it assumes a long retirement, a particular mix of investments, and outcomes that historically <i>usually</i> worked. It says nothing about your situation.</p>
            <p><b>Happiness points are invented.</b> They're a way to show that stuff-joy fades and deprivation backfires — not a measurement of anyone's life. Money is one input into a good life, and not the biggest one.</p>
            <p><b>Steady-Bot isn't a role model for everything.</b> It never changes course, which is useful for teaching discipline and useless for handling real life. Renting, spending on people you love, and buying the trip at 24 can all be excellent decisions.</p>
            <p>Before doing anything with real money, talk to someone qualified who has to act in your interest.</p>
          </div>
        </details>

        <Footer />

        <div className="sr-replaybar">
          <button className="btn go" style={{ maxWidth: 160 }} onClick={() => startRun(false, false)}>▶ Same market</button>
          <button className="btn ghost" onClick={() => startRun(true, true)}>🎲 New market</button>
          <button className="btn ghost" onClick={() => { setMarket(genMarket()); setEvents(genEvents()); setPhase("setup"); }}>✏️ Change plan</button>
        </div>
      </div>
    </div>
  );
}
