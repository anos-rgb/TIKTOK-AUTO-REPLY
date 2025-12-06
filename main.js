/*
╔════════════════════════════════════════════════════════════╗
║      TIKTOK AUTO REPLY - FINAL VERSION                     ║
╚════════════════════════════════════════════════════════════╝
*/

(async () => {
  'use strict';

  const CONFIG = {
    DISCORD_LINK: 'https://discord.gg/4JdW2n695T',
    MAX_REPLIES: 10,
    DELAY_MIN: 3000,
    DELAY_MAX: 5000
  };

  const STORAGE_KEY = 'tiktok_replied_v16';
  let replied = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));

  const createUI = () => {
    const ui = document.createElement('div');
    ui.id = 'tiktok-reply-ui';
    ui.innerHTML = `
      <style>
        #tiktok-reply-ui {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 500px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .tr-header {
          background: rgba(0,0,0,0.2);
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
        }
        .tr-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
        }
        .tr-close {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }
        .tr-body {
          padding: 20px;
          background: white;
          max-height: 600px;
          overflow-y: auto;
        }
        .tr-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .tr-stat {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
        }
        .tr-stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
        }
        .tr-stat-label {
          font-size: 11px;
          color: #666;
          margin-top: 2px;
        }
        .tr-control {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }
        .tr-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .tr-btn-primary {
          background: #667eea;
          color: white;
        }
        .tr-btn-primary:hover {
          background: #5568d3;
        }
        .tr-btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .tr-btn-secondary {
          background: #f0f0f0;
          color: #333;
        }
        .tr-status {
          text-align: center;
          padding: 10px;
          background: #e0e7ff;
          border-radius: 8px;
          margin-bottom: 15px;
          font-weight: 600;
          color: #3730a3;
          font-size: 13px;
        }
        .tr-log {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          max-height: 300px;
          overflow-y: auto;
          font-size: 11px;
          font-family: 'Courier New', monospace;
        }
        .tr-log-item {
          padding: 5px 8px;
          margin-bottom: 3px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #667eea;
          word-wrap: break-word;
        }
        .tr-log-success { border-left-color: #10b981; }
        .tr-log-error { border-left-color: #ef4444; }
        .tr-log-info { border-left-color: #3b82f6; }
        .tr-log-warning { border-left-color: #f59e0b; }
        .tr-log-time {
          color: #666;
          font-size: 9px;
          margin-right: 6px;
        }
      </style>
      <div class="tr-header">
        <div class="tr-title">🤖 TikTok Auto Reply</div>
        <button class="tr-close">×</button>
      </div>
      <div class="tr-body">
        <div class="tr-stats">
          <div class="tr-stat">
            <div class="tr-stat-value" id="tr-found">0</div>
            <div class="tr-stat-label">Ditemukan</div>
          </div>
          <div class="tr-stat">
            <div class="tr-stat-value" id="tr-success">0</div>
            <div class="tr-stat-label">Berhasil</div>
          </div>
          <div class="tr-stat">
            <div class="tr-stat-value" id="tr-skip">0</div>
            <div class="tr-stat-label">Dilewati</div>
          </div>
        </div>
        <div class="tr-status" id="tr-status">Siap digunakan</div>
        <div class="tr-control">
          <button class="tr-btn tr-btn-primary" id="tr-start">▶ Mulai Auto Reply</button>
          <button class="tr-btn tr-btn-secondary" id="tr-clear">🗑 Reset</button>
        </div>
        <div class="tr-log" id="tr-log"></div>
      </div>
    `;
    document.body.appendChild(ui);
    return ui;
  };

  const ui = createUI();
  const elStatus = document.getElementById('tr-status');
  const elFound = document.getElementById('tr-found');
  const elSuccess = document.getElementById('tr-success');
  const elSkip = document.getElementById('tr-skip');
  const elLog = document.getElementById('tr-log');
  const btnStart = document.getElementById('tr-start');
  const btnClear = document.getElementById('tr-clear');
  const btnClose = ui.querySelector('.tr-close');

  let isDragging = false, offsetX, offsetY;
  const header = ui.querySelector('.tr-header');
  header.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - ui.offsetLeft;
    offsetY = e.clientY - ui.offsetTop;
  };
  document.onmousemove = (e) => {
    if (isDragging) {
      ui.style.left = (e.clientX - offsetX) + 'px';
      ui.style.top = (e.clientY - offsetY) + 'px';
      ui.style.right = 'auto';
    }
  };
  document.onmouseup = () => isDragging = false;

  btnClose.onclick = () => ui.remove();
  btnClear.onclick = () => {
    replied.clear();
    localStorage.removeItem(STORAGE_KEY);
    elLog.innerHTML = '';
    elFound.textContent = '0';
    elSuccess.textContent = '0';
    elSkip.textContent = '0';
    addLog('🗑 Reset berhasil', 'success');
  };

  const getTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  };

  const addLog = (msg, type = '') => {
    const item = document.createElement('div');
    item.className = `tr-log-item ${type ? 'tr-log-' + type : ''}`;
    item.innerHTML = `<span class="tr-log-time">[${getTime()}]</span>${msg}`;
    elLog.insertBefore(item, elLog.firstChild);
    if (elLog.children.length > 50) elLog.lastChild.remove();
    elLog.scrollTop = 0;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h).toString(36);
  };

  const scrapeComments = () => {
    addLog('🔍 Mulai scraping komentar...', 'info');
    
    const comments = [];
    
    // Cari semua span dengan data-e2e="comment-reply-1" (tombol Reply)
    const replyButtons = document.querySelectorAll('span[data-e2e="comment-reply-1"]');
    
    addLog(`🔘 Ditemukan ${replyButtons.length} tombol Reply`, replyButtons.length > 0 ? 'success' : 'error');
    
    let processedCount = 0;
    
    for (const replyBtn of replyButtons) {
      // Skip jika di dalam UI panel kita
      if (replyBtn.closest('#tiktok-reply-ui')) {
        continue;
      }
      
      processedCount++;
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      addLog(`🔎 [${processedCount}] Processing reply button...`, 'info');
      
      try {
        // Naik ke parent untuk cari container komentar lengkap
        let container = replyBtn;
        let depth = 0;
        let textEl = null;
        let usernameEl = null;
        
        while (container && depth < 15) {
          // Cari elemen text komentar
          textEl = container.querySelector('span[data-e2e="comment-level-1"]');
          
          // Cari username dengan berbagai selector
          usernameEl = container.querySelector('span[data-e2e="comment-username-1"]') ||
                      container.querySelector('span[data-e2e*="username"]') ||
                      container.querySelector('a[data-e2e*="username"]');
          
          addLog(`   Depth ${depth}: username=${!!usernameEl}, text=${!!textEl}`, 'info');
          
          if (usernameEl) {
            addLog(`   🔍 Username selector: ${usernameEl.getAttribute('data-e2e')}`, 'info');
          }
          
          if (textEl && usernameEl) {
            const username = usernameEl.textContent.trim();
            const text = textEl.textContent.trim();
            
            addLog(`   👤 Username: "${username}"`, 'success');
            addLog(`   💬 Text: "${text.substring(0, 40)}..."`, 'success');
            
            if (!username || username.length === 0) {
              addLog(`   ⚠️ Skip: username kosong`, 'warning');
              break;
            }
            
            if (!text || text.length < 3) {
              addLog(`   ⚠️ Skip: text terlalu pendek (${text.length})`, 'warning');
              break;
            }
            
            const id = hash(username + ':' + text.substring(0, 50));
            
            // Cek duplikat
            if (comments.find(c => c.id === id)) {
              addLog(`   ⏭️  Skip: duplikat`, 'warning');
              break;
            }
            
            addLog(`   ✅ Valid comment added!`, 'success');
            
            comments.push({
              id,
              username,
              text,
              element: container,
              replyBtn
            });
            
            break;
          }
          
          container = container.parentElement;
          depth++;
        }
        
        if (!textEl || !usernameEl) {
          addLog(`   ❌ Tidak ditemukan setelah ${depth} level parent`, 'error');
          
          // Debug: tampilkan semua elemen dengan data-e2e di sekitar reply button
          const nearbyE2e = replyBtn.parentElement?.parentElement?.parentElement?.querySelectorAll('[data-e2e]');
          if (nearbyE2e && nearbyE2e.length > 0) {
            const uniqueE2e = [...new Set(Array.from(nearbyE2e).map(el => el.getAttribute('data-e2e')))];
            addLog(`   📋 Nearby data-e2e: ${uniqueE2e.slice(0, 10).join(', ')}`, 'info');
          }
        }
        
        // Hanya debug 3 komentar pertama
        if (processedCount >= 3 && comments.length === 0) {
          addLog(`   ⚠️ Debug limit: stopping after 3 attempts`, 'warning');
          break;
        }
        
      } catch (e) {
        addLog(`   ❌ Error: ${e.message}`, 'error');
      }
    }
    
    addLog(`━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
    addLog(`📊 Total ditemukan: ${comments.length} komentar`, comments.length > 0 ? 'success' : 'error');
    
    return comments;
  };

  const findReplyTextarea = () => {
    addLog('   🔍 Mencari textarea dengan berbagai metode...', 'info');
    
    // Metode 1: Cari DraftEditor-editorContainer
    const draftEditors = document.querySelectorAll('.DraftEditor-editorContainer [contenteditable="true"]');
    addLog(`   📋 DraftEditor found: ${draftEditors.length}`, 'info');
    
    for (const editor of Array.from(draftEditors).reverse()) {
      if (!editor.offsetParent) continue;
      
      // Cari placeholder di parent
      const placeholder = editor.closest('.DraftEditor-root')?.querySelector('[id*="placeholder"]');
      const placeholderText = placeholder ? placeholder.textContent.toLowerCase() : '';
      
      addLog(`   📝 Placeholder: "${placeholderText}"`, 'info');
      
      // Skip "Add comment"
      if (placeholderText.includes('add comment') || placeholderText.includes('add a comment')) {
        addLog(`   ⏭️  Skip: Add comment textarea`, 'warning');
        continue;
      }
      
      // Prioritas textarea dengan placeholder "reply"
      if (placeholderText.includes('reply') || placeholderText.includes('balas')) {
        addLog(`   ✅ Found: Reply textarea via placeholder`, 'success');
        return editor;
      }
      
      // Fallback: textarea visible pertama yang bukan "add comment"
      addLog(`   ✅ Found: Reply textarea (fallback)`, 'success');
      return editor;
    }
    
    // Metode 2: Fallback ke contenteditable biasa
    const textareas = Array.from(document.querySelectorAll('[contenteditable="true"]')).reverse();
    addLog(`   📋 Contenteditable found: ${textareas.length}`, 'info');
    
    for (const ta of textareas) {
      if (!ta.offsetParent) continue;
      
      const ariaDesc = (ta.getAttribute('aria-describedby') || '').toLowerCase();
      
      // Skip add comment
      if (ariaDesc.includes('add') && ariaDesc.includes('comment')) {
        continue;
      }
      
      addLog(`   ✅ Found: Textarea via contenteditable`, 'success');
      return ta;
    }
    
    addLog(`   ❌ Textarea tidak ditemukan`, 'error');
    return null;
  };

  const typeText = async (el, text) => {
    el.click();
    await sleep(200);
    el.focus();
    await sleep(300);
    el.innerHTML = '';
    await sleep(200);
    
    for (let i = 0; i < text.length; i++) {
      document.execCommand('insertText', false, text[i]);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(60 + Math.random() * 40);
    }
  };

  const findPostButton = () => {
    addLog('   🔍 Mencari tombol Post/Enter...', 'info');
    
    // Prioritas 1: Cari div dengan data-e2e="comment-post"
    const postDiv = document.querySelector('div[data-e2e="comment-post"]');
    if (postDiv && postDiv.offsetParent) {
      addLog('   ✅ Found: Post button (div)', 'success');
      return postDiv;
    }
    
    // Prioritas 2: Cari button/div dengan aria-label="Post"
    const postByAria = document.querySelector('[aria-label="Post"][role="button"]');
    if (postByAria && postByAria.offsetParent) {
      addLog('   ✅ Found: Post button (aria)', 'success');
      return postByAria;
    }
    
    // Prioritas 3: Cari button biasa
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"]')).filter(b => b.offsetParent);
    
    for (const btn of buttons) {
      const text = (btn.innerText || '').toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const dataE2e = btn.getAttribute('data-e2e') || '';
      
      if (text.includes('post') || text.includes('kirim') || text.includes('send') ||
          ariaLabel.includes('post') || ariaLabel.includes('kirim') || ariaLabel.includes('send') ||
          dataE2e.includes('post')) {
        addLog('   ✅ Found: Post button (search)', 'success');
        return btn;
      }
    }
    
    addLog('   ⚠️ Post button tidak ditemukan, akan pakai Enter', 'warning');
    return null;
  };

  const replyToComment = async (comment) => {
    try {
      addLog(`━━━━━━━━━━━━━━━━━━━━━━━━`, 'info');
      addLog(`💬 @${comment.username}`, 'info');
      addLog(`   "${comment.text.substring(0, 40)}..."`, 'info');

      addLog(`   📜 Scroll ke komentar`, 'info');
      comment.element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(1500);

      addLog(`   🖱️ Klik tombol Reply`, 'info');
      comment.replyBtn.click();
      await sleep(3000);

      addLog(`   🔍 Mencari textarea reply`, 'info');
      const textarea = findReplyTextarea();
      if (!textarea) {
        addLog(`   ❌ Textarea tidak ditemukan`, 'error');
        return false;
      }

      addLog(`   ⌨️ Mengetik pesan`, 'info');
      await typeText(textarea, `ayo join serverku! ${CONFIG.DISCORD_LINK}`);
      await sleep(800);

      // Coba tekan Enter dulu (metode utama TikTok)
      addLog(`   ⌨️ Tekan Enter untuk kirim`, 'info');
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      
      await sleep(1000);
      
      // Cek apakah berhasil (textarea dikosongkan)
      if (textarea.textContent.trim().length === 0 || textarea.innerHTML.trim().length < 10) {
        addLog(`   ✅ Berhasil kirim via Enter!`, 'success');
        return true;
      }
      
      // Fallback: coba klik tombol Post
      addLog(`   🔍 Enter gagal, coba tombol Post...`, 'warning');
      const postBtn = findPostButton();
      if (postBtn) {
        addLog(`   📤 Klik tombol Post`, 'info');
        postBtn.click();
        await sleep(2000);
        
        addLog(`   ✅ Berhasil kirim via Post button!`, 'success');
        return true;
      }

      addLog(`   ❌ Gagal kirim pesan`, 'error');
      return false;

    } catch (error) {
      addLog(`   ❌ Error: ${error.message}`, 'error');
      return false;
    }
  };

  btnStart.onclick = async () => {
    btnStart.disabled = true;
    btnStart.textContent = '⏳ Berjalan...';
    
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    addLog('🚀 MULAI AUTO REPLY', 'success');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

    elStatus.textContent = '🔍 Scraping komentar...';
    await sleep(500);

    const allComments = scrapeComments();
    
    if (allComments.length === 0) {
      addLog('❌ Tidak ada komentar ditemukan', 'error');
      addLog('💡 Scroll ke bagian komentar terlebih dahulu', 'warning');
      elStatus.textContent = '❌ Tidak ada komentar';
      btnStart.disabled = false;
      btnStart.textContent = '▶ Mulai Auto Reply';
      return;
    }

    const comments = allComments.filter(c => !replied.has(c.id)).slice(0, CONFIG.MAX_REPLIES);
    
    elFound.textContent = comments.length;
    addLog(`✅ Ditemukan ${comments.length} komentar baru`, 'success');

    if (comments.length === 0) {
      addLog('⚠️ Semua komentar sudah di-reply', 'warning');
      elStatus.textContent = '✅ Semua sudah di-reply';
      btnStart.disabled = false;
      btnStart.textContent = '▶ Mulai Auto Reply';
      return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      
      elStatus.textContent = `📝 Reply ${i+1}/${comments.length}...`;

      const success = await replyToComment(comment);
      
      if (success) {
        successCount++;
        elSuccess.textContent = successCount;
        replied.add(comment.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...replied]));
      } else {
        skipCount++;
        elSkip.textContent = skipCount;
      }

      if (i < comments.length - 1) {
        const delay = Math.floor(Math.random() * (CONFIG.DELAY_MAX - CONFIG.DELAY_MIN)) + CONFIG.DELAY_MIN;
        addLog(`⏳ Tunggu ${Math.round(delay / 1000)} detik...`, 'info');
        elStatus.textContent = `⏳ Tunggu ${Math.round(delay / 1000)}s...`;
        await sleep(delay);
      }
    }

    addLog('━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    addLog(`🏁 SELESAI! ${successCount} berhasil, ${skipCount} dilewati`, 'success');
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━', 'success');
    
    elStatus.textContent = '✅ Selesai!';
    btnStart.disabled = false;
    btnStart.textContent = '▶ Mulai Auto Reply';
  };

  addLog('🚀 Script loaded!', 'success');
  addLog('💡 Klik "Mulai Auto Reply" untuk memulai', 'info');
})();
