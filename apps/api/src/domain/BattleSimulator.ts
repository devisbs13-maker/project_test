export type BattleClass = 'warrior' | 'volkhv' | 'hunter' | 'berserk';

export interface Fighter {
  id: string;
  name: string;
  level: number;
  power: number; // base offensive power
  defense: number; // base mitigation scalar (0..1)
  class: BattleClass;
}

export interface BattleRewards {
  gold: number;
  exp: number;
}

export interface BattleLogEntry {
  r: number;
  text: string;
}

export interface SimulationResult {
  winner: 'player' | 'opponent';
  turns: number;
  log: string[]; // short log
  player: { dmgTaken: number; dmgDealt: number };
  opponent: { dmgTaken: number; dmgDealt: number };
  rewards: BattleRewards;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function calcDamage(attacker: Fighter, defender: Fighter): { damage: number; notes: string[] } {
  const notes: string[] = [];
  // base damage = power * coef ± variance
  const coef = rand(0.85, 1.15);
  const variance = rand(-5, 5);
  let dmg = attacker.power * coef + variance;

  // class perks
  if (attacker.class === 'volkhv') {
    dmg *= 1.15; // bonus magic damage
    notes.push('волхв: +15% маг. урон');
  } else if (attacker.class === 'berserk') {
    dmg *= 1.2; // rage increases damage
    notes.push('берсерк: ярость +20% урона');
  }

  // defender reactions/perks applied on incoming damage
  let mitigation = 1 - clamp(defender.defense, 0, 0.8); // convert defense to mitigation scalar
  if (defender.class === 'berserk') {
    mitigation *= 1.1; // berserk trades defense for offense
    notes.push('берсерк: -деф');
  }

  // warrior block chance
  if (defender.class === 'warrior' && Math.random() < 0.2) {
    mitigation *= 0.5; // block halves damage
    notes.push('витязь: блок');
  }

  dmg = Math.max(0, dmg * mitigation);
  return { damage: dmg, notes };
}

export function simulateBattle(player: Fighter, opponent: Fighter): SimulationResult {
  const rounds = Math.round(rand(3, 5.49));
  const log: BattleLogEntry[] = [];

  // Simple HP model
  let hpPlayer = 100 + player.level * 10;
  let hpOpponent = 100 + opponent.level * 10;

  let bleedOnOpponent = 0; // per round DOT from hunter
  let bleedOnPlayer = 0;

  let dmgDealtByPlayer = 0;
  let dmgDealtByOpponent = 0;

  for (let r = 1; r <= rounds; r++) {
    // player attacks first each round
    const p = calcDamage(player, opponent);
    let roundPlayerDmg = p.damage;
    if (player.class === 'hunter') {
      bleedOnOpponent += 4; // apply bleed stacking
      log.push({ r, text: `Игрок наносит ${roundPlayerDmg.toFixed(0)} урона. Кровотечение +4.` });
    } else {
      log.push({ r, text: `Игрок наносит ${roundPlayerDmg.toFixed(0)} урона.` });
    }
    hpOpponent -= roundPlayerDmg;
    dmgDealtByPlayer += roundPlayerDmg;

    if (hpOpponent <= 0) break;

    // bleed ticks at end of attacker step
    if (bleedOnOpponent > 0) {
      hpOpponent -= bleedOnOpponent;
      dmgDealtByPlayer += bleedOnOpponent;
      log.push({ r, text: `Кровотечение по противнику: ${bleedOnOpponent.toFixed(0)}.` });
      if (hpOpponent <= 0) break;
    }

    // opponent attacks
    const o = calcDamage(opponent, player);
    let roundOppDmg = o.damage;
    if (opponent.class === 'hunter') {
      bleedOnPlayer += 4;
      log.push({ r, text: `Противник наносит ${roundOppDmg.toFixed(0)} урона. Кровотечение +4.` });
    } else {
      log.push({ r, text: `Противник наносит ${roundOppDmg.toFixed(0)} урона.` });
    }
    hpPlayer -= roundOppDmg;
    dmgDealtByOpponent += roundOppDmg;

    if (hpPlayer <= 0) break;

    if (bleedOnPlayer > 0) {
      hpPlayer -= bleedOnPlayer;
      dmgDealtByOpponent += bleedOnPlayer;
      log.push({ r, text: `Кровотечение по игроку: ${bleedOnPlayer.toFixed(0)}.` });
      if (hpPlayer <= 0) break;
    }
  }

  const winner = hpOpponent <= 0 ? 'player' : hpPlayer <= 0 ? 'opponent' : (dmgDealtByPlayer >= dmgDealtByOpponent ? 'player' : 'opponent');
  const turns = log.reduce((acc, e) => (e.text.includes('Игрок наносит') ? acc + 1 : acc), 0);

  const rewards: BattleRewards = winner === 'player'
    ? { gold: Math.round(rand(8, 20)), exp: Math.round(rand(5, 15)) }
    : { gold: Math.round(rand(1, 5)), exp: Math.round(rand(1, 4)) };

  const shortLog = log.slice(0, 5).map((e) => `Раунд ${e.r}: ${e.text}`);

  return {
    winner,
    turns: Math.max(1, Math.min(5, turns)),
    log: shortLog,
    player: { dmgTaken: Math.max(0, 100 + player.level * 10 - hpPlayer), dmgDealt: dmgDealtByPlayer },
    opponent: { dmgTaken: Math.max(0, 100 + opponent.level * 10 - hpOpponent), dmgDealt: dmgDealtByOpponent },
    rewards,
  };
}

export function toBattleClass(input?: string): BattleClass {
  const v = (input || '').toLowerCase();
  if (v.includes('vol') || v.includes('вол')) return 'volkhv';
  if (v.includes('hun') || v.includes('охот')) return 'hunter';
  if (v.includes('ber') || v.includes('бер')) return 'berserk';
  return 'warrior';
}

