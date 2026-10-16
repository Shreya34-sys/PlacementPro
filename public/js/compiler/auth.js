/**
 * Keeps existing account state available for saved-project APIs without
 * rendering sign-in, registration, or logout controls in the public editor.
 */
import { api } from './api.js';

export class AuthManager {
  constructor(authContainerId) {
    this.container = document.getElementById(authContainerId);
    this.currentUser = null;
  }

  async init() {
    this.currentUser = await api.getMe();
    this.render();
  }

  render() {
    this.container?.replaceChildren();
  }
}
