import { randomInt } from 'node:crypto';

export const RULESET = 'dr-pvp-1';
export const MAX_HP = 20;
export const MAX_TURNS = 120;

export function createDeck(prefix, random = randomInt) {
  const cards = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: prefix + '-atk-' + i, type: 'ATTACK' })),
    ...Array.from({ length: 10 }, (_, i) => ({ id: prefix + '-def-' + i, type: 'DEFENSE' })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: prefix + '-ord-' + i, type: 'ORDER' })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: prefix + '-imp-' + (i + 1), type: 'IMPACT', rank: i + 1 })),
  ];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function player(name, prefix, random) {
  const deck = createDeck(prefix, random);
  return { name, hp: MAX_HP, impact: 0, impactThisTurn: false, comboType: null,
    comboCount: 0, hand: deck.splice(0, 3), deck, discarded: 0 };
}

function draw(p, count = 1) {
  for (let n = 0; n < count && p.deck.length; n++) p.hand.push(p.deck.shift());
}

export function createMatch(names, random = randomInt) {
  if (!Array.isArray(names) || names.length !== 2 || names.some(n => typeof n !== 'string' || !n.trim()))
    throw new Error('Se necesitan dos jugadores.');
  const turn = random(2);
  const match = { ruleset: RULESET, revision: 1, status: 'playing', turn,
    turnNumber: 1, winner: null, pendingCombo: null,
    players: names.map((name, slot) => player(name, 'p' + slot, random)),
    lastEvent: 'Comienza el duelo.' };
  draw(match.players[turn]);
  return match;
}

function finishIfNeeded(match, actor) {
  const rival = 1 - actor;
  if (match.players[rival].hp <= 0 || match.players[actor].impact >= 4) {
    match.status = 'finished'; match.winner = actor;
    match.pendingCombo = null;
  } else if (match.players[actor].hp <= 0) {
    match.status = 'finished'; match.winner = rival;
    match.pendingCombo = null;
  }
}

/** Server-owned state. Returns an error without modifying the match on rejection. */
export function act(match, slot, action) {
  if (!match || match.ruleset !== RULESET || match.status !== 'playing') return 'La partida no está activa.';
  if (slot !== 0 && slot !== 1) return 'Jugador no autorizado.';
  if (!action || typeof action !== 'object' || Array.isArray(action)) return 'Acción incorrecta.';
  const me = match.players[slot];
  const them = match.players[1 - slot];
  if (action.type === 'surrender') {
    match.status = 'finished'; match.winner = 1 - slot; match.pendingCombo = null;
    match.lastEvent = me.name + ' se rindió.';
    match.revision++;
    return null;
  }
  if (match.turn !== slot) return 'No es tu turno.';
  if (match.pendingCombo) {
    if (action.type !== 'combo' || !['DAMAGE', 'HEAL'].includes(action.choice))
      return 'Debes elegir el efecto del combo.';
    const value = match.pendingCombo.level === 3 ? 3 : 1;
    if (action.choice === 'DAMAGE') them.hp = Math.max(0, them.hp - value);
    else me.hp = Math.min(MAX_HP, me.hp + value);
    const level = match.pendingCombo.level;
    if (level === 3) { me.comboType = null; me.comboCount = 0; }
    match.pendingCombo = null;
    match.lastEvent = me.name + ': combo ×' + level + ', ' + (action.choice === 'DAMAGE' ? '-' + value + ' vida rival' : '+' + value + ' vida') + '.';
    finishIfNeeded(match, slot);
    match.revision++;
    return null;
  }
  if (action.type === 'end_turn') {
    match.turn = 1 - slot;
    match.turnNumber++;
    match.players[match.turn].impactThisTurn = false;
    draw(match.players[match.turn]);
    match.lastEvent = 'Turno de ' + match.players[match.turn].name + '.';
    if (match.turnNumber > MAX_TURNS || match.players.every(p => !p.hand.length && !p.deck.length)) {
      match.status = 'finished'; match.winner = null; match.lastEvent = 'Empate por agotamiento.';
    }
    match.revision++;
    return null;
  }
  if (action.type !== 'play' || typeof action.cardId !== 'string') return 'Acción incorrecta.';
  const position = me.hand.findIndex(card => card.id === action.cardId);
  if (position < 0) return 'La carta no pertenece a tu mano.';
  const card = me.hand[position];
  if (card.type === 'IMPACT' && (card.rank !== me.impact + 1 || me.impactThisTurn))
    return 'Los Impactos deben jugarse en orden, uno por turno.';
  me.hand.splice(position, 1);
  me.discarded++;
  if (card.type === 'ATTACK') them.hp = Math.max(0, them.hp - 2);
  else if (card.type === 'DEFENSE') me.hp = Math.min(MAX_HP, me.hp + 1);
  else if (card.type === 'ORDER') draw(me);
  else if (card.type === 'IMPACT') {
    me.impact = card.rank;
    me.impactThisTurn = true;
    if (card.rank !== 4) {
      them.hp = Math.max(0, them.hp - 1);
      me.hp = Math.min(MAX_HP, me.hp + 1);
    }
  }
  const labels = { ATTACK: 'Ataque', DEFENSE: 'Defensa', ORDER: 'Orden', IMPACT: 'Impacto' };
  match.lastEvent = me.name + ' jugó ' + (card.type === 'IMPACT' ? 'Impacto ' + (card.rank === 4 ? 'Final' : card.rank) : 'Decreto de ' + labels[card.type]) + '.';
  if (me.comboType === card.type) me.comboCount = Math.min(3, me.comboCount + 1);
  else { me.comboType = card.type; me.comboCount = 1; }
  finishIfNeeded(match, slot);
  if (match.status === 'playing' && me.comboCount >= 2) match.pendingCombo = { slot, level: me.comboCount };
  match.revision++;
  return null;
}

/** Never send the opponent's hand, the deck order or the session token. */
export function viewFor(match, slot, connected = [true, true]) {
  if (slot !== 0 && slot !== 1) throw new Error('Jugador no autorizado.');
  const mine = match.players[slot];
  const theirs = match.players[1 - slot];
  return {
    ruleset: match.ruleset, revision: match.revision, status: match.status,
    isMyTurn: match.status === 'playing' && match.turn === slot,
    turnNumber: match.turnNumber,
    pendingCombo: match.pendingCombo?.slot === slot ? match.pendingCombo.level : null,
    winner: match.winner === null ? match.status === 'finished' ? 'draw' : null : match.winner === slot ? 'me' : 'opponent',
    me: { name: mine.name, hp: mine.hp, impact: mine.impact, impactThisTurn: mine.impactThisTurn,
      comboType: mine.comboType, comboCount: mine.comboCount,
      hand: mine.hand.map(c => ({ ...c })), deckCount: mine.deck.length, discarded: mine.discarded,
      connected: Boolean(connected[slot]) },
    opponent: { name: theirs.name, hp: theirs.hp, impact: theirs.impact,
      handCount: theirs.hand.length, deckCount: theirs.deck.length, discarded: theirs.discarded,
      connected: Boolean(connected[1 - slot]) },
    lastEvent: match.lastEvent,
  };
}
