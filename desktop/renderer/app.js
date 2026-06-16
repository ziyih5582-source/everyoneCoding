// ══════════════════════════════════════════════════════
// Everyone Coding — Renderer Process
// ══════════════════════════════════════════════════════

let editor = null;
let currentFilePath = null;
let currentTarget = 'web';
let currentExt = '.html';
let hasApiKey = false;
let skillsMap = {};

// ══════════════════════════════════════════════════════
// Monaco Editor 初始化
// ══════════════════════════════════════════════════════

require.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
});

require(['vs/editor/editor.main'], function () {
  // 注册纯文本语言（高亮注释行）
  monaco.languages.register({ id: 'everyoneCoding' });
  monaco.languages.setMonarchTokensProvider('everyoneCoding', {
    tokenizer: {
      root: [
        [/^--.*$/, 'comment'],
        [/^[A-Z]+(?=\s|$)/, 'keyword'],
        [/"[^"]*"/, 'string'],
        [/\([^)]*\)/, 'type'],
        [/\b\d+(px|%|em|rem)\b/, 'number'],
      ],
    },
  });
  monaco.editor.defineTheme('ec-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569cd6', fontStyle: 'bold' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'type', foreground: 'dcdcaa' },
      { token: 'number', foreground: 'b5cea8' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2a2d2e',
    },
  });

  // 创建编辑器
  editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: '-- 在这里用自然语言描述你想要的东西...\n-- 例如：让 D13 的 LED 每隔 1 秒闪烁一次',
    language: 'everyoneCoding',
    theme: 'ec-dark',
    fontSize: 15,
    lineHeight: 1.8,
    fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'PingFang SC', 'Microsoft YaHei', monospace",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    bracketPairColorization: { enabled: false },
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    tabSize: 2,
    suggest: { showWords: false },
  });

  updateStatus('就绪');
  initApp();
});

// ══════════════════════════════════════════════════════
// 应用初始化
// ══════════════════════════════════════════════════════

async function initApp() {
  await checkApiKey();
  await loadSkills();
  bindEvents();
}

async function checkApiKey() {
  const result = await window.api.getApiKey();
  hasApiKey = !!(result.key && result.key.trim());
  const btn = document.getElementById('btn-apikey');
  btn.textContent = hasApiKey ? '🔑✓' : '🔑';
  btn.title = hasApiKey ? 'API Key 已设置 (点击修改)' : '请先设置 API Key';

  if (!hasApiKey) {
    showApiKeyModal();
  }
}

function showApiKeyModal() {
  document.getElementById('apikey-overlay').classList.remove('hidden');
  document.getElementById('apikey-input').value = '';
  document.getElementById('apikey-error').classList.remove('show');
  document.getElementById('apikey-input').focus();
}

function hideApiKeyModal() {
  document.getElementById('apikey-overlay').classList.add('hidden');
}

async function saveApiKey() {
  const input = document.getElementById('apikey-input');
  const key = input.value.trim();
  const errorEl = document.getElementById('apikey-error');

  if (!key) {
    errorEl.textContent = '请输入 API Key';
    errorEl.classList.add('show');
    return;
  }
  if (!key.startsWith('sk-')) {
    errorEl.textContent = 'API Key 格式不正确（应以 sk- 开头）';
    errorEl.classList.add('show');
    return;
  }

  const result = await window.api.saveApiKey(key);
  if (result.success) {
    hasApiKey = true;
    document.getElementById('btn-apikey').textContent = '🔑✓';
    document.getElementById('btn-apikey').title = 'API Key 已设置 (点击修改)';
    hideApiKeyModal();
    updateStatus('✅ API Key 已保存');
  } else {
    errorEl.textContent = `保存失败: ${result.error}`;
    errorEl.classList.add('show');
  }
}

async function loadSkills() {
  const result = await window.api.listSkills();
  const select = document.getElementById('target-select');

  if (result.error || result.skills.length === 0) {
    select.innerHTML = '<option value="web">web (默认)</option>';
    skillsMap = { web: '.html' };
    return;
  }

  // 缓存 skill 信息
  skillsMap = {};
  for (const s of result.skills) {
    skillsMap[s.name] = s.ext;
  }

  select.innerHTML = result.skills
    .map(s => `<option value="${s.name}">${s.display} (*${s.ext})</option>`)
    .join('');

  // 默认选 web
  if (result.skills.find(s => s.name === 'web')) {
    select.value = 'web';
    currentExt = skillsMap['web'] || '.html';
  }
}

// ══════════════════════════════════════════════════════
// 事件绑定
// ══════════════════════════════════════════════════════

function bindEvents() {
  // Target 切换
  document.getElementById('target-select').addEventListener('change', (e) => {
    currentTarget = e.target.value;
    currentExt = skillsMap[currentTarget] || '.html';
    document.getElementById('status-target').textContent = `目标：${currentTarget}`;
  });

  // 编译按钮
  document.getElementById('btn-compile').addEventListener('click', () => compile());

  // API Key 按钮
  document.getElementById('btn-apikey').addEventListener('click', () => showApiKeyModal());

  // API Key 模态框
  document.getElementById('apikey-save').addEventListener('click', () => saveApiKey());
  document.getElementById('apikey-skip').addEventListener('click', () => hideApiKeyModal());
  document.getElementById('apikey-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKey();
    if (e.key === 'Escape') hideApiKeyModal();
  });

  // 输出面板 Tab 切换
  document.querySelectorAll('.output-tab').forEach(tab => {
    tab.addEventListener('click', () => switchOutputTab(tab.dataset.tab));
  });

  // 复制代码
  document.getElementById('btn-copy-code').addEventListener('click', copyCode);

  // 文件操作
  document.getElementById('btn-open').addEventListener('click', openFile);
  document.getElementById('btn-save').addEventListener('click', saveFile);

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); openFile(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); compile(); }
  });

  // 分隔条拖拽
  initResizeHandle();

  // 初始状态
  document.getElementById('status-target').textContent = '目标：web';
}

// ══════════════════════════════════════════════════════
// 编译流程
// ══════════════════════════════════════════════════════

async function compile() {
  if (!editor) return;

  const content = editor.getValue().trim();
  if (!content) {
    updateStatus('⚠ 编辑器为空，请先写一些内容');
    return;
  }

  const target = document.getElementById('target-select').value;
  const btn = document.getElementById('btn-compile');

  // UI 状态
  btn.disabled = true;
  btn.textContent = '⏳ 编译中...';
  btn.classList.add('compiling');
  updateStatus(`正在编译 (${target})...`);
  document.getElementById('log-output').textContent = '';

  try {
    const result = await window.api.compile(content, target, currentExt);

    btn.classList.remove('compiling');
    btn.textContent = '▶ 编译';

    if (result.error) {
      document.getElementById('log-output').textContent = `❌ 编译错误:\n${result.error}`;
      switchOutputTab('log');
      updateStatus('❌ 编译失败');
      btn.textContent = '▶ 编译';
      return;
    }

    // 成功
    updateStatus(`✅ 编译成功 — ${result.output.length} 字符`);

    if (result.log) {
      document.getElementById('log-output').textContent = result.log;
    }

    if (target === 'web') {
      showWebPreview(result.output);
      switchOutputTab('preview');
    } else {
      showCode(result.output);
      switchOutputTab('code');
    }
  } catch (err) {
    btn.classList.remove('compiling');
    btn.textContent = '▶ 编译';
    document.getElementById('log-output').textContent = `❌ 错误: ${err.message}`;
    switchOutputTab('log');
    updateStatus('❌ 编译异常');
  } finally {
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════════════════
// 输出展示
// ══════════════════════════════════════════════════════

function showWebPreview(html) {
  document.getElementById('preview-placeholder').style.display = 'none';
  const iframe = document.getElementById('preview-frame');
  iframe.style.display = 'block';
  iframe.srcdoc = html;
}

function showCode(code) {
  document.getElementById('code-view').textContent = code;
  document.getElementById('btn-copy-code').style.display = 'block';
}

function copyCode() {
  const code = document.getElementById('code-view').textContent;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.getElementById('btn-copy-code');
    btn.textContent = '✅ 已复制!';
    setTimeout(() => { btn.textContent = '📋 复制代码'; }, 2000);
  });
}

function switchOutputTab(tabName) {
  document.querySelectorAll('.output-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
  const panel = document.getElementById(`tab-${tabName}`);
  if (tabBtn) tabBtn.classList.add('active');
  if (panel) panel.classList.add('active');
}

// ══════════════════════════════════════════════════════
// 文件操作
// ══════════════════════════════════════════════════════

async function openFile() {
  const result = await window.api.openFile();
  if (!result) return;

  currentFilePath = result.path;
  document.getElementById('file-name').textContent = result.name;
  if (editor) editor.setValue(result.content);
  updateStatus(`已打开: ${result.name}`);
}

async function saveFile() {
  if (!editor) return;
  const content = editor.getValue();
  const defaultName = currentFilePath
    ? currentFilePath.split('/').pop()
    : 'untitled.txt';

  const savedPath = await window.api.saveFile(content, defaultName);
  if (savedPath) {
    currentFilePath = savedPath;
    document.getElementById('file-name').textContent = savedPath.split('/').pop();
    updateStatus(`已保存: ${savedPath}`);
  }
}

// ══════════════════════════════════════════════════════
// UI 工具
// ══════════════════════════════════════════════════════

function updateStatus(msg) {
  document.getElementById('status-text').textContent = msg;
}

function initResizeHandle() {
  const handle = document.getElementById('resize-handle');
  const editorPane = document.getElementById('editor-pane');
  const outputPane = document.getElementById('output-pane');

  let isResizing = false;

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const totalWidth = editorPane.parentElement.clientWidth;
    const editorWidth = e.clientX;
    const outputWidth = totalWidth - editorWidth - 4;

    if (editorWidth > 300 && outputWidth > 250) {
      editorPane.style.flex = 'none';
      editorPane.style.width = editorWidth + 'px';
      outputPane.style.width = outputWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}
