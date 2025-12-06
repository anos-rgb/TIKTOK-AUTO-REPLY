#🤖 TikTok Auto Reply Bot

An automated script to reply to comments on TikTok with a custom message. It features an interactive UI and a tracking system to prevent duplication.

## ✨ Features

- ✅ **Comment Auto Reply** - Reply to comments automatically with a custom message
- ✅ **Interactive UI** - Easy-to-use drag-and-drop control panel
- ✅ **Smart Detection** - Detect comments using the appropriate TikTok selector
- ✅ **Anti-Duplication** - Tracking system to skip already replied comments
- ✅ **Human-Like Typing** - Type with random delays like humans
- ✅ **Real-Time Logging** - Log details of every action taken
- ✅ **Statistics View** - Display statistics: found, successful, skipped
- ✅ **Local Storage** - Store reply history persistently

## 🚀 How to Use

### 1. Open a TikTok Video
Open the TikTok video page you want to reply to. Example:
```
https://www.tiktok.com/@username/video/1234567890
```

### 2. Open the Browser Console
- Chrome/Edge: Press F12 or Ctrl + Shift + J (Windows) / Cmd + Option + J (Mac)
- Firefox: Press F12 or Ctrl + Shift + K (Windows) / Cmd + Option + K (Mac)
- Select the Console tab

### 3. Paste the Script
Copy the entire script and paste it into the Console, then press Enter

### 4. The UI Appears
The control panel will appear in the top right corner with the following display:
```
🤖 TikTok Auto Reply
┌─ ... Automatic │
│ 🗑 Reset │
└───────────────────────────────────────┘
```

### 5. Start Auto Reply
Click the **"▶ Start Auto Reply"** button and the script will:
1. Scrape all visible comments
2. Filter those that have not been replied to
3. Click the Reply button
4. Type an automated message
5. Press Enter to send
6. Wait 3-5 seconds
7. Repeat for the next comment

## ⚙️ Configuration

Edit the `CONFIG` section in the initial script to customize:

``` javascript
const CONFIG = {
DISCORD_LINK: 'https://discord.gg/4JdW2n695T', // Link to send
MAX_REPLIES: 10, // Maximum comments per round
DELAY_MIN: 3000, // Minimum delay (ms)
DELAY_MAX: 5000 // Maximum delay (ms)
};
```

### Edit Reply Message
Edit the `replyToComment` function:
``` javascript
await typeText(textarea, `Come join my server! ${CONFIG.DISCORD_LINK}`);
```

Replace with your custom message:
``` javascript
await typeText(textarea, `Your custom message here!`);
```

## 📊 UI Features

### Panel Control
- **Draggable** - Slide the panel by dragging the header
- **Statistics View** - View statistics in real-time
- **Reset Button** - Clear reply history to re-reply
- **Close Button** - Close Panel (X in the right corner)

### Log System
The panel displays log details with the following colors:
- 🟢 **Green** - Success
- 🔴 **Red** - Error
- 🔵 **Blue** - Info
- 🟡 **Yellow** - Warning

Each log has a timestamp: `[HH:MM:SS] Message`

## 🔧 How It Works

### 1. Scraping Comments
Script using the official TikTok selector:
``` javascript
span[data-e2e="comment-reply-1"] // Button Reply
span[data-e2e="comment-level-1"] // Comment text
span[data-e2e*="username"] // Username
```

### 2. Click the Reply Button
``` javascript
comment.replyBtn.click(); // Click the span with role="button"
wait sleep(3000); // Wait for the text area to appear
```

### 3. Textarea Detection
Find the DraftJS editor that appears after clicking Reply:
``` javascript
const textarea = document.querySelector('.DraftEditor-editorContainer [contenteditable="true"]');
```

Filter "Add comment" vs. "Add reply" textareas based on placeholders.

### 4. Type Like a Human
```javascript
for (let i = 0; i < text.length; i++) {
document.execCommand('insertText', false, text[i]);
el.dispatchEvent(new Event('input', { bubble: true }));
await sleep(60 + Math.random() * 40); // Random delay 60-100 ms
}
```

### 5. Send Message
Sending priority:
1. **Press Enter** (original TikTok method)
```javascript
textarea.dispatchEvent(new KeyboardEvent('keydown', {
key: 'Enter', keyCode: 13, bubble: true
}));
```

2. **Click Post Button** (fallback)
```javascript
document.querySelector('div[data-e2e="comment-post"]').click();
```

### 6. Anti-Duplication
```javascript
const id = hash(username + ':' + text.substring(0, 50));
if (replied.has(id)) {
// Skip this comment
}
replied.add(id);
localStorage.setItem(STORAGE_KEY, JSON.stringify([...replied]));
```

## ⚠️ Limits & Tips

### Limits
- ❌ **Rate Limit** - TikTok may block if there are too many replies in a short period of time
- ❌ **Visible Comments Only** - Must scroll down to load more comments
- ❌ **Browser Only** - Must run in a browser, not headless

### Usage Tips
- ✅ **Scroll first** - Scroll down to load more comments
- ✅ **Don't spam** - Set a long enough delay (5-10 seconds) to avoid being banned
- ✅ **Test first** - Set `MAX_REPLIES: 3` for a test run
