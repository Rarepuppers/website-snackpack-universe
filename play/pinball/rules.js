/**
 * rules.js -- scoring, missions, ranks, multiball, wizard mode.
 *
 * Pure: no DOM, no clock, no globals, no randomness beyond the seeded PRNG
 * held in state. It consumes the events engine.js emits and knows nothing
 * about collision; the engine knows nothing about scoring. That separation is
 * what lets both files be reused byte-for-byte by the app.
 *
 * Effects do not happen here. Anything that has to change the world -- release
 * a saucer, add a ball for multiball -- is pushed as a COMMAND for the caller
 * to execute. That keeps the whole ruleset testable with no physics at all,
 * which is why rules.test.mjs runs in milliseconds.
 *
 * See docs/pinball/03-ruleset.md. If that doc and this file disagree, one of
 * them is a bug.
 */

import { mulberry32 } from './engine.js';

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const RANKS = [
  'Crumb Cadet', 'Galley Hand', 'Deck Sweeper', 'Snack Ensign',
  'Provisions Officer', 'Navigator', 'First Mate', 'Captain', 'Fleet Commander',
];

/** Missions completed required to reach each rank index. */
export const RANK_THRESHOLDS = [0, 1, 2, 3, 5, 7, 9, 11, 12];

export const POINTS = {
  bumper: 250,
  sling: 100,
  spinner: 150,
  spinnerLit: 500,
  target: 1500,
  bankClear: 15000,
  rollover: 2500,
  orbit: 5000,
  ramp: 7500,
  saucer: 10000,
  kickback: 5000,
  rankUp: 100000,
  jackpot: 50000,
  jackpotStep: 25000,
  superJackpot: 250000,
  skillShot: 25000,
  skillShotMax: 100000,
  superSkillShot: 150000,
  wizardShot: 500000,
  wizardComplete: 5000000,
};

/** The six major shots. "Major" is what missions and combos count. */
export const MAJOR_SHOTS = ['orbit-left', 'ramp-right', 'saucer', 'bank', 'spinner-lit', 'lock'];

export const MISSIONS = [
  { id: 1, name: 'Mess Hall Rush', time: 40, award: 150000, need: { major: 6 } },
  { id: 2, name: 'Restock the Pantry', time: 30, award: 200000, need: { target: 3 } },
  { id: 3, name: 'Comet Run', time: 30, award: 250000, need: { 'orbit-left': 2 } },
  { id: 4, name: 'Asteroid Sweep', time: 25, award: 175000, need: { bumper: 8 } },
  { id: 5, name: 'Cargo Haul', time: 35, award: 275000, need: { 'ramp-right': 3 } },
  { id: 6, name: 'Spin the Sails', time: 25, award: 200000, need: { spinner: 25 } },
  { id: 7, name: 'Rescue Nutmeg', time: 30, award: 300000, sequence: ['ramp', 'saucer'] },
  { id: 8, name: 'Escort Duty', time: 40, award: 400000, need: { 'orbit-left': 2, 'ramp-right': 2 } },
  { id: 9, name: 'Storm Watch', time: 30, award: 250000, survive: true, addTimeOn: 'bumper', addTime: 1 },
  { id: 10, name: 'Silent Running', time: 30, award: 350000, clean: 3 },
  { id: 11, name: "Beakon's Command", time: 35, award: 500000, sequence: ['orbit-left', 'ramp-right', 'saucer', 'ramp-right'] },
  { id: 12, name: 'Deep Space', time: 20, award: 400000, need: { major: 3 }, outlaneScoring: true },
];

export const COMBO_WINDOW = 3.0;
export const SKILL_WINDOW = 4.0;
export const MISSION_RELIGHT = 15.0;
export const WIZARD_TIME = 60;
export const WIZARD_SHOTS = 6;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * The PRNG is a closure and cannot be serialised, so a resumed game has to
 * fast-forward it. Counting draws makes that exact: reseed, then replay
 * `draws` calls. Guessing the count from game state instead would desync the
 * mission order on every resume, and the symptom -- "the daily gave me
 * different missions after a reload" -- is one almost nobody would report.
 */
function countedRandom(seed, startAt) {
  const raw = mulberry32(seed >>> 0);
  const box = { draws: 0 };
  for (let i = 0; i < (startAt || 0); i += 1) raw();
  box.draws = startAt || 0;
  box.next = () => { box.draws += 1; return raw(); };
  return box;
}

export function createRules(seed, modeId) {
  const rng = countedRandom(seed, 0);
  return {
    seed: seed >>> 0,
    rng,
    rand: rng.next,
    modeId: modeId || 'classic',

    score: 0,
    ball: 1,

    missionsDone: [],        // mission ids, in completion order
    pool: MISSIONS.map((m) => m.id),
    mission: null,           // { id, timeLeft, progress, seqIndex }
    missionRelight: 0,       // seconds until the saucer relights
    saucerLit: true,

    rank: 0,

    combo: 0,
    comboTimer: 0,

    // Skill shot: a lit major shot for the first few seconds of a ball.
    skillShot: null,         // { shot, timeLeft, firstFlipUsed }
    skillLadder: 0,

    locks: 0,
    lockLit: false,
    multiball: false,
    jackpot: POINTS.jackpot,
    jackpotsCollected: 0,
    superJackpotLit: false,
    bankClears: 0,

    wizardLit: false,
    wizard: null,            // { timeLeft, shots: Set }

    spinnerLit: false,
    outlaneScoring: false,

    bonusMultiplier: 1,
    rolloversThisSet: [],
    bonus: { bumpers: 0, ramps: 0, targets: 0 },

    tilted: false,
    commands: [],
    log: [],                 // significant moments, for the DMD and the share card
  };
}

const push = (r, type, data) => { r.commands.push({ type, ...data }); };
const note = (r, text, kind) => { r.log.push({ text, kind: kind || 'info' }); };

export function drainCommands(r) {
  const c = r.commands;
  r.commands = [];
  return c;
}

export function drainLog(r) {
  const l = r.log;
  r.log = [];
  return l;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

function add(r, points) {
  if (r.tilted) return;
  r.score += Math.round(points);
}

function rankFor(count) {
  let rank = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i += 1) {
    if (count >= RANK_THRESHOLDS[i]) rank = i;
  }
  return rank;
}

function updateRank(r) {
  const next = rankFor(r.missionsDone.length);
  if (next === r.rank) return;
  r.rank = next;
  add(r, POINTS.rankUp);
  note(r, `Rank up: ${RANKS[r.rank]}`, 'rank');
  push(r, 'sound', { name: 'rank-up' });
  push(r, 'voice', { name: 'voice-rank-up' });
  if (r.rank === RANKS.length - 1 && r.missionsDone.length >= MISSIONS.length) {
    r.wizardLit = true;
    note(r, 'THE LONG VOYAGE IS LIT', 'wizard');
  }
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

function drawMission(r) {
  if (!r.pool.length) return null;
  const i = Math.floor(r.rand() * r.pool.length) % r.pool.length;
  return r.pool[i];
}

function startMission(r) {
  const id = drawMission(r);
  if (id == null) return false;
  const def = MISSIONS.find((m) => m.id === id);
  r.mission = {
    id,
    timeLeft: def.time,
    progress: {},
    seqIndex: 0,
    cleanRun: 0,
  };
  r.outlaneScoring = !!def.outlaneScoring;
  r.saucerLit = false;
  note(r, def.name, 'mission');
  push(r, 'sound', { name: 'mission-start' });
  push(r, 'voice', { name: `mission-${id}` });
  return true;
}

function missionDef(r) {
  return r.mission ? MISSIONS.find((m) => m.id === r.mission.id) : null;
}

function completeMission(r) {
  const def = missionDef(r);
  if (!def) return;
  // Award scales with rank, so late missions are worth far more than early ones.
  add(r, def.award * Math.max(1, r.rank));
  r.missionsDone.push(def.id);
  r.pool = r.pool.filter((x) => x !== def.id);
  r.mission = null;
  r.outlaneScoring = false;
  r.missionRelight = MISSION_RELIGHT;
  note(r, `${def.name} complete`, 'mission-done');
  push(r, 'sound', { name: 'mission-complete' });
  push(r, 'voice', { name: 'voice-complete' });
  updateRank(r);
}

function failMission(r) {
  const def = missionDef(r);
  if (!def) return;
  // A failed mission goes back in the pool. Nothing is permanently lost.
  r.mission = null;
  r.outlaneScoring = false;
  r.missionRelight = MISSION_RELIGHT;
  note(r, `${def.name} failed`, 'mission-fail');
  push(r, 'sound', { name: 'mission-fail' });
}

/** Feed a scoring shot into the running mission's objective. */
function missionProgress(r, kind) {
  const m = r.mission;
  const def = missionDef(r);
  if (!m || !def) return;

  m.progress[kind] = (m.progress[kind] || 0) + 1;
  if (MAJOR_SHOTS.includes(kind) || kind === 'ramp') {
    m.progress.major = (m.progress.major || 0) + 1;
  }

  // Ordered sequence missions.
  if (def.sequence) {
    const want = def.sequence[m.seqIndex];
    const matches = want === 'ramp'
      ? (kind === 'orbit-left' || kind === 'ramp-right')
      : want === kind;
    if (matches) {
      m.seqIndex += 1;
      if (m.seqIndex >= def.sequence.length) { completeMission(r); return; }
      push(r, 'sound', { name: 'combo-2' });
    }
    return;
  }

  // "Three major shots with no bumper in between."
  if (def.clean) {
    if (MAJOR_SHOTS.includes(kind) || kind === 'ramp') {
      m.cleanRun += 1;
      if (m.cleanRun >= def.clean) completeMission(r);
    }
    return;
  }

  if (def.need) {
    const met = Object.entries(def.need).every(([k, v]) => (m.progress[k] || 0) >= v);
    if (met) completeMission(r);
  }
}

// ---------------------------------------------------------------------------
// Multiball and wizard mode
// ---------------------------------------------------------------------------

function startMultiball(r) {
  r.multiball = true;
  r.locks = 0;
  r.lockLit = false;
  r.jackpot = POINTS.jackpot;
  r.jackpotsCollected = 0;
  r.superJackpotLit = false;
  note(r, 'GALLEY RUSH', 'multiball');
  push(r, 'sound', { name: 'multiball-start' });
  push(r, 'voice', { name: 'voice-multiball' });
  push(r, 'release-saucer', { id: 'lock' });
  push(r, 'add-balls', { count: 2 });
  push(r, 'music', { bed: 'intense' });
}

function endMultiball(r) {
  if (!r.multiball) return;
  r.multiball = false;
  r.superJackpotLit = false;
  push(r, 'music', { bed: 'calm' });
  note(r, 'Multiball over', 'info');
}

function startWizard(r) {
  r.wizardLit = false;
  r.wizard = { timeLeft: WIZARD_TIME, shots: [] };
  r.mission = null;
  note(r, 'THE LONG VOYAGE', 'wizard');
  push(r, 'sound', { name: 'wizard-start' });
  push(r, 'voice', { name: 'voice-wizard' });
  push(r, 'add-balls', { count: 3 });
  push(r, 'music', { bed: 'intense' });
}

function endWizard(r, completed) {
  if (!r.wizard) return;
  if (completed) {
    add(r, POINTS.wizardComplete);
    note(r, 'VOYAGE COMPLETE', 'wizard-done');
    push(r, 'sound', { name: 'wizard-complete' });
  }
  r.wizard = null;
  push(r, 'music', { bed: 'calm' });
}

// ---------------------------------------------------------------------------
// Combos
// ---------------------------------------------------------------------------

function comboMultiplier(r) {
  if (r.combo <= 1) return 1;
  return Math.min(r.combo, 5);
}

function bumpCombo(r) {
  r.combo += 1;
  r.comboTimer = COMBO_WINDOW;
  if (r.combo >= 2) {
    push(r, 'sound', { name: `combo-${Math.min(r.combo, 4)}` });
    note(r, `${comboMultiplier(r)}x combo`, 'combo');
  }
}

function breakCombo(r) {
  r.combo = 0;
  r.comboTimer = 0;
}

// ---------------------------------------------------------------------------
// Skill shot
// ---------------------------------------------------------------------------

function armSkillShot(r) {
  const options = ['orbit-left', 'ramp-right', 'saucer'];
  const shot = options[Math.floor(r.rand() * options.length) % options.length];
  r.skillShot = { shot, timeLeft: SKILL_WINDOW, flips: 0 };
  note(r, `Skill shot: ${shot === 'orbit-left' ? 'left orbit' : shot === 'ramp-right' ? 'right ramp' : 'the hatch'}`, 'skill');
}

function resolveSkillShot(r, kind) {
  const s = r.skillShot;
  if (!s) return;
  if (s.shot !== kind) { r.skillShot = null; r.skillLadder = 0; return; }

  // Super: made on the very FIRST flip -- exactly one, deliberately made.
  // `<= 1` also matched zero flips, which handed the top award to a player who
  // simply plunged and watched the ball orbit into the lit shot on its own.
  if (s.flips === 1) {
    add(r, POINTS.superSkillShot);
    note(r, 'SUPER SKILL SHOT', 'skill-done');
  } else {
    r.skillLadder = Math.min(r.skillLadder + 1, POINTS.skillShotMax / POINTS.skillShot);
    add(r, Math.min(POINTS.skillShot * r.skillLadder, POINTS.skillShotMax));
    note(r, 'Skill shot', 'skill-done');
  }
  push(r, 'sound', { name: 'skill-shot' });
  r.skillShot = null;
}

// ---------------------------------------------------------------------------
// Shots
// ---------------------------------------------------------------------------

/** A completed major shot: score it, feed combos, missions, wizard and skill. */
function majorShot(r, kind, basePoints) {
  bumpCombo(r);
  add(r, basePoints * comboMultiplier(r));

  if (r.wizard) {
    if (!r.wizard.shots.includes(kind)) r.wizard.shots.push(kind);
    add(r, POINTS.wizardShot);
    if (r.wizard.shots.length >= WIZARD_SHOTS) endWizard(r, true);
    return;
  }

  resolveSkillShot(r, kind);

  if (r.multiball && kind === 'ramp-right') {
    add(r, r.jackpot);
    r.jackpot += POINTS.jackpotStep;
    r.jackpotsCollected += 1;
    note(r, 'JACKPOT', 'jackpot');
    push(r, 'sound', { name: 'jackpot' });
    push(r, 'voice', { name: 'voice-jackpot' });
    if (r.jackpotsCollected % 3 === 0) {
      r.superJackpotLit = true;
      note(r, 'SUPER JACKPOT LIT', 'jackpot');
    }
  }

  missionProgress(r, kind);
}

// ---------------------------------------------------------------------------
// Event intake
// ---------------------------------------------------------------------------

export function applyEvent(r, e) {
  if (r.tilted && e.type !== 'drain' && e.type !== 'ball-lost') return r;

  switch (e.type) {
    case 'plunge':
      armSkillShot(r);
      break;

    case 'flipper':
      if (r.skillShot) r.skillShot.flips += 1;
      break;

    case 'bumper':
      add(r, POINTS.bumper);
      r.bonus.bumpers += 1;
      breakCombo(r);
      if (r.mission) {
        const def = missionDef(r);
        if (def && def.clean) r.mission.cleanRun = 0;
        if (def && def.addTimeOn === 'bumper') {
          // Topped back up, never extended past the starting clock. Without
          // the ceiling a player parked in the bumpers adds a second per hit
          // and Storm Watch simply never ends.
          r.mission.timeLeft = Math.min(r.mission.timeLeft + def.addTime, def.time);
        }
        missionProgress(r, 'bumper');
      }
      break;

    case 'sling':
      add(r, POINTS.sling);
      break;

    case 'spinner': {
      const per = r.spinnerLit ? POINTS.spinnerLit : POINTS.spinner;
      add(r, per * (e.revs || 1));
      if (r.mission) for (let i = 0; i < (e.revs || 1); i += 1) missionProgress(r, 'spinner');
      break;
    }

    case 'rollover':
      add(r, POINTS.rollover);
      if (!r.rolloversThisSet.includes(e.id)) {
        r.rolloversThisSet.push(e.id);
        if (r.rolloversThisSet.length >= 3) {
          r.rolloversThisSet = [];
          r.bonusMultiplier = Math.min(r.bonusMultiplier + 1, 5);
          note(r, `Bonus ${r.bonusMultiplier}x`, 'bonus');
        }
      }
      break;

    case 'target':
      add(r, POINTS.target);
      r.bonus.targets += 1;
      missionProgress(r, 'target');
      break;

    case 'target-bank-clear':
      add(r, POINTS.bankClear);
      r.bankClears += 1;
      if (!r.multiball) {
        r.lockLit = true;
        note(r, 'Lock is lit', 'lock');
      }
      majorShot(r, 'bank', 0);
      break;

    case 'ramp-exit':
      r.bonus.ramps += 1;
      if (e.id === 'orbit-left') majorShot(r, 'orbit-left', POINTS.orbit);
      else if (e.id === 'ramp-right') majorShot(r, 'ramp-right', POINTS.ramp);
      break;

    case 'saucer':
      if (e.id === 'lock') {
        if (r.lockLit && !r.multiball) {
          r.locks += 1;
          r.lockLit = false;
          note(r, `Ball ${r.locks} locked`, 'lock');
          push(r, 'sound', { name: 'lock' });
          if (r.locks >= 2) startMultiball(r);
          else push(r, 'release-saucer', { id: 'lock', delay: 1.0 });
        } else {
          add(r, POINTS.saucer);
          push(r, 'release-saucer', { id: 'lock', delay: 0.8 });
        }
        break;
      }
      // The main saucer: mission start, super jackpot, or wizard entry.
      if (r.wizardLit) { startWizard(r); break; }
      if (r.superJackpotLit) {
        add(r, POINTS.superJackpot);
        r.superJackpotLit = false;
        r.jackpot = POINTS.jackpot;
        note(r, 'SUPER JACKPOT', 'jackpot');
        push(r, 'sound', { name: 'super-jackpot' });
        break;
      }
      if (!r.mission && r.saucerLit && r.pool.length) {
        startMission(r);
      } else {
        add(r, POINTS.saucer);
        majorShot(r, 'saucer', 0);
      }
      break;

    case 'kickback':
      add(r, POINTS.kickback);
      note(r, 'Saved', 'save');
      break;

    case 'tilt':
      r.tilted = true;
      r.bonus = { bumpers: 0, ramps: 0, targets: 0 };
      if (r.mission) failMission(r);
      note(r, 'TILT', 'tilt');
      break;

    case 'drain':
      breakCombo(r);
      break;

    default:
      break;
  }
  return r;
}

/** Time-based rules: mission clocks, combo window, skill window, wizard clock. */
export function tick(r, dt) {
  if (r.comboTimer > 0) {
    r.comboTimer -= dt;
    if (r.comboTimer <= 0) breakCombo(r);
  }

  if (r.skillShot) {
    r.skillShot.timeLeft -= dt;
    if (r.skillShot.timeLeft <= 0) { r.skillShot = null; r.skillLadder = 0; }
  }

  if (r.missionRelight > 0) {
    r.missionRelight -= dt;
    if (r.missionRelight <= 0 && !r.mission) r.saucerLit = true;
  }

  // Missions pause during multiball rather than ticking away unattended.
  if (r.mission && !r.multiball && !r.wizard) {
    r.mission.timeLeft -= dt;
    if (r.mission.timeLeft <= 0) {
      const def = missionDef(r);
      if (def && def.survive) completeMission(r);
      else failMission(r);
    }
  }

  if (r.wizard) {
    r.wizard.timeLeft -= dt;
    if (r.wizard.timeLeft <= 0) endWizard(r, false);
  }

  return r;
}

/** The engine reports how many balls are live; multiball ends at one. */
export function setBallsInPlay(r, n) {
  if (r.multiball && n <= 1) endMultiball(r);
}

// ---------------------------------------------------------------------------
// End of ball
// ---------------------------------------------------------------------------

export function endOfBallBonus(r) {
  if (r.tilted) return 0;
  const base = (r.bonus.bumpers * 500) + (r.bonus.ramps * 2000) + (r.bonus.targets * 1000);
  return base * r.bonusMultiplier;
}

export function nextBall(r) {
  const bonus = endOfBallBonus(r);
  if (bonus > 0) { add(r, bonus); note(r, `Bonus ${bonus.toLocaleString()}`, 'bonus'); }
  r.ball += 1;
  r.bonus = { bumpers: 0, ramps: 0, targets: 0 };
  r.tilted = false;
  r.multiball = false;
  r.locks = 0;
  r.lockLit = false;
  r.skillShot = null;
  r.mission = null;
  r.missionRelight = 0;
  r.saucerLit = true;
  r.rolloversThisSet = [];
  breakCombo(r);
  return bonus;
}

// ---------------------------------------------------------------------------
// Presentation helpers -- what the DMD shows
// ---------------------------------------------------------------------------

export function statusLine(r) {
  if (r.wizard) return `THE LONG VOYAGE  ${Math.ceil(r.wizard.timeLeft)}s  ${r.wizard.shots.length}/${WIZARD_SHOTS}`;
  if (r.multiball) return r.superJackpotLit ? 'SUPER JACKPOT AT THE HATCH' : 'JACKPOT ON THE RIGHT RAMP';
  if (r.mission) {
    const def = missionDef(r);
    return `${def.name.toUpperCase()}  ${Math.ceil(r.mission.timeLeft)}s`;
  }
  if (r.wizardLit) return 'THE LONG VOYAGE IS LIT -- SHOOT THE HATCH';
  if (r.skillShot) {
    const label = r.skillShot.shot === 'orbit-left' ? 'LEFT ORBIT'
      : r.skillShot.shot === 'ramp-right' ? 'RIGHT RAMP' : 'THE HATCH';
    return `SKILL SHOT: ${label}`;
  }
  if (r.lockLit) return 'LOCK IS LIT';
  if (r.saucerLit && r.pool.length) return 'SHOOT THE HATCH FOR A MISSION';
  return `${RANKS[r.rank].toUpperCase()}  ${r.missionsDone.length}/${MISSIONS.length} MISSIONS`;
}

/** Which shots should be lit on the playfield right now. */
export function litShots(r) {
  const lit = [];
  if (r.wizard) return MAJOR_SHOTS.filter((s) => !r.wizard.shots.includes(s));
  if (r.wizardLit || (r.saucerLit && !r.mission)) lit.push('saucer');
  if (r.multiball) { lit.push('ramp-right'); if (r.superJackpotLit) lit.push('saucer'); }
  if (r.lockLit) lit.push('lock');
  if (r.skillShot) lit.push(r.skillShot.shot);
  const def = missionDef(r);
  if (def) {
    if (def.sequence) {
      const want = def.sequence[r.mission.seqIndex];
      lit.push(...(want === 'ramp' ? ['orbit-left', 'ramp-right'] : [want]));
    } else if (def.need) {
      for (const k of Object.keys(def.need)) if (MAJOR_SHOTS.includes(k)) lit.push(k);
    }
  }
  return [...new Set(lit)];
}

// ---------------------------------------------------------------------------
// Persistence -- this is exactly what resume.js round-trips
// ---------------------------------------------------------------------------

export function serialize(r) {
  const { rand, rng, commands, log, ...rest } = r;
  const out = JSON.parse(JSON.stringify(rest));
  out.draws = rng.draws;
  return out;
}

export function deserialize(data) {
  const r = createRules(data.seed, data.modeId);
  const { draws, ...rest } = data;
  Object.assign(r, rest);
  const rng = countedRandom(data.seed, draws || 0);
  r.rng = rng;
  r.rand = rng.next;
  r.commands = [];
  r.log = [];
  return r;
}
