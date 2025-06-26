// IndexedDB wrapper using Dexie.js for offline storage
import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.min.js';

export let db;

export async function initDB() {
  db = new Dexie('CricketDB');
  db.version(1).stores({
    teams: '++id, name, code, color, createdAt',
    players: '++id, teamId, name, role, photoUrl, stats',
    matches: '++id, teamId, date, format, balls, result, synced',
    invites: 'token, teamId, role, expiresAt'
  });
  await db.open();
}