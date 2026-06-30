/*!
 * Lucrator embeddable chat widget — drop into ANY website with one <script> tag.
 * Self-contained: no framework, no build step, styles isolated in a shadow DOM.
 *
 *   <script src="https://YOUR_HOST/lucrator-widget.js"
 *           data-api="https://your-backend.onrender.com"
 *           data-client-id="C-260630-..."
 *           data-name="Ahmed's Restaurant"
 *           data-accent="#b4532a"
 *           data-greeting="Hi! How can we help?"></script>
 *
 * The widget posts to {api}/api/chatbot/ask with { messages, clientId }, so it
 * speaks as that client's business and books/sells into their sheet.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var cfg = {
    api: (script.getAttribute('data-api') || '').replace(/\/$/, ''),
    clientId: script.getAttribute('data-client-id') || '',
    name: script.getAttribute('data-name') || 'Assistant',
    accent: script.getAttribute('data-accent') || '#b4532a',
    greeting: script.getAttribute('data-greeting') || 'Hi! How can we help you today?',
    launcher: script.getAttribute('data-launcher') || 'Chat with us',
  };
  if (!cfg.api) { console.error('[lucrator-widget] missing data-api'); return; }

  var messages = []; // { role, content }
  var open = false;
  var loading = false;

  // ---- shadow host ----------------------------------------------------------
  var host = document.createElement('div');
  host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483000;';
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  var style = document.createElement('style');
  style.textContent = [
    ':host,*{box-sizing:border-box}',
    '.btn{display:inline-flex;align-items:center;gap:8px;border:0;cursor:pointer;border-radius:999px;',
    'background:' + cfg.accent + ';color:#fff;padding:12px 18px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;',
    'box-shadow:0 6px 20px rgba(0,0,0,.18)}',
    '.panel{display:flex;flex-direction:column;width:min(92vw,370px);height:min(70vh,540px);',
    'background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.22);',
    'font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#22201e}',
    '.hd{background:' + cfg.accent + ';color:#fff;padding:14px 16px;font-weight:700}',
    '.hd small{display:block;font-weight:400;opacity:.8;font-size:12px}',
    '.msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#faf8f5}',
    '.b{max-width:85%;padding:9px 12px;border-radius:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}',
    '.b.bot{align-self:flex-start;background:#fff;border:1px solid #eadfd5;border-bottom-left-radius:5px}',
    '.b.me{align-self:flex-end;background:' + cfg.accent + ';color:#fff;border-bottom-right-radius:5px}',
    '.ok{align-self:flex-start;font-size:12px;font-weight:600;color:#2e7d52;background:#e9f5ee;border:1px solid #bfe3cd;border-radius:10px;padding:6px 10px}',
    '.dots{align-self:flex-start;color:#999;font-size:13px;padding:4px 6px}',
    '.cmp{display:flex;gap:8px;padding:10px;border-top:1px solid #eadfd5;background:#fff}',
    '.cmp input{flex:1;border:1px solid #ddd2c8;border-radius:999px;padding:10px 14px;font-size:14px;outline:none}',
    '.cmp input:focus{border-color:' + cfg.accent + '}',
    '.cmp button{border:0;border-radius:999px;background:' + cfg.accent + ';color:#fff;width:40px;cursor:pointer;font-size:16px}',
    '.cmp button:disabled{opacity:.4;cursor:default}',
    '.x{float:right;cursor:pointer;background:transparent;border:0;color:#fff;font-size:18px;line-height:1;opacity:.85}',
  ].join('');
  root.appendChild(style);

  var wrap = document.createElement('div');
  root.appendChild(wrap);

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function render() {
    if (!open) {
      wrap.innerHTML = '<button class="btn" id="launch">💬 ' + esc(cfg.launcher) + '</button>';
      wrap.querySelector('#launch').onclick = function () { open = true; render(); };
      return;
    }
    var rows = '<div class="b bot">' + esc(cfg.greeting) + '</div>';
    messages.forEach(function (m) {
      if (m.role === 'action') rows += '<div class="ok">' + esc(m.content) + '</div>';
      else rows += '<div class="b ' + (m.role === 'user' ? 'me' : 'bot') + '">' + esc(m.content) + '</div>';
    });
    if (loading) rows += '<div class="dots">…</div>';
    wrap.innerHTML =
      '<div class="panel">' +
      '<div class="hd"><button class="x" id="cls">✕</button>' + esc(cfg.name) + '<small>We usually reply right away</small></div>' +
      '<div class="msgs" id="msgs">' + rows + '</div>' +
      '<form class="cmp" id="form"><input id="in" placeholder="Type a message…" autocomplete="off" ' + (loading ? 'disabled' : '') + ' /><button type="submit" ' + (loading ? 'disabled' : '') + '>➤</button></form>' +
      '</div>';
    wrap.querySelector('#cls').onclick = function () { open = false; render(); };
    var msgsEl = wrap.querySelector('#msgs');
    msgsEl.scrollTop = msgsEl.scrollHeight;
    var input = wrap.querySelector('#in');
    if (!loading) input.focus();
    wrap.querySelector('#form').onsubmit = function (e) { e.preventDefault(); send(input.value); };
  }

  function send(text) {
    text = (text || '').trim();
    if (!text || loading) return;
    messages.push({ role: 'user', content: text });
    loading = true;
    render();
    var history = messages.filter(function (m) { return m.role === 'user' || m.role === 'assistant'; });
    fetch(cfg.api + '/api/chatbot/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, clientId: cfg.clientId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        loading = false;
        if (res && res.success && res.data) {
          messages.push({ role: 'assistant', content: res.data.reply });
          (res.data.actions || []).forEach(function (a) {
            messages.push({ role: 'action', content: a.type === 'sale' ? '✅ ' + (a.package || 'Order') + ' confirmed' : '✅ Booked for ' + (a.date || '') });
          });
        } else {
          messages.push({ role: 'assistant', content: 'Sorry — something went wrong. Please try again.' });
        }
        render();
      })
      .catch(function () {
        loading = false;
        messages.push({ role: 'assistant', content: 'Sorry — I could not reach the server. Please try again.' });
        render();
      });
    render();
  }

  render();
})();
