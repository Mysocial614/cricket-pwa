// Main app initialization, routing, and service-worker registration
import { initDB } from './db.js';
import { syncData } from './api.js';
import TeamCard from './components/team-card.js';
import ScoreBoard from './components/score-board.js';
import MatchEditor from './components/match-editor.js';
import InviteLink from './components/invite-link.js';
import StatsPanel from './components/stats-panel.js';

class App {
  constructor() {
    this.content = document.getElementById('app-content');
    this.connectionStatus = document.getElementById('connection-status');
    this.init();
  }

  async init() {
    // Initialize IndexedDB
    await initDB();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('../service-worker.js', {scope: '../'})
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));
    }

    // Update connection status
    this.updateConnectionStatus();
    window.addEventListener('online', () => this.updateConnectionStatus());
    window.addEventListener('offline', () => this.updateConnectionStatus());

    // Parse URL for team and token
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('team');
    const token = urlParams.get('token');
    if (teamId && token) {
      await this.verifyInvite(teamId, token);
    }

    // Load role and team from localStorage
    this.role = localStorage.getItem('role') || 'guest';
    this.teamId = localStorage.getItem('teamId') || null;

    // Route based on URL or role
    this.route();
  }

  async verifyInvite(teamId, token) {
    // Stub: Verify token against IndexedDB invites
    const invite = await db.invites.get({ token });
    if (invite && invite.teamId === teamId && new Date(invite.expiresAt) > new Date()) {
      localStorage.setItem('role', invite.role);
      localStorage.setItem('teamId', teamId);
      this.role = invite.role;
      this.teamId = teamId;
    }
  }

  updateConnectionStatus() {
    const isOnline = navigator.onLine;
    this.connectionStatus.textContent = isOnline ? 'Online' : 'Offline';
    this.connectionStatus.className = isOnline ? 'online' : 'offline';
    if (isOnline) syncData();
  }

  route() {
    const path = window.location.pathname;
    this.content.innerHTML = '';
    if (path === '/' && this.role !== 'guest') {
      this.content.appendChild(new TeamCard(this.teamId, this.role));
    } else if (path.startsWith('/match/')) {
      this.content.appendChild(new ScoreBoard(this.teamId, this.role));
    } else if (path.startsWith('/edit-match/')) {
      this.content.appendChild(new MatchEditor(this.teamId, this.role));
    } else if (path.startsWith('/stats/')) {
      this.content.appendChild(new StatsPanel(this.teamId, this.role));
    } else if (path === '/invite' && this.role === 'owner') {
      this.content.appendChild(new InviteLink(this.teamId));
    } else {
      this.content.innerHTML = '<h2>Please join a team</h2>';
    }
  }
}

new App();