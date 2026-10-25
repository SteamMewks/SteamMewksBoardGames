import { gameModules, gameType } from './state.js';

export function registerGameModule(e, t) {
  if (gameModules[e])
    throw Error('Duplicate game module: ' + e);
  if (typeof t.initial !== 'function')
    throw Error('Missing game initializer: ' + e);
  gameModules[e] = Object.freeze(t);
}

export function getGameModule(e = gameType) {
  return gameModules[e] || {};
}
