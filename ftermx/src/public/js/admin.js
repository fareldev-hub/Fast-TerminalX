// ─── Admin panel JS ───────────────────────────────────────────────────────────

function fmtUptime(secs) {
    if (!secs) return '0s';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

// Convert duration shorthand (e.g. "7d") to an ISO expireAt timestamp string
function durationToExpireAt(val) {
    if (!val) return null;
    const num = parseInt(val);
    const unit = val.slice(-1);
    const ms = unit === 'h' ? num * 3600000
              : unit === 'd' ? num * 86400000
              : 0;
    return ms ? new Date(Date.now() + ms).toISOString() : null;
}

// Format expireAt timestamp into a readable label + CSS class
function fmtExpiry(expireAt) {
    if (!expireAt) return { label: '—', cls: 'expiry-never' };
    const diff = new Date(expireAt).getTime() - Date.now();
    if (diff <= 0) return { label: 'Expired', cls: 'expiry-soon' };
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    const label = d >= 1 ? `${d}d left` : `${h}h left`;
    return { label, cls: d < 1 ? 'expiry-soon' : 'expiry-ok' };
}

// ─── Tunnel stats ─────────────────────────────────────────────────────────────
window.loadTunnelStats = async function () {
    try {
        const res = await fetch('/api/tunnel/stats');
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('statStatus').textContent = data.active ? '🟢 Online' : '⚫ Offline';
        document.getElementById('statType').textContent = data.type || '—';
        document.getElementById('statUptime').textContent = fmtUptime(data.uptime);
        document.getElementById('statSessions').textContent = data.sessions ?? '—';

        const urlRow = document.getElementById('statUrlRow');
        const statUrl = document.getElementById('statUrl');
        if (data.url) {
            urlRow.style.display = 'flex';
            statUrl.textContent = data.url;
            document.getElementById('copyStatUrl').onclick = () =>
                navigator.clipboard.writeText(data.url).catch(() => {});
        } else {
            urlRow.style.display = 'none';
        }
    } catch (_) {}
};

// ─── User table ───────────────────────────────────────────────────────────────
async function loadUserTable() {
    const container = document.getElementById('userTable');
    if (!container) return;
    container.innerHTML = '<div class="user-table-loading"><i class="fas fa-spinner fa-spin"></i> Loading…</div>';
    try {
        const res = await fetch('/api/users');
        if (!res.ok) { container.innerHTML = '<div class="user-table-loading">Failed to load users</div>'; return; }
        const users = await res.json();

        if (!users.length) { container.innerHTML = '<div class="user-table-loading">No users found</div>'; return; }

        container.innerHTML = `
          <div class="user-table-head">
            <span>Username</span>
            <span>Role</span>
            <span>Expiry</span>
            <span></span>
          </div>
          ${users.map(u => {
              const { label, cls } = fmtExpiry(u.expireAt);
              return `
            <div class="user-row" data-username="${u.username}">
              <span class="user-row-name"><i class="fas fa-user"></i> ${u.username}</span>
              <span class="user-row-role role-${u.role}">${u.role}</span>
              <span class="user-row-expiry">
                <span class="expiry-badge ${cls}">
                  ${cls !== 'expiry-never' ? '<i class="fas fa-clock"></i>' : ''}
                  ${label}
                </span>
              </span>
              <span class="user-row-actions">
                <button class="btn btn-small btn-edit user-edit-btn" data-username="${u.username}"
                        data-expireat="${u.expireAt || ''}" title="Edit user">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="btn btn-small btn-danger user-delete-btn" data-username="${u.username}" title="Delete user">
                  <i class="fas fa-trash"></i>
                </button>
              </span>
            </div>`;
          }).join('')}
        `;

        container.querySelectorAll('.user-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditUser(btn.dataset.username, btn.dataset.expireat));
        });

        container.querySelectorAll('.user-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const username = btn.dataset.username;
                const ok = await FxConfirm(`Remove account "${username}" permanently?`, {
                    title: 'Delete User',
                    confirmLabel: 'Delete',
                    type: 'danger'
                });
                if (!ok) return;
                try {
                    const r = await fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
                    const d = await r.json();
                    if (r.ok) { FxToast('User deleted', 'success'); loadUserTable(); }
                    else FxAlert(d.error || 'Failed to delete user', { type: 'danger', title: 'Error' });
                } catch { FxAlert('Network error', { type: 'danger', title: 'Error' }); }
            });
        });
    } catch {
        container.innerHTML = '<div class="user-table-loading">Error loading users</div>';
    }
}

// ─── Edit user modal ──────────────────────────────────────────────────────────
let _editTarget = null;

function openEditUser(username, expireAt) {
    _editTarget = username;
    document.getElementById('editUserTarget').textContent = username;
    document.getElementById('editUsername').value = '';
    document.getElementById('editPassword').value = '';
    document.getElementById('editExpiry').value = '';
    document.getElementById('editUserError').classList.add('hidden');
    document.getElementById('editUserModalOverlay').classList.remove('hidden');
    document.getElementById('editUsername').focus();
}

function closeEditUser() {
    document.getElementById('editUserModalOverlay').classList.add('hidden');
    _editTarget = null;
}

// ─── Boot (admin only) ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const refreshBtn = document.getElementById('refreshTunnelStats');
    if (refreshBtn) refreshBtn.addEventListener('click', window.loadTunnelStats);

    // ── Add user dialog ──────────────────────────────────────────────────────
    const addUserOverlay = document.getElementById('addUserModalOverlay');
    const openAddUser = () => {
        addUserOverlay.classList.remove('hidden');
        document.getElementById('newUsername').focus();
        document.getElementById('addUserError').classList.add('hidden');
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newRole').value = 'user';
        document.getElementById('newExpiry').value = '';
    };
    const closeAddUser = () => addUserOverlay.classList.add('hidden');

    document.getElementById('openAddUser')?.addEventListener('click', openAddUser);
    document.getElementById('closeAddUserModal')?.addEventListener('click', closeAddUser);
    document.getElementById('cancelAddUserBtn')?.addEventListener('click', closeAddUser);
    addUserOverlay?.addEventListener('click', e => { if (e.target === addUserOverlay) closeAddUser(); });

    document.getElementById('confirmAddUserBtn')?.addEventListener('click', async () => {
        const username  = document.getElementById('newUsername').value.trim();
        const password  = document.getElementById('newPassword').value;
        const role      = document.getElementById('newRole').value;
        const expiryVal = document.getElementById('newExpiry').value;
        const errEl     = document.getElementById('addUserError');
        errEl.classList.add('hidden');

        if (!username || !password) {
            errEl.textContent = 'Username and password are required';
            errEl.classList.remove('hidden');
            return;
        }

        const body = { username, password, role };
        const expireAt = durationToExpireAt(expiryVal);
        if (expireAt) body.expireAt = expireAt;

        try {
            const res  = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (res.ok) { closeAddUser(); loadUserTable(); }
            else { errEl.textContent = data.error || 'Failed to add user'; errEl.classList.remove('hidden'); }
        } catch { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
    });

    // ── Edit user dialog ─────────────────────────────────────────────────────
    const editOverlay = document.getElementById('editUserModalOverlay');
    document.getElementById('closeEditUserModal')?.addEventListener('click', closeEditUser);
    document.getElementById('cancelEditUserBtn')?.addEventListener('click', closeEditUser);
    editOverlay?.addEventListener('click', e => { if (e.target === editOverlay) closeEditUser(); });

    document.getElementById('confirmEditUserBtn')?.addEventListener('click', async () => {
        if (!_editTarget) return;
        const newUsername = document.getElementById('editUsername').value.trim();
        const newPassword = document.getElementById('editPassword').value;
        const expiryVal   = document.getElementById('editExpiry').value;
        const errEl       = document.getElementById('editUserError');
        errEl.classList.add('hidden');

        if (!newUsername && !newPassword && expiryVal === '') {
            errEl.textContent = 'Nothing to update — fill at least one field';
            errEl.classList.remove('hidden');
            return;
        }

        const body = {};
        if (newUsername) body.username = newUsername;
        if (newPassword) body.password = newPassword;
        // Always send expireAt so admin can set it to "Never"
        body.expireAt = durationToExpireAt(expiryVal);

        try {
            const res  = await fetch(`/api/users/${encodeURIComponent(_editTarget)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (res.ok) { closeEditUser(); loadUserTable(); }
            else { errEl.textContent = data.error || 'Failed to update user'; errEl.classList.remove('hidden'); }
        } catch { errEl.textContent = 'Network error'; errEl.classList.remove('hidden'); }
    });

    // ── Load user table when admin page is navigated to ──────────────────────
    const adminPage = document.getElementById('pagAdmin');
    if (adminPage) {
        const observer = new MutationObserver(() => {
            if (adminPage.classList.contains('active')) loadUserTable();
        });
        observer.observe(adminPage, { attributes: true, attributeFilter: ['class'] });
    }
});
