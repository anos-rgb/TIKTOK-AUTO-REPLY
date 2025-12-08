/*
╔════════════════════════════════════════════════════════════╗
║      TIKTOK AUTO REPLY + COMMENT SCRAPER V2                ║
╚════════════════════════════════════════════════════════════╝
*/

(async () => {
  'use strict';

  const CONFIG = {
    DISCORD_LINK: 'https://discord.gg/4JdW2n695T',
    MAX_REPLIES: 10,
    DELAY_MIN: 3000,
    DELAY_MAX: 5000,
    AUTO_SCROLL_DELAY: 2000,
    MAX_SCROLL_ATTEMPTS: 30
  };

  const STORAGE_KEY = 'tiktok_replied_v17';
  let replied = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  
  const scrapedComments = [];
  let isInterceptActive = false;
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;

  const createUI = () => {
    const ui = document.createElement('div');
    ui.id = 'tiktok-reply-ui';
    ui.innerHTML = `
      <style>
        #tiktok-reply-ui {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 520px;
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
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 8px;
          margin-bottom: 15px;
        }
        .tr-stat {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 8px;
          text-align: center;
        }
        .tr-stat-value {
          font-size: 18px;
          font-weight: bold;
          color: #667eea;
        }
        .tr-stat-label {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        .tr-control {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }
        .tr-btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
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
        .tr-btn-success {
          background: #10b981;
          color: white;
        }
        .tr-btn-success:hover {
          background: #059669;
        }
        .tr-btn-warning {
          background: #f59e0b;
          color: white;
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
          max-height: 250px;
          overflow-y: auto;
          font-size: 11px;
          font-family: 'Courier New', monospace;
        }
        .tr-log-item {
          padding: 4px 8px;
          margin-bottom: 2px;
          background: white;
          border-radius: 4px;
          border-left: 3px solid #667eea;
          word-wrap: break-word;
          color: #000;
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
        .tr-intercept-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #10b981;
          color: white;
          border-radius: 12px;
          font-size: 10px;
          margin-left: 8px;
        }
        .tr-intercept-badge.inactive {
          background: #ef4444;
        }
      </style>
      <div class="tr-header">
        <div class="tr-title">
          🤖 TikTok Auto Reply
          <span class="tr-intercept-badge" id="tr-intercept-badge">🔴 OFF</span>
        </div>
        <button class="tr-close">×</button>
      </div>
      <div class="tr-body">
        <div class="tr-stats">
          <div class="tr-stat">
            <div class="tr-stat-value" id="tr-scraped">0</div>
            <div class="tr-stat-label">Scraped</div>
          </div>
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
          <button class="tr-btn tr-btn-success" id="tr-scrape">📥 Scrape DOM</button>
          <button class="tr-btn tr-btn-primary" id="tr-start">▶ Reply</button>
          <button class="tr-btn tr-btn-secondary" id="tr-clear">🗑</button>
        </div>
        <div class="tr-log" id="tr-log"></div>
      </div>
    `;
    document.body.appendChild(ui);
    return ui;
  };

  const ui = createUI();
  const elStatus = document.getElementById('tr-status');
  const elScraped = document.getElementById('tr-scraped');
  const elFound = document.getElementById('tr-found');
  const elSuccess = document.getElementById('tr-success');
  const elSkip = document.getElementById('tr-skip');
  const elLog = document.getElementById('tr-log');
  const btnScrape = document.getElementById('tr-scrape');
  const btnStart = document.getElementById('tr-start');
  const btnClear = document.getElementById('tr-clear');
  const btnClose = ui.querySelector('.tr-close');
  const badgeIntercept = document.getElementById('tr-intercept-badge');

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

  btnClose.onclick = () => {
    stopIntercept();
    ui.remove();
  };
  
  btnClear.onclick = () => {
    replied.clear();
    scrapedComments.length = 0;
    localStorage.removeItem(STORAGE_KEY);
    elLog.innerHTML = '';
    elScraped.textContent = '0';
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

  // Intercept Fetch
  const startIntercept = () => {
    if (isInterceptActive) return;
    
    // Intercept Fetch
    window.fetch = function(...args) {
      return originalFetch.apply(this, args).then(response => {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        
        if (url && (url.includes('comment') || url.includes('Comment'))) {
          addLog(`🔍 API detected: ${url.substring(0, 60)}...`, 'info');
          
          response.clone().json().then(data => {
            addLog(`📦 Response data: ${JSON.stringify(data).substring(0, 100)}...`, 'info');
            
            // Coba berbagai struktur response
            let comments = data.comments || data.data?.comments || data.itemList || [];
            
            if (comments && comments.length > 0) {
              comments.forEach(c => {
                try {
                  const user = c.user || c.author || {};
                  const commentData = {
                    id: hash((user.unique_id || user.uniqueId || user.id || '') + ':' + (c.text || c.content || '').substring(0, 50)),
                    username: user.unique_id || user.uniqueId || user.nickname || user.id || 'unknown',
                    nama: user.nickname || user.name || user.unique_id || '',
                    komentar: c.text || c.content || '',
                    likes: c.digg_count || c.likeCount || c.likes || 0,
                    waktu: new Date((c.create_time || c.createTime || Date.now() / 1000) * 1000).toLocaleString()
                  };
                  
                  if (!scrapedComments.find(sc => sc.id === commentData.id)) {
                    scrapedComments.push(commentData);
                    elScraped.textContent = scrapedComments.length;
                    addLog(`✅ +1 comment: @${commentData.username}`, 'success');
                  }
                } catch (e) {
                  addLog(`⚠️ Parse error: ${e.message}`, 'warning');
                }
              });
            }
          }).catch(err => {
            addLog(`⚠️ Response parse error: ${err.message}`, 'warning');
          });
        }
        
        return response;
      });
    };
    
    // Intercept XHR
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      xhr.open = function(method, url) {
        this._url = url;
        return originalOpen.apply(this, arguments);
      };
      
      xhr.send = function() {
        this.addEventListener('load', function() {
          const url = this._url;
          if (url && (url.includes('comment') || url.includes('Comment'))) {
            try {
              const data = JSON.parse(this.responseText);
              addLog(`🔍 XHR detected: ${url.substring(0, 60)}...`, 'info');
              
              let comments = data.comments || data.data?.comments || data.itemList || [];
              
              if (comments && comments.length > 0) {
                comments.forEach(c => {
                  try {
                    const user = c.user || c.author || {};
                    const commentData = {
                      id: hash((user.unique_id || user.uniqueId || user.id || '') + ':' + (c.text || c.content || '').substring(0, 50)),
                      username: user.unique_id || user.uniqueId || user.nickname || user.id || 'unknown',
                      nama: user.nickname || user.name || user.unique_id || '',
                      komentar: c.text || c.content || '',
                      likes: c.digg_count || c.likeCount || c.likes || 0,
                      waktu: new Date((c.create_time || c.createTime || Date.now() / 1000) * 1000).toLocaleString()
                    };
                    
                    if (!scrapedComments.find(sc => sc.id === commentData.id)) {
                      scrapedComments.push(commentData);
                      elScraped.textContent = scrapedComments.length;
                      addLog(`✅ +1 comment: @${commentData.username}`, 'success');
                    }
                  } catch (e) {}
                });
              }
            } catch (e) {}
          }
        });
        return originalSend.apply(this, arguments);
      };
      
      return xhr;
    };
    
    isInterceptActive = true;
    badgeIntercept.textContent = '🟢 ON';
    badgeIntercept.classList.remove('inactive');
    addLog('🟢 Intercept aktif (Fetch + XHR)', 'success');
  };

  const stopIntercept = () => {
    window.fetch = originalFetch;
    window.XMLHttpRequest = originalXHR;
    isInterceptActive = false;
    badgeIntercept.textContent = '🔴 OFF';
    badgeIntercept.classList.add('inactive');
  };

  // Scrape dari DOM langsung
  const scrapeDOMComments = async () => {
    addLog('🔍 Scraping dari DOM...', 'info');
    
    await sleep(500);
    
    const commentElements = document.querySelectorAll('[data-e2e="comment-level-1"]');
    addLog(`📋 Found ${commentElements.length} comment elements`, 'info');
    
    let newCount = 0;
    
    for (const commentEl of commentElements) {
      try {
        const container = commentEl.closest('[class*="Comment"]') || commentEl.parentElement?.parentElement?.parentElement;
        
        const usernameEl = container?.querySelector('[data-e2e*="username"]') || 
                          container?.querySelector('a[href*="@"]');
        const textEl = commentEl;
        const likesEl = container?.querySelector('[data-e2e*="like-count"]');
        
        if (usernameEl && textEl) {
          const username = usernameEl.textContent.trim().replace('@', '');
          const text = textEl.textContent.trim();
          const likes = likesEl ? likesEl.textContent.trim() : '0';
          
          if (username && text && text.length > 2) {
            const commentData = {
              id: hash(username + ':' + text.substring(0, 50)),
              username: username,
              nama: username,
              komentar: text,
              likes: likes,
              waktu: new Date().toLocaleString()
            };
            
            if (!scrapedComments.find(sc => sc.id === commentData.id)) {
              scrapedComments.push(commentData);
              newCount++;
            }
          }
        }
      } catch (e) {
        addLog(`⚠️ Parse error: ${e.message}`, 'warning');
      }
    }
    
    elScraped.textContent = scrapedComments.length;
    addLog(`✅ Scrape DOM: +${newCount} comments`, newCount > 0 ? 'success' : 'warning');
    
    return newCount;
  };

  // Auto scroll
  const autoScrollComments = async () => {
    addLog('📜 Mulai auto scroll...', 'info');
    
    const container = document.querySelector('[data-e2e="comment-list"]') || 
                     document.querySelector('[class*="comment-list"]') ||
                     document.querySelector('[class*="CommentList"]');
    
    if (!container) {
      addLog('❌ Container komentar tidak ditemukan', 'error');
      addLog('💡 Coba scroll manual ke bagian komentar', 'warning');
      return;
    }

    let scrollAttempts = 0;
    let lastCount = scrapedComments.length;
    let noNewCommentsCount = 0;

    while (scrollAttempts < CONFIG.MAX_SCROLL_ATTEMPTS) {
      container.scrollTo(0, container.scrollHeight);
      scrollAttempts++;
      
      elStatus.textContent = `📜 Scroll ${scrollAttempts}/${CONFIG.MAX_SCROLL_ATTEMPTS} | ${scrapedComments.length} komentar`;
      
      await sleep(CONFIG.AUTO_SCROLL_DELAY);
      
      // Scrape DOM setelah scroll
      await scrapeDOMComments();
      
      const currentCount = scrapedComments.length;
      
      if (currentCount === lastCount) {
        noNewCommentsCount++;
        if (noNewCommentsCount >= 3) {
          addLog('✅ Scroll selesai (tidak ada komentar baru)', 'success');
          break;
        }
      } else {
        noNewCommentsCount = 0;
        addLog(`📊 Progress: ${currentCount} total comments`, 'info');
      }
      
      lastCount = currentCount;
    }
    
    addLog(`📊 Total ${scrapedComments.length} komentar berhasil di-scrape`, 'success');
  };

  // Scrape button handler
  btnScrape.onclick = async () => {
    btnScrape.disabled = true;
    btnScrape.textContent = '⏳ Scraping...';
    
    scrapedComments.length = 0;
    elScraped.textContent = '0';
    
    // Scrape DOM dulu
    await scrapeDOMComments();
    
    // Lalu auto scroll
    await autoScrollComments();
    
    btnScrape.disabled = false;
    btnScrape.textContent = '📥 Scrape DOM';
    elStatus.textContent = `✅ ${scrapedComments.length} komentar ready`;
    
    if (scrapedComments.length === 0) {
      addLog('⚠️ Tidak ada komentar ditemukan', 'warning');
      addLog('💡 Pastikan sudah scroll ke bagian komentar', 'warning');
    }
  };

  const findReplyTextarea = () => {
    const draftEditors = document.querySelectorAll('.DraftEditor-editorContainer [contenteditable="true"]');
    
    for (const editor of Array.from(draftEditors).reverse()) {
      if (!editor.offsetParent) continue;
      
      const placeholder = editor.closest('.DraftEditor-root')?.querySelector('[id*="placeholder"]');
      const placeholderText = placeholder ? placeholder.textContent.toLowerCase() : '';
      
      if (placeholderText.includes('add comment') || placeholderText.includes('add a comment')) {
        continue;
      }
      
      if (placeholderText.includes('reply') || placeholderText.includes('balas')) {
        return editor;
      }
      
      return editor;
    }
    
    const textareas = Array.from(document.querySelectorAll('[contenteditable="true"]')).reverse();
    
    for (const ta of textareas) {
      if (!ta.offsetParent) continue;
      
      const ariaDesc = (ta.getAttribute('aria-describedby') || '').toLowerCase();
      
      if (ariaDesc.includes('add') && ariaDesc.includes('comment')) {
        continue;
      }
      
      return ta;
    }
    
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
    const postDiv = document.querySelector('div[data-e2e="comment-post"]');
    if (postDiv && postDiv.offsetParent) {
      return postDiv;
    }
    
    const postByAria = document.querySelector('[aria-label="Post"][role="button"]');
    if (postByAria && postByAria.offsetParent) {
      return postByAria;
    }
    
    const buttons = Array.from(document.querySelectorAll('button, div[role="button"], span[role="button"]')).filter(b => b.offsetParent);
    
    for (const btn of buttons) {
      const text = (btn.innerText || '').toLowerCase();
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const dataE2e = btn.getAttribute('data-e2e') || '';
      
      if (text.includes('post') || text.includes('kirim') || text.includes('send') ||
          ariaLabel.includes('post') || ariaLabel.includes('kirim') || ariaLabel.includes('send') ||
          dataE2e.includes('post')) {
        return btn;
      }
    }
    
    return null;
  };

  const replyToCommentByUsername = async (username, text) => {
    try {
      addLog(`💬 @${username}`, 'info');

      // Cari container komentar
      const container = findCommentContainer();
      
      if (!container) {
        addLog(`   ⚠️ Container not found, trying visible buttons only`, 'warning');
        
        // Fallback: cari langsung di visible buttons
        const allReplyBtns = Array.from(document.querySelectorAll('span[data-e2e="comment-reply-1"]'))
          .filter(btn => !btn.closest('#tiktok-reply-ui'));
        
        for (const btn of allReplyBtns) {
          // Naik 3 level ke parent (sesuai hasil debug)
          let commentContainer = btn.parentElement?.parentElement?.parentElement;
          
          if (commentContainer) {
            const foundUsername = extractUsername(commentContainer);
            
            if (foundUsername === username) {
              addLog(`   ✅ Found in visible area!`, 'success');
              return await executeReply(btn, commentContainer);
            }
          }
        }
        
        addLog(`   ❌ Not found in visible area`, 'error');
        return false;
      }
      
      // Scroll ke atas dulu
      container.scrollTop = 0;
      await sleep(800);
      
      let found = false;
      let scrollAttempts = 0;
      const maxScrollAttempts = 40;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      while (!found && scrollAttempts < maxScrollAttempts) {
        const currentScroll = container.scrollTop;
        
        // Cari semua reply button yang visible
        const allReplyBtns = Array.from(document.querySelectorAll('span[data-e2e="comment-reply-1"]'))
          .filter(btn => {
            if (btn.closest('#tiktok-reply-ui')) return false;
            const rect = btn.getBoundingClientRect();
            return rect.top >= 0 && rect.top <= window.innerHeight;
          });
        
        if (scrollAttempts % 5 === 0) {
          addLog(`   🔎 Scroll ${scrollAttempts}: ${allReplyBtns.length} visible (${currentScroll}/${maxScroll})`, 'info');
        }
        
        for (const btn of allReplyBtns) {
          // Naik 3 level ke parent sesuai hasil debug
          // Level 0: SPAN (reply button)
          // Level 1: DIV
          // Level 2: DIV
          // Level 3: DIV.DivCommentContentWrapper (ada username & text di sini)
          let commentContainer = btn.parentElement?.parentElement?.parentElement;
          
          if (!commentContainer) continue;
          
          const foundUsername = extractUsername(commentContainer);
          
          if (foundUsername === username) {
            found = true;
            addLog(`   ✅ MATCH! Found @${username}`, 'success');
            return await executeReply(btn, commentContainer);
          }
        }
        
        // Cek apakah sudah mentok bawah
        if (currentScroll >= maxScroll - 10) {
          addLog(`   ⚠️ Reached bottom`, 'warning');
          break;
        }
        
        // Scroll ke bawah 350px
        container.scrollTop += 350;
        await sleep(1000);
        
        scrollAttempts++;
      }
      
      if (!found) {
        addLog(`   ❌ Not found after ${scrollAttempts} scrolls`, 'error');
      }
      
      return false;

    } catch (error) {
      addLog(`   ❌ Error: ${error.message}`, 'error');
      return false;
    }
  };

  // Helper function untuk extract username
  const extractUsername = (container) => {
    // Coba selector yang ditemukan di debug
    const usernameEl = container.querySelector('[data-e2e*="username"]') ||
                      container.querySelector('a[href*="/@"]');
    
    if (usernameEl) {
      return usernameEl.textContent.trim().replace('@', '');
    }
    
    return null;
  };

  const executeReply = async (btn, commentContainer) => {
    try {
      // Scroll ke komentar
      commentContainer.scrollIntoView({ block: 'center', behavior: 'smooth' });
      await sleep(2000);

      // Klik reply
      addLog(`   🖱️ Clicking reply`, 'info');
      btn.click();
      await sleep(3500);

      const textarea = findReplyTextarea();
      if (!textarea) {
        addLog(`   ❌ Textarea not found`, 'error');
        return false;
      }

      addLog(`   ⌨️ Typing message`, 'info');
      await typeText(textarea, `ayo join serverku! ${CONFIG.DISCORD_LINK}`);
      await sleep(1000);

      addLog(`   📤 Sending (Enter)`, 'info');
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      
      await sleep(1500);
      
      if (textarea.textContent.trim().length === 0 || textarea.innerHTML.trim().length < 10) {
        addLog(`   ✅ Success via Enter!`, 'success');
        return true;
      }
      
      addLog(`   🔄 Trying Post button`, 'warning');
      const postBtn = findPostButton();
      if (postBtn) {
        postBtn.click();
        await sleep(2000);
        addLog(`   ✅ Success via Post!`, 'success');
        return true;
      }

      addLog(`   ❌ Failed to send`, 'error');
      return false;
    } catch (error) {
      addLog(`   ❌ Execute reply error: ${error.message}`, 'error');
      return false;
    }
  };

  const findCommentContainer = () => {
    // Coba berbagai selector
    const selectors = [
      '[data-e2e="comment-list"]',
      'div[class*="DivCommentListContainer"]',
      'div[class*="CommentListContainer"]',
      'div[class*="comment-list"]',
      'div[class*="CommentList"]'
    ];
    
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.scrollHeight > el.clientHeight) {
        addLog(`   📦 Container found: ${selector}`, 'success');
        return el;
      }
    }
    
    return null;
  };

  const scrollToLoadAllComments = async () => {
    addLog('📜 Scroll untuk load semua komentar...', 'info');
    
    const container = findCommentContainer();
    
    if (!container) {
      addLog('⚠️ Container tidak ditemukan, skip scroll', 'warning');
      return;
    }

    // Scroll ke paling atas dulu
    container.scrollTop = 0;
    await sleep(500);

    let scrollAttempts = 0;
    const maxAttempts = 25;
    let lastScrollTop = -1;

    while (scrollAttempts < maxAttempts) {
      const currentScrollTop = container.scrollTop;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      // Cek apakah sudah mentok atau tidak ada perubahan
      if (currentScrollTop >= maxScroll - 10 || currentScrollTop === lastScrollTop) {
        addLog('✅ Scroll selesai (mentok bawah)', 'success');
        break;
      }
      
      lastScrollTop = currentScrollTop;
      
      // Scroll 400px
      container.scrollTop += 400;
      scrollAttempts++;
      
      elStatus.textContent = `📜 Scrolling ${scrollAttempts}/${maxAttempts}... (${currentScrollTop}/${maxScroll})`;
      
      await sleep(1200);
    }
    
    // Scroll ke atas lagi
    addLog('⬆️ Scroll kembali ke atas', 'info');
    container.scrollTop = 0;
    await sleep(1500);
  };

  btnStart.onclick = async () => {
    if (scrapedComments.length === 0) {
      addLog('⚠️ Scrape dulu untuk dapatkan komentar', 'warning');
      return;
    }

    btnStart.disabled = true;
    btnStart.textContent = '⏳ Loading...';
    
    addLog('🚀 MULAI AUTO REPLY', 'success');

    // Scroll dulu untuk load semua komentar ke DOM
    await scrollToLoadAllComments();

    const comments = scrapedComments.filter(c => !replied.has(c.id)).slice(0, CONFIG.MAX_REPLIES);
    
    elFound.textContent = comments.length;
    addLog(`✅ ${comments.length} komentar akan di-reply`, 'success');

    if (comments.length === 0) {
      addLog('⚠️ Semua sudah di-reply', 'warning');
      elStatus.textContent = '✅ Semua sudah di-reply';
      btnStart.disabled = false;
      btnStart.textContent = '▶ Reply';
      return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i];
      
      elStatus.textContent = `📝 Reply ${i+1}/${comments.length}...`;

      const success = await replyToCommentByUsername(comment.username, comment.komentar);
      
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
        addLog(`⏳ Tunggu ${Math.round(delay / 1000)}s...`, 'info');
        elStatus.textContent = `⏳ Tunggu ${Math.round(delay / 1000)}s...`;
        await sleep(delay);
      }
    }

    addLog(`🏁 SELESAI! ${successCount} berhasil, ${skipCount} skip`, 'success');
    
    elStatus.textContent = '✅ Selesai!';
    btnStart.disabled = false;
    btnStart.textContent = '▶ Reply';
  };

  // Auto start interceptor
  startIntercept();
  addLog('🚀 Script ready!', 'success');
  addLog('💡 Klik "Scrape DOM" untuk ambil komentar', 'info');
})();
