export const PASSWORD_RULES = [
  ['length', '8+ characters', value => value.length >= 8],
  ['uppercase', 'Uppercase letter (A–Z)', value => /[A-Z]/.test(value)],
  ['lowercase', 'Lowercase letter (a–z)', value => /[a-z]/.test(value)],
  ['number', 'Number (0–9)', value => /[0-9]/.test(value)],
  ['at', '@ symbol', value => value.includes('@')]
];
export function passwordChecks(value = '') {
  return PASSWORD_RULES.map(([id, label, check]) => ({ id, label, valid: check(String(value)) }));
}
export function validPassword(value) { return typeof value === 'string' && passwordChecks(value).every(rule => rule.valid); }
export const PASSWORD_MESSAGE = 'Use 8+ characters with uppercase, lowercase, a number and @.';
export function passwordChangeError(error) {
  switch (error?.code) {
    case 'auth/invalid-credential': case 'auth/wrong-password': return 'Your current password is incorrect. Please try again.';
    case 'auth/weak-password': case 'auth/password-does-not-meet-requirements': return PASSWORD_MESSAGE;
    case 'auth/requires-recent-login': case 'auth/user-token-expired': case 'auth/invalid-user-token': case 'auth/user-disabled': return 'Your session has expired. Log in again before changing your password.';
    case 'auth/network-request-failed': return 'Check your connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/expired-action-code': case 'auth/invalid-action-code': return 'This reset link is invalid or expired. Request a new link from Log in.';
    default: return 'The password could not be updated. Please try again.';
  }
}

export function enhancePasswords(root = document) {
  root.querySelectorAll('input[type="password"]').forEach(input => {
    if (input.dataset.passwordEnhanced) return;
    input.dataset.passwordEnhanced = 'true';
    const wrapper = document.createElement('div'); wrapper.className = 'password-field';
    input.before(wrapper); wrapper.append(input);
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'password-eye';
    toggle.setAttribute('aria-controls', input.id);
    const update = () => {
      const visible = input.type === 'text';
      toggle.setAttribute('aria-label', `${visible ? 'Hide' : 'Show'} password`);
      toggle.setAttribute('aria-pressed', String(visible));
      toggle.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>${visible ? '<path d="m3 3 18 18"/>' : ''}</svg>`;
    };
    toggle.onclick = () => { input.type = input.type === 'password' ? 'text' : 'password'; update(); };
    update(); wrapper.append(toggle);
  });
}

export function bindPasswordRules(input, checklist, confirm, submit) {
  const mismatch = confirm ? document.createElement('p') : null;
  if (mismatch) {
    mismatch.id = `${confirm.id}Match`; mismatch.className = 'password-match'; mismatch.setAttribute('role', 'status');
    (confirm.closest('.password-field') || confirm).after(mismatch); confirm.setAttribute('aria-describedby', mismatch.id);
  }
  const update = () => {
    const checks = passwordChecks(input.value);
    checklist.innerHTML = checks.map(rule => `<li class="${rule.valid ? 'met' : ''}"><span aria-hidden="true">${rule.valid ? '✓' : '○'}</span> ${rule.label}<span class="sr-only"> — ${rule.valid ? 'met' : 'not met'}</span></li>`).join('');
    input.setCustomValidity(input.value && !validPassword(input.value) ? PASSWORD_MESSAGE : '');
    confirm?.setCustomValidity(confirm.value && confirm.value !== input.value ? 'Passwords do not match.' : '');
    if (mismatch) mismatch.textContent = confirm.value && confirm.value !== input.value ? 'Passwords do not match.' : '';
    if (submit) submit.disabled = !validPassword(input.value) || (confirm && confirm.value !== input.value);
  };
  input.addEventListener('input', update); confirm?.addEventListener('input', update); update();
  return update;
}
