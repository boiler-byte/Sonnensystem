/** Keep visual, accessible and tooltip state in sync for switch-like controls. */
export function syncToggleState(button, enabled, title) {
  button.classList.toggle('active', enabled);
  button.setAttribute('aria-pressed', String(enabled));
  if (title !== undefined) button.title = title;
}
