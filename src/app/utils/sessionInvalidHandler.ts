/**
 * Handler global para "sesión inválida" (token expirado/revocado, refresh fallido).
 * Permite que ApiService notifique al AuthContext sin acoplamiento directo.
 */

let sessionInvalidHandler: (() => void) | null = null;

export function registerSessionInvalidHandler(handler: () => void): void {
  sessionInvalidHandler = handler;
}

export function unregisterSessionInvalidHandler(): void {
  sessionInvalidHandler = null;
}

export function triggerSessionInvalid(): void {
  if (sessionInvalidHandler) {
    sessionInvalidHandler();
  }
}
