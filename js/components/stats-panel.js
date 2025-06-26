// Stats panel component for displaying team and player statistics
import { db } from '../db.js';

export default class StatsPanel extends HTMLElement {
  constructor(teamId, role) {
    super();
    this.teamId = teamId;
    this.role = role;
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.render();
  }

  async render() {
    const team = await db.teams.get(parseInt(this.teamId));
    const matches = await db.matches.where({ teamId: this.teamId }).toArray();
    const players = await db.players.where({ teamId: this.teamId }).toArray();
    const stats = this.calculateTeamStats(matches);
    this.shadowRoot.innerHTML = `
      <style>
        .stats-panel { padding: 1rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: var(--team-color); color: white; }
      </style>
      <div class="stats-panel" role="region" aria-label="Team and Player Statistics">
        <h2>${team.name} Statistics</h2>
        <h3>Team Stats</h3>
        <table aria-label="Team Statistics">
          <tr><th>Matches Played</th><td>${stats.played}</td></tr>
          <tr><th>Won</th><td>${stats.won}</td></tr>
          <tr><th>Lost</th><td>${stats.lost}</td></tr>
          <tr><th>Net Run Rate</th><td>${stats.nrr.toFixed(2)}</td></tr>
          <tr><th>Points</th><td>${stats.points}</td></tr>
        </table>
        <h3>Player Stats</h3>
        <table aria-label="Player Statistics">
          <thead>
            <tr>
              <th>Name</th>
              <th>Runs</th>
              <th>Wickets</th>
              <th>Batting Avg</th>
              <th>Strike Rate</th>
              <th>Economy</th>
            </tr>
          </thead>
          <tbody>
            ${players.map(p => `
              <tr>
                <td>${p.name}</td>
                <td>${p.stats.runs}</td>
                <td>${p.stats.wickets}</td>
                <td>${p.stats.avg.toFixed(2)}</td>
                <td>${p.stats.strikeRate.toFixed(2)}</td>
                <td>${p.stats.ecoRate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  calculateTeamStats(matches) {
    let played = matches.length;
    let won = 0, lost = 0, totalRuns = 0, totalOvers = 0;
    matches.forEach(m => {
      if (m.result === 'win') won++;
      else if (m.result === 'loss') lost++;
      totalRuns += m.balls.reduce((sum, b) => sum + b.runs, 0);
      totalOvers += Math.floor(m.balls.length / 6) + (m.balls.length % 6) / 10;
    });
    const nrr = totalOvers > 0 ? (totalRuns / totalOvers) : 0;
    const points = won * 2;
    return { played, won, lost, nrr, points };
  }
}

customElements.define('stats-panel', StatsPanel);