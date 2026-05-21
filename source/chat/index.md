---
title: AI 聊天
layout: page
---

<div id="chat-container" style="max-width:800px;margin:0 auto;">
  <div id="chat-messages" style="height:450px;overflow-y:auto;border:1px solid #e0e0e0;border-radius:8px;padding:16px;margin-bottom:16px;background:#fafafa;"></div>
  <div style="display:flex;gap:8px;">
    <input id="chat-input" type="text" placeholder="输入消息，按 Enter 发送..." style="flex:1;padding:10px 14px;border:1px solid #ddd;border-radius:8px;font-size:14px;outline:none;" />
    <button id="chat-send" style="padding:10px 20px;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">发送</button>
  </div>
  <div style="margin-top:8px;font-size:12px;color:#999;text-align:right;">
    请在下方输入你的 DeepSeek API Key
    <input id="api-key-input" type="password" placeholder="sk-..." style="margin-left:8px;padding:4px 8px;border:1px solid #ddd;border-radius:4px;width:200px;font-size:12px;" />
    <button id="save-key" style="padding:4px 10px;background:#22c55e;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">保存</button>
  </div>
</div>

<script>
(function() {
  const messagesEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const apiKeyInput = document.getElementById('api-key-input');
  const saveKeyBtn = document.getElementById('save-key');

  let apiKey = localStorage.getItem('deepseek_api_key') || '';
  if (apiKey) apiKeyInput.value = apiKey;

  let chatHistory = [];

  function addMessage(role, content) {
    const div = document.createElement('div');
    div.style.cssText = 'margin-bottom:12px;display:flex;' + (role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;');
    const bubble = document.createElement('div');
    bubble.style.cssText = 'max-width:75%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.6;white-space:pre-wrap;' +
      (role === 'user' ? 'background:#4f46e5;color:#fff;border-bottom-right-radius:4px;' :
       role === 'system' ? 'background:#fef3c7;color:#92400e;border-bottom-left-radius:4px;' :
       'background:#e5e7eb;color:#1f2937;border-bottom-left-radius:4px;');
    bubble.textContent = content;
    div.appendChild(bubble);
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function sendMessage() {
    const msg = inputEl.value.trim();
    if (!msg) return;
    if (!apiKey) {
      addMessage('system', '⚠️ 请先输入 DeepSeek API Key');
      return;
    }
    addMessage('user', msg);
    chatHistory.push({ role: 'user', content: msg });
    inputEl.value = '';

    const loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'margin-bottom:12px;';
    loadingDiv.innerHTML = '<span style="color:#999;font-size:13px;">AI 正在思考...</span>';
    loadingDiv.id = 'loading-msg';
    messagesEl.appendChild(loadingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    try {
      const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个友好的AI助手，回答简洁清晰。' },
            ...chatHistory
          ],
          stream: false
        })
      });
      const data = await resp.json();
      document.getElementById('loading-msg')?.remove();
      if (data.choices && data.choices[0]) {
        const reply = data.choices[0].message.content;
        addMessage('assistant', reply);
        chatHistory.push({ role: 'assistant', content: reply });
      } else {
        addMessage('system', '❌ 请求失败: ' + (data.error?.message || '未知错误'));
      }
    } catch (e) {
      document.getElementById('loading-msg')?.remove();
      addMessage('system', '❌ 网络错误: ' + e.message);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  saveKeyBtn.addEventListener('click', function() {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem('deepseek_api_key', key);
      apiKey = key;
      addMessage('system', '✅ API Key 已保存');
    }
  });

  addMessage('assistant', '你好！我是 AI 助手，请问有什么可以帮你的？');
})();
</script>
