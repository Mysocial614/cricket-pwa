// Post-match editor component for correcting ball-by-ball records
import { db } from '../db.js';
import { syncData } from '../api.js';

export default class MatchEditor extends HTMLElement {
  constructor(teamId, role) {
    super();
    this.teamId = teamId;
    this.role = role;
    this.matchId = window.location.pathname.split('/').pop();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    if (this.role !== 'scorer' && this.role !== 'owner') {
      this.shadowRoot.innerHTML = '<p aria-live="assertive">Access denied: Only scorers or owners can edit matches.</p>';
      return;
    }
    await this.render();
    this.setupEventListeners();
  }

  async render() {
    const match = await db.matches.get(parseInt(this.matchId));
    if (!match) {
      this.shadowRoot.innerHTML = '<p aria-live="assertive">Match not found.</p>';
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>
        .match-editor { padding: 1rem; }
        .ball-list { margin-top: 1rem; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.5rem; border-bottom: 1px solid #ddd; }
        input, select, button { margin: 0.5rem; }
      </style>
      <div class="match-editor" role="region" aria-label="Match Editor">
        <h2>Edit Match #${this.matchId}</h2>
        <div class="ball-list">
          <h3>Balls</h3>
          <ul>
            ${match.balls.map((b, index) => `
              <li>
                Over ${b.over}.${b.ball}: ${b.runs} run${b.runs !== 1 ? 's' : ''}${b.extra ? ` (${b.extra})` : ''}${b.wicket ? ' (Wicket)' : ''}
                <select class="edit-runs" data-index="${index}" aria-label="Edit Runs for Ball ${index}">
                  <option value="${b.runs}" selected>${b.runs}</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="6">6</option>
                </select>
                <select class="edit-extra" data-index="${index}" aria-label="Edit Extra for Ball ${index}">
                  <option value="${b.extra || ''}" selected>${b.extra || 'None'}</option>
                  <option value="">None</option>
                  <option value="wide">Wide</option>
                  <option value="no-ball">No Ball</option>
                </select>
                <input type="checkbox" class="edit-wicket" data-index="${index}" ${b.wicket ? 'checked' : ''} aria-label="Wicket for Ball ${index}">
              </li>
            `).join('')}
          </ul>
        </div>
        <button id="save-results" aria-label="Save Match Results">Save Results</button>
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll('.edit-runs, .edit-extra, .edit-wicket').forEach(input => {
      input.addEventListener('change', async (e) => {
        const index = parseInt(e.target.dataset.index);
        const match = await db.matches.get(parseInt(this.matchId));
        const ball = match.balls[index];
        if (e.target.classList.contains('edit-runs')) {
          ball.runs = parseInt(e.target.value);
        } else if (e.target.classList.contains('edit-extra')) {
          ball.extra = e.target.value || null;
        } else if (e.target.classList.contains('edit-wicket')) {
          ball.wicket = e.target.checked;
        }
        await db.matches.update(this.matchId, { balls: match.balls });
      });
    });

    this.shadowRoot.querySelector('#save-results').addEventListener('click', async () => {
      await this.updatePlayerStats();
      await db.matches.update(this.matchId, { synced: false });
      if (navigator.onLine) await syncData();
      alert('Match results saved.');
    });
  }

  async updatePlayerStats() {
    const match = await db.matches.get(parseInt(this.matchId));
    const players = await db.players.where({ teamId: this.teamId }).toArray();
    for (const player of players) {
      const runs = match.balls.filter(b => b.striker === player.id).reduce((sum, b) => sum + b.runs, 0);
      const wickets = match.balls.filter(b => b.bowler === player.id && b.wicket).length;
      const ballsBowled = match.balls.filter(b => b.bowler === player.id).length;
      player.stats.runs += runs;
      player.stats.wickets += wickets;
      player.stats.avg = player.stats.runs / (player.stats.wickets || 1);
      player.stats.strikeRate = player.stats.runs / (match.balls.filter(b => b.striker === player.id).length || 1) * 100;
      player.stats.ecoRate = ballsBowled > 0 ? (runs / (ballsBowled / 6)).toFixed(2) : 0;
      await db.players.update(player.id, { stats: player.stats });
    }
  }
}

customElements.define('match-editor', MatchEditor);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              