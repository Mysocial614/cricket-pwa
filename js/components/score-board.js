// Live scorecard component for real-time match scoring
import { db } from '../db.js';
import { syncData } from '../api.js';

export default class ScoreBoard extends HTMLElement {
  constructor(teamId, role) {
    super();
    this.teamId = teamId;
    this.role = role;
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    if (this.role !== 'scorer' && this.role !== 'owner') {
      this.shadowRoot.innerHTML = '<p aria-live="assertive">Access denied: Only scorers or owners can score matches.</p>';
      return;
    }
    await this.render();
    this.setupEventListeners();
  }

  async render() {
    const players = await db.players.where({ teamId: this.teamId }).toArray();
    if (!players.length) {
      this.shadowRoot.innerHTML = '<p aria-live="assertive">No players found. Add players to start scoring.</p>';
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>
        .score-board { padding: 1rem; }
        .score { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
        select, button { margin: 0.5rem; }
        .controls { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      </style>
      <div class="score-board" role="region" aria-label="Live Scorecard">
        <div class="score" aria-live="polite">Score: 0/0 (0.0 ov) | RR: 0.00</div>
        <select id="striker" aria-label="Select Striker">
          <option value="">Select Striker</option>
          ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <select id="non-striker" aria-label="Select Non-Striker">
          <option value="">Select Non-Striker</option>
          ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <select id="bowler" aria-label="Select Bowler">
          <option value="">Select Bowler</option>
          ${players.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <div class="controls">
          <button aria-label="0 runs">0</button>
          <button aria-label="1 run">1</button>
          <button aria-label="2 runs">2</button>
          <button aria-label="3 runs">3</button>
          <button aria-label="4 runs">4</button>
          <button aria-label="6 runs">6</button>
          <button aria-label="Wicket">W</button>
          <button aria-label="Wide">Wd</button>
          <button aria-label="No Ball">Nb</button>
          <button aria-label="End Match" id="end-match">End Match</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll('button:not(#end-match)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const striker = this.shadowRoot.querySelector('#striker').value;
        const nonStriker = this.shadowRoot.querySelector('#non-striker').value;
        const bowler = this.shadowRoot.querySelector('#bowler').value;
        if (!striker || !nonStriker || !bowler) {
          alert('Please select striker, non-striker, and bowler.');
          return;
        }
        const runs = btn.textContent === 'W' ? 0 : btn.textContent === 'Wd' || btn.textContent === 'Nb' ? 1 : parseInt(btn.textContent);
        const extra = btn.textContent === 'Wd' ? 'wide' : btn.textContent === 'Nb' ? 'no-ball' : null;
        const wicket = btn.textContent === 'W' ? true : false;
        await this.recordBall(runs, extra, wicket, striker, nonStriker, bowler);
        this.updateScore();
      });
    });

    this.shadowRoot.querySelector('#end-match').addEventListener('click', async () => {
      await db.matches.update(this.matchId, { synced: false });
      if (navigator.onLine) await syncData();
      window.location.href = `/edit-match/${this.matchId}`;
    });
  }

  async recordBall(runs, extra, wicket, striker, nonStriker, bowler) {
    let match = await db.matches.where({ teamId: this.teamId, synced: false }).first();
    if (!match) {
      match = { id: Date.now(), teamId: this.teamId, date: new Date(), format: 'T20', balls: [], result: '', synced: false };
      await db.matches.add(match);
    }
    this.matchId = match.id;
    const ball = {
      over: match.balls?.length ? Math.floor(match.balls.length / 6) + 1 : 1,
      ball: match.balls?.length % 6 + 1,
      runs,
      extra,
      wicket,
      striker,
      nonStriker,
      bowler
    };
    await db.matches.update(match.id, { balls: [...(match.balls || []), ball] });
  }

  async updateScore() {
    const match = await db.matches.get(this.matchId);
    const totalRuns = match.balls.reduce((sum, b) => sum + b.runs, 0);
    const wickets = match.balls.filter(b => b.wicket).length;
    const overs = Math.floor(match.balls.length / 6) + (match.balls.length % 6) / 10;
    const runRate = overs > 0 ? (totalRuns / overs).toFixed(2) : 0.00;
    this.shadowRoot.querySelector('.score').textContent = `Score: ${totalRuns}/${wickets} (${overs.toFixed(1)} ov) | RR: ${runRate}`;
  }
}

customElements.define('score-board', ScoreBoard);