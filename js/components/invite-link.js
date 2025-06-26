
// Invite link generator component for team invitations
import { db } from '../db.js';

export default class InviteLink extends HTMLElement {
  constructor(teamId) {
    super();
    this.teamId = teamId;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .invite-link { padding: 1rem; }
        input, button { margin: 0.5rem; }
        #invite-url { width: 100%; }
      </style>
      <div class="invite-link" role="region" aria-label="Invite Link Generator">
        <h2>Generate Invite Link</h2>
        <select id="invite-role" aria-label="Select Role for Invite">
          <option value="coach">Coach</option>
          <option value="scorer">Scorer</option>
        </select>
        <button id="generate-invite" aria-label="Generate Invite Link">Generate</button>
        <input type="text" id="invite-url" readonly aria-label="Invite Link">
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot.querySelector('#generate-invite').addEventListener('click', async () => {
      const role = this.shadowRoot.querySelector('#invite-role').value;
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.invites.add({ token, teamId: this.teamId, role, expiresAt });
      const url = `${window.location.origin}/?team=${this.teamId}&token=${token}`;
      this.shadowRoot.querySelector('#invite-url').value = url;
    });
  }
}

customElements.define('invite-link', InviteLink);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     