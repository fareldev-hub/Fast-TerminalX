// ─── Ftermx Custom Dialog System ─────────────────────────────────────────────
// FxAlert(message, opts?)  → Promise<void>
// FxConfirm(message, opts?) → Promise<boolean>
// opts: { title, icon, type: 'danger'|'warning'|'info'|'success' }

(function () {
    'use strict';

    // ── Inject styles once ────────────────────────────────────────────────────
    const STYLE_ID = 'fx-dialog-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
/* ── FxDialog backdrop ── */
.fx-dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(3, 5, 9, 0.72);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.18s ease;
}
.fx-dialog-backdrop.fx-visible {
    opacity: 1;
}

/* ── Dialog card ── */
.fx-dialog {
    position: relative;
    min-width: 320px;
    max-width: 440px;
    width: 100%;
    background: rgba(8, 12, 24, 0.97);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 16px;
    box-shadow:
        0 0 0 1px rgba(0, 212, 255, 0.06),
        0 8px 48px rgba(0, 0, 0, 0.7),
        0 0 40px rgba(0, 212, 255, 0.08);
    transform: scale(0.88) translateY(12px);
    transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
    opacity: 0;
    overflow: hidden;
}
.fx-dialog-backdrop.fx-visible .fx-dialog {
    transform: scale(1) translateY(0);
    opacity: 1;
}

/* Top accent bar */
.fx-dialog::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--fx-accent, #00d4ff), transparent);
}

/* ── Icon area ── */
.fx-dialog-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 24px 6px;
}
.fx-dialog-icon {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    background: var(--fx-icon-bg, rgba(0, 212, 255, 0.1));
    color: var(--fx-accent, #00d4ff);
    box-shadow: 0 0 20px var(--fx-glow, rgba(0, 212, 255, 0.2));
    animation: fx-icon-pulse 2.4s ease-in-out infinite;
}
@keyframes fx-icon-pulse {
    0%, 100% { box-shadow: 0 0 18px var(--fx-glow, rgba(0, 212, 255, 0.2)); }
    50%       { box-shadow: 0 0 30px var(--fx-glow, rgba(0, 212, 255, 0.35)); }
}

/* ── Text ── */
.fx-dialog-body {
    padding: 12px 28px 8px;
    text-align: center;
}
.fx-dialog-title {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 700;
    color: #e2eaf5;
    margin-bottom: 8px;
    letter-spacing: 0.2px;
}
.fx-dialog-message {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: #7a8fa6;
    line-height: 1.6;
    word-break: break-word;
}

/* ── Divider ── */
.fx-dialog-divider {
    height: 1px;
    margin: 20px 0 0;
    background: rgba(255, 255, 255, 0.05);
}

/* ── Footer buttons ── */
.fx-dialog-footer {
    display: flex;
    gap: 10px;
    padding: 16px 24px 20px;
    justify-content: flex-end;
}
.fx-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 9px 20px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.18s ease;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    letter-spacing: 0.3px;
    outline: none;
}
.fx-btn:active { transform: scale(0.96); }

/* Cancel / neutral */
.fx-btn-neutral {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
    color: #7a8fa6;
}
.fx-btn-neutral:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.14);
    color: #e2eaf5;
}

/* Confirm / primary variants */
.fx-btn-danger {
    background: rgba(255, 61, 90, 0.12);
    border-color: rgba(255, 61, 90, 0.35);
    color: #ff3d5a;
}
.fx-btn-danger:hover {
    background: rgba(255, 61, 90, 0.22);
    border-color: #ff3d5a;
    box-shadow: 0 0 12px rgba(255, 61, 90, 0.3);
    color: #ff6b7a;
}
.fx-btn-info {
    background: rgba(0, 212, 255, 0.10);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
}
.fx-btn-info:hover {
    background: rgba(0, 212, 255, 0.18);
    border-color: #00d4ff;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    color: #47dfff;
}
.fx-btn-success {
    background: rgba(0, 255, 136, 0.10);
    border-color: rgba(0, 255, 136, 0.3);
    color: #00ff88;
}
.fx-btn-success:hover {
    background: rgba(0, 255, 136, 0.18);
    border-color: #00ff88;
    box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
    color: #39ffa0;
}
.fx-btn-warning {
    background: rgba(255, 209, 102, 0.10);
    border-color: rgba(255, 209, 102, 0.3);
    color: #ffd166;
}
.fx-btn-warning:hover {
    background: rgba(255, 209, 102, 0.18);
    border-color: #ffd166;
    box-shadow: 0 0 12px rgba(255, 209, 102, 0.3);
    color: #ffe066;
}

/* Dismiss animation */
.fx-dialog-backdrop.fx-hiding {
    opacity: 0;
}
.fx-dialog-backdrop.fx-hiding .fx-dialog {
    transform: scale(0.92) translateY(8px);
    opacity: 0;
}

/* ── Scan-line accent inside dialog ── */
.fx-dialog-scan {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px
    );
    pointer-events: none;
    border-radius: 16px;
}
`;
        document.head.appendChild(style);
    }

    // ── Theme config by type ──────────────────────────────────────────────────
    const THEMES = {
        danger: {
            accent:  '#ff3d5a',
            glow:    'rgba(255,61,90,0.22)',
            iconBg:  'rgba(255,61,90,0.10)',
            icon:    'fa-triangle-exclamation',
            btnCls:  'fx-btn-danger',
        },
        warning: {
            accent:  '#ffd166',
            glow:    'rgba(255,209,102,0.22)',
            iconBg:  'rgba(255,209,102,0.10)',
            icon:    'fa-circle-exclamation',
            btnCls:  'fx-btn-warning',
        },
        success: {
            accent:  '#00ff88',
            glow:    'rgba(0,255,136,0.22)',
            iconBg:  'rgba(0,255,136,0.10)',
            icon:    'fa-circle-check',
            btnCls:  'fx-btn-success',
        },
        info: {
            accent:  '#00d4ff',
            glow:    'rgba(0,212,255,0.22)',
            iconBg:  'rgba(0,212,255,0.10)',
            icon:    'fa-circle-info',
            btnCls:  'fx-btn-info',
        },
    };

    // ── Build backdrop DOM ────────────────────────────────────────────────────
    function buildBackdrop(theme, { title, message, buttons }) {
        const t = THEMES[theme] || THEMES.info;

        const backdrop = document.createElement('div');
        backdrop.className = 'fx-dialog-backdrop';

        const btnsHtml = buttons.map((b, i) =>
            `<button class="fx-btn ${b.cls}" data-idx="${i}">${b.icon ? `<i class="fas ${b.icon}"></i>` : ''}${b.label}</button>`
        ).join('');

        backdrop.innerHTML = `
          <div class="fx-dialog" style="
            --fx-accent:${t.accent};
            --fx-glow:${t.glow};
            --fx-icon-bg:${t.iconBg};
          ">
            <div class="fx-dialog-scan"></div>
            <div class="fx-dialog-icon-wrap">
              <div class="fx-dialog-icon"><i class="fas ${t.icon}"></i></div>
            </div>
            <div class="fx-dialog-body">
              <div class="fx-dialog-title">${escHtml(title)}</div>
              <div class="fx-dialog-message">${escHtml(message)}</div>
            </div>
            <div class="fx-dialog-divider"></div>
            <div class="fx-dialog-footer">${btnsHtml}</div>
          </div>`;

        return backdrop;
    }

    function escHtml(str) {
        return String(str || '')
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Animate out + remove ──────────────────────────────────────────────────
    function dismissBackdrop(backdrop, cb) {
        backdrop.classList.add('fx-hiding');
        setTimeout(() => {
            backdrop.remove();
            if (cb) cb();
        }, 200);
    }

    // ── FxAlert ───────────────────────────────────────────────────────────────
    window.FxAlert = function (message, opts = {}) {
        return new Promise((resolve) => {
            const type  = opts.type  || 'info';
            const title = opts.title || (type === 'danger' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Done' : 'Notice');

            const backdrop = buildBackdrop(type, {
                title,
                message,
                buttons: [
                    { label: 'OK', cls: (THEMES[type] || THEMES.info).btnCls, icon: 'fa-check' }
                ]
            });

            document.body.appendChild(backdrop);
            requestAnimationFrame(() => backdrop.classList.add('fx-visible'));

            const onKey = (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') close();
            };
            document.addEventListener('keydown', onKey);

            function close() {
                document.removeEventListener('keydown', onKey);
                dismissBackdrop(backdrop, resolve);
            }

            backdrop.querySelector('.fx-btn').addEventListener('click', close);
            backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
        });
    };

    // ── FxConfirm ────────────────────────────────────────────────────────────
    window.FxConfirm = function (message, opts = {}) {
        return new Promise((resolve) => {
            const type        = opts.type        || 'danger';
            const title       = opts.title       || 'Are you sure?';
            const confirmLabel = opts.confirmLabel || 'Confirm';
            const cancelLabel  = opts.cancelLabel  || 'Cancel';

            const t = THEMES[type] || THEMES.danger;

            const backdrop = buildBackdrop(type, {
                title,
                message,
                buttons: [
                    { label: cancelLabel,  cls: 'fx-btn-neutral' },
                    { label: confirmLabel, cls: t.btnCls, icon: type === 'danger' ? 'fa-trash' : 'fa-check' }
                ]
            });

            document.body.appendChild(backdrop);
            requestAnimationFrame(() => backdrop.classList.add('fx-visible'));

            const onKey = (e) => {
                if (e.key === 'Escape') dismiss(false);
                if (e.key === 'Enter')  dismiss(true);
            };
            document.addEventListener('keydown', onKey);

            function dismiss(result) {
                document.removeEventListener('keydown', onKey);
                dismissBackdrop(backdrop, () => resolve(result));
            }

            const [cancelBtn, confirmBtn] = backdrop.querySelectorAll('.fx-btn');
            cancelBtn.addEventListener('click',  () => dismiss(false));
            confirmBtn.addEventListener('click', () => dismiss(true));
            backdrop.addEventListener('click', (e) => { if (e.target === backdrop) dismiss(false); });
        });
    };

    // ── FxToast (bonus: lightweight non-blocking notification) ────────────────
    // FxToast(message, type?, duration?)
    window.FxToast = function (message, type = 'info', duration = 3200) {
        const t = THEMES[type] || THEMES.info;

        let container = document.getElementById('fx-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'fx-toast-container';
            container.style.cssText = `
                position:fixed;bottom:24px;right:24px;z-index:99998;
                display:flex;flex-direction:column;gap:10px;pointer-events:none;`;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.style.cssText = `
            font-family:'JetBrains Mono',monospace;
            font-size:12px;font-weight:600;
            padding:11px 18px;
            border-radius:10px;
            background:rgba(8,12,24,0.97);
            border:1px solid ${t.accent}44;
            color:${t.accent};
            box-shadow:0 0 20px ${t.glow},0 4px 20px rgba(0,0,0,0.5);
            display:flex;align-items:center;gap:9px;
            pointer-events:auto;
            opacity:0;
            transform:translateX(24px);
            transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);
            max-width:320px;
            cursor:pointer;`;
        toast.innerHTML = `<i class="fas ${t.icon}" style="flex-shrink:0;font-size:14px"></i><span>${escHtml(message)}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        });

        const dismiss = () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(24px)';
            setTimeout(() => toast.remove(), 220);
        };

        toast.addEventListener('click', dismiss);
        setTimeout(dismiss, duration);
    };

})();
