/**
 * Login Component
 * Handles user authentication UI
 * Requirements: 1.1, 1.2
 */

import type { IAuthService, LoginCredentials } from "../services/auth.js";

export interface ILoginComponent {
  show(): void;
  hide(): void;
  onLoginSuccess(callback: () => void): void;
}

/**
 * LoginComponent manages the login modal and authentication flow
 */
export class LoginComponent implements ILoginComponent {
  private modal: HTMLElement | null = null;
  private form: HTMLFormElement | null = null;
  private errorElement: HTMLElement | null = null;
  private loginSuccessCallback: (() => void) | null = null;

  constructor(private authService: IAuthService) {
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * Create login modal HTML structure
   */
  private createModal(): void {
    const modalHtml = `
      <div id="login-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Iniciar Sesión</h2>
          </div>
          <form id="login-form" class="modal-body">
            <div class="login-error hidden"></div>
            <div class="form-group">
              <label for="login-username">Usuario *</label>
              <input 
                type="text" 
                id="login-username" 
                name="username" 
                required 
                autocomplete="username"
              />
            </div>
            <div class="form-group">
              <label for="login-password">Contraseña *</label>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                required 
                autocomplete="current-password"
              />
            </div>
            <div class="modal-footer">
              <button type="submit" class="btn btn-primary">Iniciar Sesión</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = modalHtml;
    this.modal = tempDiv.firstElementChild as HTMLElement;
    document.body.appendChild(this.modal);

    this.form = this.modal.querySelector("#login-form");
    this.errorElement = this.modal.querySelector(".login-error");
  }

  /**
   * Setup event listeners for form submission
   */
  private setupEventListeners(): void {
    if (!this.form) return;

    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  /**
   * Handle login form submission
   */
  private async handleLogin(): Promise<void> {
    if (!this.form) return;

    const formData = new FormData(this.form);
    const credentials: LoginCredentials = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    };

    try {
      this.showLoading();
      this.hideError();

      await this.authService.login(credentials);

      this.hide();
      this.form.reset();

      // Call success callback if registered
      if (this.loginSuccessCallback) {
        this.loginSuccessCallback();
      }
    } catch (error) {
      this.showError(
        error instanceof Error ? error.message : "Error al iniciar sesión"
      );
    } finally {
      this.hideLoading();
    }
  }

  /**
   * Show login modal
   */
  show(): void {
    if (this.modal) {
      this.modal.classList.remove("hidden");
      this.modal.classList.add("active");

      // Focus on username field
      const usernameInput = this.modal.querySelector(
        "#login-username"
      ) as HTMLInputElement;
      if (usernameInput) {
        setTimeout(() => usernameInput.focus(), 100);
      }
    }
  }

  /**
   * Hide login modal
   */
  hide(): void {
    if (this.modal) {
      this.modal.classList.remove("active");
      this.modal.classList.add("hidden");
      this.hideError();
    }
  }

  /**
   * Register callback for successful login
   */
  onLoginSuccess(callback: () => void): void {
    this.loginSuccessCallback = callback;
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (this.errorElement) {
      this.errorElement.textContent = message;
      this.errorElement.classList.remove("hidden");
    }
  }

  /**
   * Hide error message
   */
  private hideError(): void {
    if (this.errorElement) {
      this.errorElement.classList.add("hidden");
      this.errorElement.textContent = "";
    }
  }

  /**
   * Show loading state on submit button
   */
  private showLoading(): void {
    const submitButton = this.form?.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Iniciando sesión...";
    }
  }

  /**
   * Hide loading state on submit button
   */
  private hideLoading(): void {
    const submitButton = this.form?.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Iniciar Sesión";
    }
  }
}
