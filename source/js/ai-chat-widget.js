// AI 聊天浮动小窗
(function() {
  // 只在非 /chat/ 页面加载浮动小窗
  if (window.location.pathname === '/chat/' || window.location.pathname === '/chat/index.html') return;

  // 创建浮动按钮
  const floatBtn = document.createElement('button');
  floatBtn.id = 'ai-float-btn';
  floatBtn.innerHTML = '🤖';
  floatBtn.title = 'AI 助手';
  document.body.appendChild(floatBtn);

  // 创建面板
  const panel = document.createElement('div');
  panel.id = 'ai-float-panel';
  panel.innerHTML = `
    <div id="ai-float-header">
      <span>🤖 AI 助手</span>
      <div>
        <button id="ai-float-minimize" title="最小化">−</button>
        <button id="ai-float-close" title="关闭">×</button>
      </div>
    </div>
    <div id="ai-float-messages"></div>
    <div id="ai-float-input-area">
      <input id="ai-float-input" type="text" placeholder="输入消息..." />
      <button id="ai-float-send">➤</button>
    </div>
    <div id="ai-float-api-bar">
      <input id="ai-float-api-key" type="password" placeholder="DeepSeek API Key" />
      <button id="ai-float-save-key">保存</button>
    </div>
  `;
  document.body.appendChild(panel);

  // 状态
  let isOpen = false;
  let chatHistory = [];
  const messagesEl = document.getElementById('ai-float-messages');
  const inputEl = document.getElementById('ai-float-input');
  const apiKeyInput = document.getElementById('ai-float-api-key');

  let apiKey = localStorage.getItem('deepseek_api_key') || '';
  if (apiKey) apiKeyInput.value = apiKey;

  function addMsg(role, content) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:10px;display:flex;' +
      (role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;');
    const bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:80%;padding:8px 12px;border-radius:10px;font-size:13px;line-height:1.5;white-space:pre-wrap;' +
      (role === 'user' ? 'background:#4f46e5;color:#fff;' :
       role === 'system' ? 'background:#fef3c7;color:#92400e;' :
       'background:#e5e7eb;color:#1f2937;');
    bubble.textContent = content;
    div.appendChild(bubble);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMsg() {
    const msg = inputEl.value.trim();
    if (!msg) return;
    if (!apiKey) { addMsg('system', '⚠️ 请先输入 API Key'); return; }
    addMsg('user', msg);
    chatHistory.push({ role: 'user', content: msg });
    inputEl.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'margin-bottom:10px;';
    loadingDiv.innerHTML = '<span style="color:#999;font-size:12px;">思考中...</span>';
    loadingDiv.id = 'float-loading';
    messagesEl.appendChild(loadingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'system', content: '你是一个友好的AI助手，回答尽量简洁。' }, ...chatHistory],
          stream: false
        })
      });
      const data = await resp.json();
      document.getElementById('float-loading')?.remove();
      if (data.choices?.[0]) {
        const reply = data.choices[0].message.content;
        addMsg('assistant', reply);
        chatHistory.push({ role: 'assistant', content: reply });
      } else {
        addMsg('system', '❌ ' + (data.error?.message || '请求失败'));
      }
    } catch (e) {
      document.getElementById('float-loading')?.remove();
      addMsg('system', '❌ 网络错误: ' + e.message);
    }
  }

  // 事件绑定
  floatBtn.addEventListener('click', function() {
    isOpen = !isOpen;
    panel.classList.toggle('show', isOpen);
    floatBtn.textContent = isOpen ? '✕' : '🤖';
  });

  document.getElementById('ai-float-close').addEventListener('click', function() {
    isOpen = false;
    panel.classList.remove('show');
    floatBtn.textContent = '🤖';
  });

  document.getElementById('ai-float-minimize').addEventListener('click', function() {
    isOpen = false;
    panel.classList.remove('show');
    floatBtn.textContent = '🤖';
  });

  document.getElementById('ai-float-send').addEventListener('click', sendMsg);
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMsg();
  });

  document.getElementById('ai-float-save-key').addEventListener('click', function() {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('deepseek_api_key', key);
      apiKey = key;
      addMsg('system', '✅ 已保存');
    }
  });

  addMsg('assistant', '你好！有什么想问的？');
})();
