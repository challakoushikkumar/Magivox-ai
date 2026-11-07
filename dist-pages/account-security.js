import { auth } from './firebase-auth.js';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, verifyPasswordResetCode, confirmPasswordReset } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { enhancePasswords, bindPasswordRules, validPassword, PASSWORD_MESSAGE, passwordChangeError } from './password-policy.js';

export async function changeAccountPassword(user, current, next, confirm) {
  if (!user || auth.currentUser?.uid !== user.uid) throw Object.assign(new Error(), { code: 'auth/user-token-expired' });
  if (!validPassword(next)) throw Object.assign(new Error(), { code: 'auth/weak-password' });
  if (next !== confirm) throw new Error('Passwords do not match.');
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current));
  if (auth.currentUser?.uid !== user.uid) throw Object.assign(new Error(), { code: 'auth/user-token-expired' });
  await updatePassword(user, next);
}

export function mountAccountSecurity(container, user) {
  container.innerHTML = '<h3>Change Password</h3>';
  if (!user) { container.innerHTML += '<p><a href="login.html">Log in</a> to manage your password.</p>'; return; }
  if (!user.providerData.some(provider => provider.providerId === 'password')) {
    container.innerHTML += '<p>You sign in with Google. Manage your password in your Google Account.</p><a class="tool-button-secondary" href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google Account security</a>'; return;
  }
  container.innerHTML += `<form id="changePasswordForm"><label for="currentPassword">Current password</label><input class="tool-input" id="currentPassword" type="password" autocomplete="current-password" required>
    <label for="newPassword">New password</label><input class="tool-input" id="newPassword" type="password" autocomplete="new-password" minlength="8" aria-describedby="changePasswordRules" required>
    <ul id="changePasswordRules" class="password-rules"></ul>
    <label for="repeatNewPassword">Confirm new password</label><input class="tool-input" id="repeatNewPassword" type="password" autocomplete="new-password" required>
    <button class="tool-button" id="changePasswordSubmit" type="submit">Update password</button><p id="changePasswordStatus" role="status" class="inline-message"></p></form>`;
  const el = s => container.querySelector(s);
  enhancePasswords(container);
  const updateRules = bindPasswordRules(el('#newPassword'), el('#changePasswordRules'), el('#repeatNewPassword'), el('#changePasswordSubmit'));
  let busy = false;
  el('form').onsubmit = async event => {
    event.preventDefault(); if (busy) return;
    const next = el('#newPassword').value;
    if (!validPassword(next)) { el('#changePasswordStatus').textContent = PASSWORD_MESSAGE; return; }
    if (next !== el('#repeatNewPassword').value) { el('#changePasswordStatus').textContent = 'Passwords do not match.'; return; }
    busy = true; const controls = [...el('form').querySelectorAll('input,button')]; controls.forEach(control => control.disabled = true);
    el('#changePasswordStatus').textContent = 'Verifying your current password…';
    try {
      await changeAccountPassword(user, el('#currentPassword').value, next, el('#repeatNewPassword').value);
      el('form').reset(); el('#changePasswordStatus').textContent = 'Password updated successfully. Use your new password next time you log in.';
    } catch (error) { el('#changePasswordStatus').textContent = passwordChangeError(error); }
    finally { el('#currentPassword').value = ''; busy = false; controls.forEach(control => control.disabled = false); updateRules(); }
  };
}

export async function mountPasswordReset(container) {
  const params = new URLSearchParams(location.search), code = params.get('oobCode');
  container.innerHTML = '<p role="status">Checking your reset link…</p>';
  try {
    if (params.get('mode') !== 'resetPassword' || !code) throw Object.assign(new Error(), { code: 'auth/invalid-action-code' });
    await verifyPasswordResetCode(auth, code);
    container.innerHTML = `<form><label for="resetPassword">New password</label><input id="resetPassword" class="tool-input" type="password" autocomplete="new-password" aria-describedby="resetRules" minlength="8" required><ul id="resetRules" class="password-rules"></ul><label for="resetConfirm">Confirm new password</label><input id="resetConfirm" class="tool-input" type="password" autocomplete="new-password" required><button class="tool-button" type="submit">Reset password</button><p role="status" class="inline-message"></p></form>`;
    const el = s => container.querySelector(s); enhancePasswords(container);
    const update = bindPasswordRules(el('#resetPassword'), el('#resetRules'), el('#resetConfirm'), el('button[type="submit"]'));
    let busy = false;
    el('form').onsubmit = async event => {
      event.preventDefault(); if (busy || !validPassword(el('#resetPassword').value) || el('#resetPassword').value !== el('#resetConfirm').value) return;
      busy = true; const controls = [...container.querySelectorAll('input,button')]; controls.forEach(control => control.disabled = true);
      el('[role="status"]').textContent = 'Updating password…';
      try {
        await confirmPasswordReset(auth, code, el('#resetPassword').value);
        history.replaceState(null, '', location.pathname);
        container.innerHTML = '<p role="status">Password reset successfully.</p><a class="tool-button" href="login.html">Log in</a>';
      } catch (error) { el('[role="status"]').textContent = passwordChangeError(error); controls.forEach(control => control.disabled = false); update(); busy = false; }
    };
  } catch (error) { container.textContent = passwordChangeError(error); }
}
