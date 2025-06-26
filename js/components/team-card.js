// Team directory dashboard component for managing teams and players
import { db } from '../db.js';

export default class TeamCard extends HTMLElement {
  constructor(teamId, role) {
    super();
    this.teamId = teamId;
    this.role = role;
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    await this.render();
    this.setupEventListeners();
  }

  async render() {
    const team = await db.teams.get(parseInt(this.teamId));
    const players = await db.players.where({ teamId: this.teamId }).toArray();
    const matches = await db.matches.where({ teamId: this.teamId }).toArray();
    this.shadowRoot.innerHTML = `
      <style>
        .team-card { padding: 1rem; }
        .team-header { display: flex; justify-content: space-between; align-items: center; }
        .player-list, .match-list { margin-top: 1rem; }
        ul { list-style: none; padding: 0; }
        li { padding: 0.5rem; border-bottom: 1px solid #ddd; }
        input, button { margin: 0.5rem; }
      </style>
      <div class="team-card" role="region" aria-label="Team Dashboard">
        <div class="team-header">
          <h2>${team ? team.name : 'Team'}</h2>
          ${this.role === 'owner' ? '<button id="invite-coach" aria-label="Invite Coach">Invite Coach</button>' : ''}
        </div>
        ${this.role === 'owner' ? `
          <div>
            <h3>Create Team</h3>
            <input type="text" id="team-name" placeholder="Team Name" aria-label="Team Name">
            <input type="text" id="team-code" placeholder="Team Code" aria-label="Team Code">
            <input type="color" id="team-color" aria-label="Team Color">
            <button id="create-team" aria-label="Create Team">Create</button>
          </div>
        ` : ''}
        <div class="player-list">
          <h3>Players</h3>
          <ul>
            ${players.map(p => `<li>${p.name} (${p.role}) <button class="edit-player" data-id="${p.id}" aria-label="Edit ${p.name}">Edit</button></li>`).join('')}
          </ul>
          ${this.role === 'owner' || this.role === 'coach' ? `
            <input type="text" id="player-name" placeholder="Player Name" aria-label="Player Name">
            <input type="text" id="player-role" placeholder="Role" aria-label="Player Role">
            <input type="text" id="player-photo" placeholder="Photo URL" aria-label="Player Photo URL">
            <button id="add-player" aria-label="Add Player">Add Player</button>
          ` : ''}
        </div>
        <div class="match-list">
          <h3>Matches</h3>
          <ul>
            ${matches.map(m => `<li>${m.date.toLocaleDateString()} (${m.format}) <a href="/match/${m.id}" aria-label="Score Match ${m.id}">Score</a> | <a href="/edit-match/${m.id}" aria-label="Edit Match ${m.id}">Edit</a></li>`).join('')}
          </ul>
          <button id="new-match" aria-label="New Match">New Match</button>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (this.role === 'owner') {
      this.shadowRoot.querySelector('#create-team')?.addEventListener('click', async () => {
        const name = this.shadowRoot.querySelector('#team-name').value;
        const code = this.shadowRoot.querySelector('#team-code').value;
        const color = this.shadowRoot.querySelector('#team-color').value;
        if (name && code && color) {
          await db.teams.add({ name, code, color, createdAt: new Date() });
          this.render();
        }
      });
      this.shadowRoot.querySelector('#invite-coach')?.addEventListener('click', () => {
        window.location.href = '/invite';
      });
    }

    if (this.role === 'owner' || this.role === 'coach') {
      this.shadowRoot.querySelector('#add-player')?.addEventListener('click', async () => {
        const name = this.shadowRoot.querySelector('#player-name').value;
        const role = this.shadowRoot.querySelector('#player-role').value;
        const photoUrl = this.shadowRoot.querySelector('#player-photo').value;
        if (name && role) {
          await db.players.add({
            teamId: this.teamId,
            name,
            role,
            photoUrl,
            stats: { runs: 0, wickets: 0, avg: 0, strikeRate: 0, ecoRate: 0 }
          });
          this.render();
        }
      });
    }

    this.shadowRoot.querySelector('#new-match')?.addEventListener('click', async () => {
      const matchId = Date.now();
      await db.matches.add({ id: matchId, teamId: this.teamId, date: new Date(), format: 'T20', balls: [], result: '', synced: false });
      window.location.href = `/match/${matchId}`;
    });
  }
}

customElements.define('team-card', TeamCard);