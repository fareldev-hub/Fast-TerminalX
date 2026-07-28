// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║   ███████╗ █████╗ ██████╗ ███████╗██╗     ██████╗ ███████╗██╗   ██╗    ║
// ║   ██╔════╝██╔══██╗██╔══██╗██╔════╝██║     ██╔══██╗██╔════╝██║   ██║    ║
// ║   █████╗  ███████║██████╔╝█████╗  ██║     ██║  ██║█████╗  ██║   ██║    ║
// ║   ██╔══╝  ██╔══██║██╔══██╗██╔══╝  ██║     ██║  ██║██╔══╝  ╚██╗ ██╔╝    ║
// ║   ██║     ██║  ██║██║  ██║███████╗███████╗██████╔╝███████╗  ╚████╔╝     ║
// ║   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═════╝ ╚══════╝   ╚═══╝      ║
// ║                                                                          ║
// ║                      ✦  Source By FarelDev  ✦                           ║
// ║                  ──────────────────────────────────                      ║
// ║               Copyright © 2026 FarelDev. All Rights Reserved.           ║
// ║              Licensed under the Apache License, Version 2.0             ║
// ║                   See LICENSE file for full details.                     ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

(function () {
    'use strict';

    let fmCurrentPath = '/';
    let fmUserRoot = '/';
    let fmSelectMode = false;
    let fmSelected = new Set();
    let fmEntries = [];

    
    const EXT_LANG = {
        '.js':'javascript',  '.mjs':'javascript',  '.cjs':'javascript',
        '.ts':'typescript',  '.tsx':'typescript',
        '.py':'python',      '.pyw':'python',
        '.html':'html',      '.htm':'html',
        '.css':'css',        '.scss':'scss',  '.sass':'scss', '.less':'less',
        '.json':'json',      '.jsonc':'json',
        '.xml':'xml',        '.svg':'xml',
        '.yml':'yaml',       '.yaml':'yaml',
        '.toml':'ini',       '.ini':'ini',  '.conf':'ini', '.cfg':'ini',
        '.sh':'bash',        '.bash':'bash', '.zsh':'bash', '.fish':'bash',
        '.md':'markdown',
        '.sql':'sql',
        '.go':'go',
        '.rs':'rust',
        '.java':'java',
        '.c':'c',   '.h':'c',
        '.cpp':'cpp', '.cxx':'cpp', '.cc':'cpp', '.hpp':'cpp',
        '.php':'php',
        '.rb':'ruby',
        '.kt':'kotlin', '.kts':'kotlin',
        '.swift':'swift',
        '.r':'r',
        '.lua':'lua',
        '.dockerfile':'dockerfile',
        '.env':'bash',
        '.log':'plaintext', '.txt':'plaintext', '.csv':'plaintext',
    };

    
    const ACE_LANG = {
        '.js':'javascript',  '.mjs':'javascript',  '.cjs':'javascript',
        '.ts':'typescript',  '.tsx':'typescript',
        '.py':'python',      '.pyw':'python',
        '.html':'html',      '.htm':'html',
        '.css':'css',        '.scss':'scss',  '.sass':'scss', '.less':'less',
        '.json':'json',      '.jsonc':'json',
        '.xml':'xml',        '.svg':'xml',
        '.yml':'yaml',       '.yaml':'yaml',
        '.toml':'toml',      '.ini':'ini',  '.conf':'ini',  '.cfg':'ini',
        '.sh':'sh',          '.bash':'sh',   '.zsh':'sh',   '.fish':'sh',
        '.md':'markdown',
        '.sql':'sql',
        '.go':'golang',
        '.rs':'rust',
        '.java':'java',
        '.c':'c_cpp',        '.h':'c_cpp',
        '.cpp':'c_cpp',      '.cxx':'c_cpp', '.cc':'c_cpp', '.hpp':'c_cpp',
        '.php':'php',
        '.rb':'ruby',
        '.kt':'kotlin',      '.kts':'kotlin',
        '.swift':'swift',
        '.r':'r',
        '.lua':'lua',
        '.dockerfile':'dockerfile',
        '.env':'sh',
        '.log':'text',       '.txt':'text',  '.csv':'text',
    };

    const TEXT_EXTS = new Set(Object.keys(EXT_LANG));
    const IMG_EXTS  = new Set(['.png','.jpg','.jpeg','.gif','.svg','.webp','.bmp','.ico','.avif']);
    const VID_EXTS  = new Set(['.mp4','.webm','.ogv','.mov','.avi','.mkv']);
    const AUD_EXTS  = new Set(['.mp3','.wav','.oga','.flac','.aac','.opus','.m4a']);
    const ZIP_EXTS  = new Set(['.zip','.tar','.gz','.tgz','.bz2','.xz','.7z','.rar']);

    
    
    const _iconEntries = [
        [['fa-brands fa-js'],          ['.js','.mjs','.cjs']],
        [['fa-brands fa-js'],          ['.ts','.tsx']],
        [['fa-brands fa-python'],      ['.py','.pyw']],
        [['fa-brands fa-html5'],       ['.html','.htm']],
        [['fa-brands fa-css3-alt'],    ['.css','.scss','.sass','.less']],
        [['fa-solid fa-code'],         ['.json','.jsonc','.rs','.go','.java','.c','.h','.cpp','.cxx','.cc','.hpp','.kt','.kts','.swift','.r','.lua','.rb','.xml']],
        [['fa-solid fa-file-lines'],   ['.md','.txt','.log','.csv']],
        [['fa-solid fa-terminal'],     ['.sh','.bash','.zsh','.fish']],
        [['fa-solid fa-gear'],         ['.env','.yml','.yaml','.toml','.ini','.conf','.cfg','.dockerfile']],
        [['fa-solid fa-database'],     ['.sql']],
        [['fa-brands fa-php'],         ['.php']],
        [['fa-solid fa-file-zipper'],  ['.zip','.tar','.gz','.tgz','.bz2','.xz','.7z','.rar']],
        [['fa-solid fa-file-image'],   ['.png','.jpg','.jpeg','.gif','.svg','.webp','.bmp','.ico','.avif']],
        [['fa-solid fa-file-video'],   ['.mp4','.webm','.ogv','.mov','.avi','.mkv']],
        [['fa-solid fa-file-audio'],   ['.mp3','.wav','.oga','.flac','.aac','.opus','.m4a']],
        [['fa-solid fa-file-pdf'],     ['.pdf']],
        [['fa-solid fa-file-word'],    ['.doc','.docx']],
        [['fa-solid fa-file-excel'],   ['.xls','.xlsx']],
    ];
    const extIconMap = {};
    for (const [[icon], exts] of _iconEntries) {
        for (const ext of exts) extIconMap[ext] = icon;
    }

    function getFileIcon(entry) {
        if (entry.type === 'dir') return 'fa-solid fa-folder';
        return extIconMap[entry.ext] || 'fa-solid fa-file';
    }

    function getFileIconColor(entry) {
        if (entry.type === 'dir') return 'var(--neon-orange)';
        const e = entry.ext;
        if (ZIP_EXTS.has(e)) return 'var(--neon-purple)';
        if (['.js','.mjs','.cjs'].includes(e)) return '#f7df1e';
        if (['.ts','.tsx'].includes(e)) return '#3178c6';
        if (['.py','.pyw'].includes(e)) return '#3572a5';
        if (['.html','.htm'].includes(e)) return '#e44d26';
        if (['.css','.scss','.sass','.less'].includes(e)) return '#1572b6';
        if (['.php'].includes(e)) return '#8892bf';
        if (['.rb'].includes(e)) return '#cc342d';
        if (['.go'].includes(e)) return '#00acd7';
        if (['.rs'].includes(e)) return '#f74c00';
        if (['.java'].includes(e)) return '#ed8b00';
        if (['.sql'].includes(e)) return '#e38c00';
        if (['.kt','.kts'].includes(e)) return '#7f52ff';
        if (['.swift'].includes(e)) return '#f05138';
        if (IMG_EXTS.has(e)) return 'var(--neon-green)';
        if (VID_EXTS.has(e)) return '#a855f7';
        if (AUD_EXTS.has(e)) return '#ec4899';
        if (['.sh','.bash','.zsh','.fish','.env'].includes(e)) return 'var(--neon-green)';
        if (['.md','.txt','.log','.csv'].includes(e)) return 'var(--text-mid)';
        if (['.json','.yml','.yaml','.toml','.ini','.conf','.cfg'].includes(e)) return 'var(--neon-cyan)';
        return 'var(--text-dim)';
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024, sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function formatDate(ms) {
        if (!ms) return '—';
        return new Date(ms).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g,'&amp;').replace(/</g,'&lt;')
            .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function setStatus(msg) {
        const el = document.getElementById('fmStatusBar');
        if (el) el.textContent = msg;
    }

    function showUploadOverlay(label) {
        let ov = document.getElementById('fmUploadOverlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'fmUploadOverlay';
            ov.className = 'fm-upload-overlay';
            ov.innerHTML = `
              <div class="fm-upload-card">
                <div class="fm-upload-icon"><i class="fas fa-cloud-arrow-up"></i></div>
                <div class="fm-upload-label" id="fmUploadOvLabel">Uploading…</div>
                <div class="fm-upload-pct" id="fmUploadOvPct">0%</div>
                <div class="fm-upload-bar-wrap">
                  <div class="fm-upload-bar" id="fmUploadOvBar" style="width:0%"></div>
                </div>
                <div class="fm-upload-sub" id="fmUploadOvSub"></div>
              </div>`;
            document.body.appendChild(ov);
        }
        document.getElementById('fmUploadOvLabel').textContent = label || 'Uploading…';
        document.getElementById('fmUploadOvPct').textContent = '0%';
        document.getElementById('fmUploadOvBar').style.width = '0%';
        document.getElementById('fmUploadOvSub').textContent = '';
        ov.classList.add('visible');
    }

    function updateUploadOverlay(pct, sub) {
        const bar  = document.getElementById('fmUploadOvBar');
        const pctEl = document.getElementById('fmUploadOvPct');
        const sub2  = document.getElementById('fmUploadOvSub');
        if (bar)  bar.style.width = pct + '%';
        if (pctEl) pctEl.textContent = Math.round(pct) + '%';
        if (sub2 && sub !== undefined) sub2.textContent = sub;
    }

    function hideUploadOverlay() {
        document.getElementById('fmUploadOverlay')?.classList.remove('visible');
    }

    function showContentSpinner(msg) {
        const c = document.getElementById('fmContent');
        if (!c) return;
        let sp = c.querySelector('.fm-spinner-overlay');
        if (!sp) {
            sp = document.createElement('div');
            sp.className = 'fm-spinner-overlay';
            c.appendChild(sp);
        }
        sp.innerHTML = `<div class="fm-spinner-inner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>${escHtml(msg || 'Working…')}</span>
        </div>`;
        sp.style.display = 'flex';
    }

    function hideContentSpinner() {
        document.querySelector('#fmContent .fm-spinner-overlay')?.remove();
    }

    function renderBreadcrumb(p) {
        const el = document.getElementById('fmBreadcrumb');
        if (!el) return;
        const root = fmUserRoot;
        let rel = p;
        if (root !== '/' && p.startsWith(root)) rel = p.slice(root.length) || '/';
        const parts = rel === '/' ? [] : rel.split('/').filter(Boolean);
        let built = root === '/' ? '' : root;
        const items = [{ label: root === '/' ? '/' : '~', path: root }];
        for (const part of parts) {
            built += '/' + part;
            items.push({ label: part, path: built });
        }
        el.innerHTML = items.map((item, i) => {
            const isLast = i === items.length - 1;
            if (isLast) return `<span class="fm-crumb-current">${escHtml(item.label)}</span>`;
            return `<span class="fm-crumb" data-path="${escHtml(item.path)}">${escHtml(item.label)}</span><span class="fm-crumb-sep">/</span>`;
        }).join('');
        el.querySelectorAll('.fm-crumb[data-path]').forEach(crumb => {
            crumb.addEventListener('click', () => fmNavigate(crumb.dataset.path));
        });
    }

    async function fmNavigate(targetPath) {
        setStatus('Loading…');
        try {
            const res = await fetch(`/api/fm/list?path=${encodeURIComponent(targetPath)}`);
            if (!res.ok) { const d = await res.json(); setStatus('Error: ' + (d.error || 'Failed')); return; }
            const data = await res.json();
            fmCurrentPath = data.path;
            fmUserRoot    = data.root;
            fmEntries     = data.entries;
            fmSelected.clear();
            renderEntries();
            renderBreadcrumb(fmCurrentPath);
            setStatus(`${fmEntries.length} item${fmEntries.length !== 1 ? 's' : ''}`);
            const upBtn = document.getElementById('fmUpBtn');
            if (upBtn) upBtn.disabled =
                fmCurrentPath === fmUserRoot || fmCurrentPath === '/';
        } catch (err) { setStatus('Error: ' + err.message); }
    }

    function renderEntries() {
        const container = document.getElementById('fmContent');
        if (!container) return;
        if (fmEntries.length === 0) {
            container.innerHTML = `<div class="fm-empty"><i class="fas fa-folder-open"></i><p>Empty directory</p></div>`;
            return;
        }

        container.innerHTML = `
          <table class="fm-table">
            <thead><tr>
              ${fmSelectMode ? '<th class="fm-col-check"><input type="checkbox" id="fmCheckAll"></th>' : ''}
              <th class="fm-col-name">Name</th>
              <th class="fm-col-size">Size</th>
              <th class="fm-col-date">Modified</th>
              <th class="fm-col-actions"></th>
            </tr></thead>
            <tbody>
            ${fmEntries.map((entry, idx) => {
                const icon  = getFileIcon(entry);
                const color = getFileIconColor(entry);
                const isArchive = entry.type === 'file' && ZIP_EXTS.has(entry.ext);
                const isSelected = fmSelected.has(idx);
                const canEdit = entry.type === 'file' && (TEXT_EXTS.has(entry.ext) || entry.ext === '');
                return `
                <tr class="fm-row ${isSelected ? 'fm-selected' : ''}" data-idx="${idx}">
                  ${fmSelectMode ? `<td class="fm-col-check"><input type="checkbox" class="fm-row-check" data-idx="${idx}" ${isSelected ? 'checked' : ''}></td>` : ''}
                  <td class="fm-col-name">
                    <div class="fm-name-cell">
                      <i class="${icon}" style="color:${color};width:16px;text-align:center;flex-shrink:0"></i>
                      <span class="fm-name">${escHtml(entry.name)}</span>
                    </div>
                  </td>
                  <td class="fm-col-size">${entry.type === 'dir' ? '—' : formatSize(entry.size)}</td>
                  <td class="fm-col-date">${formatDate(entry.mtime)}</td>
                  <td class="fm-col-actions">
                    <div class="fm-row-actions">
                      ${entry.type === 'file' ? `<button class="fm-action-btn" data-action="view" data-idx="${idx}" title="Open"><i class="fas fa-eye"></i></button>` : ''}
                      ${canEdit ? `<button class="fm-action-btn" data-action="edit" data-idx="${idx}" title="Edit"><i class="fas fa-pen-to-square"></i></button>` : ''}
                      ${entry.type === 'file' ? `<button class="fm-action-btn" data-action="download" data-idx="${idx}" title="Download"><i class="fas fa-download"></i></button>` : ''}
                      ${isArchive ? `<button class="fm-action-btn" data-action="extract" data-idx="${idx}" title="Extract"><i class="fas fa-file-zipper"></i></button>` : ''}
                      <button class="fm-action-btn" data-action="rename" data-idx="${idx}" title="Rename"><i class="fas fa-pen"></i></button>
                      <button class="fm-action-btn danger" data-action="delete" data-idx="${idx}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>`;
            }).join('')}
            </tbody>
          </table>`;

        container.querySelectorAll('.fm-row').forEach(row => {
            row.addEventListener('click', e => {
                if (e.target.closest('button,input')) return;
                const idx = parseInt(row.dataset.idx);
                const entry = fmEntries[idx];
                if (fmSelectMode) { toggleSelect(idx); }
                else if (entry.type === 'dir') {
                    fmNavigate(fmCurrentPath === '/' ? '/' + entry.name : fmCurrentPath + '/' + entry.name);
                }
            });
            row.addEventListener('dblclick', async e => {
                if (e.target.closest('button,input')) return;
                const idx = parseInt(row.dataset.idx);
                const entry = fmEntries[idx];
                if (entry.type === 'file') await openFileViewer(entry, false);
            });
        });

        container.querySelectorAll('.fm-action-btn').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const idx = parseInt(btn.dataset.idx);
                const entry = fmEntries[idx];
                const fullPath = (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + entry.name;
                if (action === 'view')     await openFileViewer(entry, false);
                else if (action === 'edit')     await openFileViewer(entry, true);
                else if (action === 'download') window.open(`/api/fm/download?path=${encodeURIComponent(fullPath)}`, '_blank');
                else if (action === 'delete') {
                    const ok = await FxConfirm(`Delete "${entry.name}"?`, {
                        title: 'Delete File',
                        confirmLabel: 'Delete',
                        type: 'danger'
                    });
                    if (!ok) return;
                    await fmDelete([fullPath]);
                }
                else if (action === 'extract') await fmExtract(fullPath);
                else if (action === 'rename')  openRenameDialog(entry.name, fullPath);
            });
        });

        if (fmSelectMode) {
            document.getElementById('fmCheckAll')?.addEventListener('change', e => {
                if (e.target.checked) fmEntries.forEach((_, i) => fmSelected.add(i));
                else fmSelected.clear();
                renderEntries();
                updateSelBar();
            });
            container.querySelectorAll('.fm-row-check').forEach(cb => {
                cb.addEventListener('change', e => {
                    const idx = parseInt(e.target.dataset.idx);
                    if (e.target.checked) fmSelected.add(idx); else fmSelected.delete(idx);
                    updateSelBar();
                    cb.closest('.fm-row').classList.toggle('fm-selected', e.target.checked);
                });
            });
        }
        updateSelBar();
    }

    function toggleSelect(idx) {
        if (fmSelected.has(idx)) fmSelected.delete(idx); else fmSelected.add(idx);
        const row = document.querySelector(`.fm-row[data-idx="${idx}"]`);
        if (row) row.classList.toggle('fm-selected', fmSelected.has(idx));
        const cb = row?.querySelector('.fm-row-check');
        if (cb) cb.checked = fmSelected.has(idx);
        updateSelBar();
    }

    function updateSelBar() {
        const bar = document.getElementById('fmSelBar');
        const delBtn = document.getElementById('fmDeleteSelBtn');
        const zipBtn = document.getElementById('fmZipSelBtn');
        const countEl = document.getElementById('fmSelCount');
        const n = fmSelected.size;
        if (fmSelectMode) {
            bar?.classList.remove('hidden');
            delBtn?.classList.remove('hidden');
            zipBtn?.classList.remove('hidden');
            if (countEl) countEl.textContent = `${n} item${n !== 1 ? 's' : ''} selected`;
        } else {
            bar?.classList.add('hidden');
            delBtn?.classList.add('hidden');
            zipBtn?.classList.add('hidden');
        }
    }

    async function openFileViewer(entry, startEdit) {
        const fullPath = (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + entry.name;
        const ext = entry.ext.toLowerCase();

        if (IMG_EXTS.has(ext)) {
            const url = `/api/fm/download?path=${encodeURIComponent(fullPath)}`;
            buildMediaModal('image', entry.name, `
              <div class="fm-media-wrap">
                <img class="fm-media-img" src="${escHtml(url)}" alt="${escHtml(entry.name)}" loading="lazy">
              </div>`);
            return;
        }

        if (VID_EXTS.has(ext)) {
            const url = `/api/fm/download?path=${encodeURIComponent(fullPath)}`;
            buildMediaModal('video', entry.name, `
              <div class="fm-media-wrap">
                <video class="fm-media-video" controls preload="metadata">
                  <source src="${escHtml(url)}">
                  Your browser does not support the video element.
                </video>
              </div>`);
            return;
        }

        if (AUD_EXTS.has(ext)) {
            const url = `/api/fm/download?path=${encodeURIComponent(fullPath)}`;
            buildMediaModal('audio', entry.name, `
              <div class="fm-media-wrap fm-media-audio-wrap">
                <div class="fm-audio-icon"><i class="fas fa-music"></i></div>
                <div class="fm-audio-name">${escHtml(entry.name)}</div>
                <audio class="fm-media-audio" controls preload="metadata">
                  <source src="${escHtml(url)}">
                </audio>
              </div>`);
            return;
        }

        if (TEXT_EXTS.has(ext) || ext === '') {
            setStatus('Loading file…');
            try {
                const res  = await fetch(`/api/fm/read?path=${encodeURIComponent(fullPath)}`);
                const data = await res.json();
                if (!data.ok) { setStatus('Cannot read: ' + (data.error || 'error')); return; }
                buildCodeModal(entry, fullPath, data.content, startEdit);
                setStatus('Ready');
            } catch (err) { setStatus('Error: ' + err.message); }
            return;
        }

        window.open(`/api/fm/download?path=${encodeURIComponent(fullPath)}`, '_blank');
    }

    function buildMediaModal(type, title, bodyHtml) {
        document.getElementById('fmViewerModal')?.remove();
        const modal = document.createElement('div');
        modal.id = 'fmViewerModal';
        modal.className = 'fm-viewer-overlay';
        const iconMap = { image: 'fa-image', video: 'fa-film', audio: 'fa-music' };
        modal.innerHTML = `
          <div class="fm-viewer-dialog fm-viewer-media">
            <div class="fm-viewer-header">
              <span class="fm-viewer-title"><i class="fas ${iconMap[type] || 'fa-file'}"></i> ${escHtml(title)}</span>
              <button class="fm-viewer-close" id="fmViewerClose"><i class="fas fa-times"></i></button>
            </div>
            <div class="fm-viewer-body fm-viewer-body-media">
              ${bodyHtml}
            </div>
          </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) closeViewer(); });
        document.getElementById('fmViewerClose')?.addEventListener('click', closeViewer);
        requestAnimationFrame(() => modal.classList.add('fm-viewer-visible'));
    }

    function buildCodeModal(entry, fullPath, content, startEdit) {
        document.getElementById('fmViewerModal')?.remove();

        const lang    = EXT_LANG[entry.ext.toLowerCase()] || 'plaintext';
        const canEdit = TEXT_EXTS.has(entry.ext.toLowerCase()) || entry.ext === '';

        const modal = document.createElement('div');
        modal.id = 'fmViewerModal';
        modal.className = 'fm-viewer-overlay';
        modal.innerHTML = `
          <div class="fm-viewer-dialog fm-viewer-code">
            <div class="fm-viewer-header">
              <span class="fm-viewer-title"><i class="fas fa-file-code"></i> ${escHtml(entry.name)}</span>
              <div class="fm-viewer-header-actions">
                ${canEdit ? `
                <button class="fm-viewer-tab ${!startEdit ? 'active' : ''}" id="fmTabView"><i class="fas fa-eye"></i> View</button>
                <button class="fm-viewer-tab ${startEdit ? 'active' : ''}" id="fmTabEdit"><i class="fas fa-pen"></i> Edit</button>` : ''}
                <button class="fm-viewer-close" id="fmViewerClose"><i class="fas fa-times"></i></button>
              </div>
            </div>
            <div class="fm-viewer-body" id="fmViewerBody">
              <!-- populated below -->
            </div>
            ${canEdit ? `
            <div class="fm-viewer-footer" id="fmViewerFooter" style="display:none">
              <span class="fm-save-status" id="fmSaveStatus"></span>
              <button class="fm-btn fm-btn-sm" id="fmSaveCancelBtn">Cancel</button>
              <button class="fm-btn fm-btn-primary fm-btn-sm" id="fmSaveBtn">
                <i class="fas fa-floppy-disk"></i> Save
              </button>
            </div>` : ''}
          </div>`;
        document.body.appendChild(modal);

        const body       = document.getElementById('fmViewerBody');
        const footer     = document.getElementById('fmViewerFooter');
        const saveBtn    = document.getElementById('fmSaveBtn');
        const cancelBtn  = document.getElementById('fmSaveCancelBtn');
        const saveStatus = document.getElementById('fmSaveStatus');
        const tabView    = document.getElementById('fmTabView');
        const tabEdit    = document.getElementById('fmTabEdit');

        let currentMode = startEdit ? 'edit' : 'view';
        let aceEditor = null;

        function destroyAce() {
            if (aceEditor) {
                try { aceEditor.destroy(); } catch (_) {}
                aceEditor = null;
            }
        }

        function showView() {
            destroyAce();
            currentMode = 'view';
            tabView?.classList.add('active');
            tabEdit?.classList.remove('active');
            if (footer) footer.style.display = 'none';

            if (window.hljs && lang !== 'plaintext') {
                const highlighted = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value;
                body.innerHTML = `<pre class="fm-code-block hljs language-${lang}"><code>${highlighted}</code></pre>`;
            } else {
                body.innerHTML = `<pre class="fm-code-block"><code>${escHtml(content)}</code></pre>`;
            }
        }

        function showEdit() {
            destroyAce();
            currentMode = 'edit';
            tabView?.classList.remove('active');
            tabEdit?.classList.add('active');
            if (footer) footer.style.display = 'flex';
            if (saveStatus) saveStatus.textContent = '';

            if (window.ace) {
                body.innerHTML = `<div id="fmAceEditor" style="width:100%;height:100%;min-height:400px;"></div>`;
                const aceMode = ACE_LANG[entry.ext.toLowerCase()] || 'text';
                aceEditor = ace.edit('fmAceEditor');
                aceEditor.setTheme('ace/theme/one_dark');
                aceEditor.session.setMode('ace/mode/' + aceMode);
                aceEditor.setValue(content, -1);
                aceEditor.setOptions({
                    fontSize: '13px',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    showPrintMargin: false,
                    wrap: false,
                    tabSize: 2,
                    useSoftTabs: true,
                    scrollPastEnd: 0.3,
                    highlightActiveLine: true,
                    showGutter: true,
                });
                aceEditor.focus();
            } else {
                body.innerHTML = `<textarea class="fm-code-editor" id="fmCodeTextarea" spellcheck="false"></textarea>`;
                const ta = document.getElementById('fmCodeTextarea');
                ta.value = content;
                ta.focus();
            }
        }

        if (startEdit && canEdit) showEdit(); else showView();

        tabView?.addEventListener('click', () => { if (currentMode !== 'view') showView(); });
        tabEdit?.addEventListener('click', () => { if (currentMode !== 'edit') showEdit(); });

        saveBtn?.addEventListener('click', async () => {
            const newContent = aceEditor
                ? aceEditor.getValue()
                : (document.getElementById('fmCodeTextarea')?.value ?? '');
            if (saveStatus) saveStatus.textContent = 'Saving…';
            saveBtn.disabled = true;
            try {
                const r = await fetch('/api/fm/write', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: fullPath, content: newContent })
                });
                const d = await r.json();
                if (d.ok) {
                    content = newContent;
                    if (saveStatus) {
                        saveStatus.textContent = '✓ Saved';
                        saveStatus.style.color = 'var(--neon-green)';
                        setTimeout(() => { if (saveStatus) { saveStatus.textContent = ''; saveStatus.style.color = ''; } }, 2000);
                    }
                } else {
                    if (saveStatus) { saveStatus.textContent = '✗ ' + (d.error || 'Failed'); saveStatus.style.color = 'var(--neon-red)'; }
                }
            } catch (err) {
                if (saveStatus) { saveStatus.textContent = '✗ ' + err.message; saveStatus.style.color = 'var(--neon-red)'; }
            } finally { saveBtn.disabled = false; }
        });

        cancelBtn?.addEventListener('click', () => { showView(); });

        modal._fmCleanup = destroyAce;
        modal.addEventListener('click', e => { if (e.target === modal) closeViewer(); });
        document.getElementById('fmViewerClose')?.addEventListener('click', closeViewer);
        requestAnimationFrame(() => modal.classList.add('fm-viewer-visible'));
    }

    function closeViewer() {
        const modal = document.getElementById('fmViewerModal');
        if (!modal) return;
        if (typeof modal._fmCleanup === 'function') modal._fmCleanup();
        modal.classList.remove('fm-viewer-visible');
        setTimeout(() => modal.remove(), 200);
    }

    async function fmDelete(paths) {
        setStatus('Deleting…');
        try {
            const res = await fetch('/api/fm/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths })
            });
            const data = await res.json();
            setStatus(data.ok ? `Deleted ${paths.length} item(s)` : 'Errors: ' + (data.errors || []).join(', '));
            await fmNavigate(fmCurrentPath);
        } catch (err) { setStatus('Delete failed: ' + err.message); }
    }

    async function fmExtract(filePath) {
        showContentSpinner('Extracting archive…');
        setStatus('Extracting…');
        try {
            const res = await fetch('/api/fm/unzip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: filePath, dest: fmCurrentPath })
            });
            const data = await res.json();
            if (data.ok) { setStatus('Extracted to ' + data.dest); await fmNavigate(fmCurrentPath); }
            else setStatus('Extract failed: ' + (data.error || 'unknown'));
        } catch (err) { setStatus('Extract failed: ' + err.message); }
        finally { hideContentSpinner(); }
    }

    async function fmZipSelected() {
        const paths = [...fmSelected].map(i => {
            const e = fmEntries[i];
            return (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + e.name;
        });
        if (!paths.length) return;
        const dest = (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/archive_' + Date.now() + '.zip';
        showContentSpinner('Compressing…');
        setStatus('Zipping…');
        try {
            const res = await fetch('/api/fm/zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths, dest })
            });
            const data = await res.json();
            if (data.ok) { setStatus('Archive created'); fmSelected.clear(); await fmNavigate(fmCurrentPath); }
            else setStatus('Zip failed: ' + (data.error || 'unknown'));
        } catch (err) { setStatus('Zip failed: ' + err.message); }
        finally { hideContentSpinner(); }
    }

    function handleUpload(files) {
        if (!files || !files.length) return;
        const totalSize = [...files].reduce((s, f) => s + f.size, 0);
        const label = files.length === 1
            ? `Uploading ${files[0].name}`
            : `Uploading ${files.length} files (${formatSize(totalSize)})`;

        showUploadOverlay(label);
        setStatus(label + '…');

        const formData = new FormData();
        formData.append('path', fmCurrentPath);
        for (const file of files) formData.append('files', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/fm/upload?path=' + encodeURIComponent(fmCurrentPath));

        xhr.upload.addEventListener('progress', e => {
            if (!e.lengthComputable) return;
            const pct = (e.loaded / e.total) * 100;
            const loaded = formatSize(e.loaded);
            const total  = formatSize(e.total);
            updateUploadOverlay(pct, `${loaded} / ${total}`);
        });

        xhr.addEventListener('load', async () => {
            updateUploadOverlay(100, 'Processing…');
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.ok) {
                    setStatus(`Uploaded ${data.count} file(s)`);
                } else {
                    setStatus('Upload failed: ' + (data.error || 'unknown'));
                }
            } catch (_) { setStatus('Upload complete'); }
            setTimeout(hideUploadOverlay, 600);
            await fmNavigate(fmCurrentPath);
        });

        xhr.addEventListener('error', () => {
            hideUploadOverlay();
            setStatus('Upload failed: network error');
        });

        xhr.send(formData);
    }

    function setupDragDrop(container) {
        container.addEventListener('dragover', e => {
            e.preventDefault();
            container.classList.add('fm-drag-over');
        });
        container.addEventListener('dragleave', () => container.classList.remove('fm-drag-over'));
        container.addEventListener('drop', e => {
            e.preventDefault();
            container.classList.remove('fm-drag-over');
            if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
        });
    }

    let renameCurrentPath = null;
    function openRenameDialog(name, fullPath) {
        renameCurrentPath = fullPath;
        const overlay = document.getElementById('renameOverlay');
        const input   = document.getElementById('renameName');
        if (!overlay || !input) return;
        input.value = name;
        overlay.classList.remove('hidden');
        input.focus(); input.select();
        document.getElementById('renameError')?.classList.add('hidden');
    }

    async function doRename(newName) {
        if (!renameCurrentPath || !newName) return;
        const dir     = renameCurrentPath.substring(0, renameCurrentPath.lastIndexOf('/')) || '/';
        const newPath = dir + '/' + newName;
        setStatus('Renaming…');
        try {
            const res = await fetch('/api/fm/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: renameCurrentPath, to: newPath })
            });
            const data = await res.json();
            if (data.ok) {
                document.getElementById('renameOverlay')?.classList.add('hidden');
                setStatus('Renamed');
                await fmNavigate(fmCurrentPath);
            } else {
                const errEl = document.getElementById('renameError');
                if (errEl) { errEl.textContent = data.error || 'Rename failed'; errEl.classList.remove('hidden'); }
            }
        } catch (err) { setStatus('Rename failed: ' + err.message); }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const content = document.getElementById('fmContent');
        if (!content) return;

        window.fmRefresh = () => fmNavigate(fmCurrentPath || '/');

        document.getElementById('fmUpBtn')?.addEventListener('click', () => {
            if (fmCurrentPath === fmUserRoot || fmCurrentPath === '/') return;
            const parent = fmCurrentPath.substring(0, fmCurrentPath.lastIndexOf('/')) || '/';
            fmNavigate((fmUserRoot === '/' || parent.startsWith(fmUserRoot)) ? parent : fmUserRoot);
        });

        document.getElementById('fmNewFolderBtn')?.addEventListener('click', () => {
            document.getElementById('newFolderName').value = '';
            document.getElementById('newFolderError')?.classList.add('hidden');
            document.getElementById('newFolderOverlay')?.classList.remove('hidden');
            document.getElementById('newFolderName')?.focus();
        });
        document.getElementById('confirmNewFolder')?.addEventListener('click', async () => {
            const name = document.getElementById('newFolderName').value.trim();
            if (!name) return;
            const newPath = (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + name;
            try {
                const res = await fetch('/api/fm/mkdir', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: newPath })
                });
                const data = await res.json();
                if (data.ok) { document.getElementById('newFolderOverlay')?.classList.add('hidden'); await fmNavigate(fmCurrentPath); }
                else { const e = document.getElementById('newFolderError'); if (e) { e.textContent = data.error || 'Failed'; e.classList.remove('hidden'); } }
            } catch (err) { setStatus('Error: ' + err.message); }
        });
        document.getElementById('newFolderName')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('confirmNewFolder')?.click(); });

        document.getElementById('fmNewFileBtn')?.addEventListener('click', () => {
            document.getElementById('newFileName').value = '';
            document.getElementById('newFileError')?.classList.add('hidden');
            document.getElementById('newFileOverlay')?.classList.remove('hidden');
            document.getElementById('newFileName')?.focus();
        });
        document.getElementById('confirmNewFile')?.addEventListener('click', async () => {
            const name = document.getElementById('newFileName').value.trim();
            if (!name) return;
            const newPath = (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + name;
            try {
                const res = await fetch('/api/fm/touch', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: newPath, content: '' })
                });
                const data = await res.json();
                if (data.ok) { document.getElementById('newFileOverlay')?.classList.add('hidden'); await fmNavigate(fmCurrentPath); }
                else { const e = document.getElementById('newFileError'); if (e) { e.textContent = data.error || 'Failed'; e.classList.remove('hidden'); } }
            } catch (err) { setStatus('Error: ' + err.message); }
        });
        document.getElementById('newFileName')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('confirmNewFile')?.click(); });

        document.getElementById('fmUploadInput')?.addEventListener('change', e => {
            if (e.target.files.length) handleUpload(e.target.files);
            e.target.value = '';
        });

        document.getElementById('fmSelectModeBtn')?.addEventListener('click', () => {
            fmSelectMode = !fmSelectMode;
            fmSelected.clear();
            const btn = document.getElementById('fmSelectModeBtn');
            if (btn) {
                btn.classList.toggle('fm-btn-active', fmSelectMode);
                btn.innerHTML = fmSelectMode
                    ? '<i class="fas fa-xmark"></i> <span class="fm-btn-label">Cancel</span>'
                    : '<i class="fas fa-check-square"></i> <span class="fm-btn-label">Select</span>';
            }
            renderEntries();
            updateSelBar();
        });

        document.getElementById('fmDeleteSelBtn')?.addEventListener('click', async () => {
            if (!fmSelected.size) return;
            const names = [...fmSelected].map(i => fmEntries[i].name).join(', ');
            const ok = await FxConfirm(`Delete ${fmSelected.size} item(s)?\n${names}`, {
                title: 'Delete Selected',
                confirmLabel: 'Delete All',
                type: 'danger'
            });
            if (!ok) return;
            const paths = [...fmSelected].map(i => {
                const e = fmEntries[i];
                return (fmCurrentPath === '/' ? '' : fmCurrentPath) + '/' + e.name;
            });
            await fmDelete(paths);
            fmSelected.clear();
        });

        document.getElementById('fmZipSelBtn')?.addEventListener('click', fmZipSelected);

        document.getElementById('fmSelAllBtn')?.addEventListener('click', () => {
            fmEntries.forEach((_, i) => fmSelected.add(i)); renderEntries();
        });
        document.getElementById('fmSelNoneBtn')?.addEventListener('click', () => {
            fmSelected.clear(); renderEntries();
        });

        document.getElementById('confirmRename')?.addEventListener('click', () => {
            const name = document.getElementById('renameName').value.trim();
            if (name) doRename(name);
        });
        document.getElementById('renameName')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('confirmRename')?.click();
        });

        setupDragDrop(content);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeViewer();
        });

        const filesPage = document.getElementById('pagFiles');
        if (filesPage) {
            const observer = new MutationObserver(() => {
                if (filesPage.classList.contains('active')) fmNavigate(fmCurrentPath || '/');
            });
            observer.observe(filesPage, { attributes: true, attributeFilter: ['class'] });
        }
    });
})();
