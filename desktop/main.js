const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const KEY_FILE = path.join(os.homedir(), '.everyone-coding-key');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Everyone Coding',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 开发模式打开 DevTools
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// ═══════════════════════════════════════════════════════
// IPC: 获取可用 Skill 列表
// ═══════════════════════════════════════════════════════
ipcMain.handle('list-skills', async () => {
  return new Promise((resolve) => {
    const compiler = path.join(PROJECT_ROOT, 'compiler.py');
    execFile('python3', [compiler, '--list'], (err, stdout, stderr) => {
      if (err) {
        resolve({ error: stderr || err.message, skills: [] });
        return;
      }
      // 解析 "arduino → Arduino / 嵌入式 (输出: *.ino)" 格式
      const skills = [];
      for (const line of stdout.split('\n')) {
        const m = line.match(/^\s*(\S+)\s+→\s+(.+?)\s+\(输出:\s+\*(.+?)\)/);
        if (m) skills.push({ name: m[1], display: m[2].trim(), ext: m[3] });
      }
      resolve({ skills });
    });
  });
});

// ═══════════════════════════════════════════════════════
// IPC: 编译
// ═══════════════════════════════════════════════════════
ipcMain.handle('compile', async (_event, { content, target, ext }) => {
  return new Promise((resolve) => {
    // 写入临时 .txt 文件
    const tmpDir = path.join(PROJECT_ROOT, 'desktop', '.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const inputPath = path.join(tmpDir, `input_${Date.now()}.txt`);
    const outputExt = ext || (target === 'web' ? '.html' : '.ino');
    const outputPath = inputPath.replace(/\.txt$/, outputExt);
    fs.writeFileSync(inputPath, content, 'utf-8');

    const compiler = path.join(PROJECT_ROOT, 'compiler.py');
    const args = [compiler, inputPath, '--target', target, '-o', outputPath];

    execFile('python3', args, { timeout: 640000 }, (err, stdout, stderr) => {
      if (err) {
        if (err.killed) {
          resolve({ error: '编译超时（超过 120 秒）。请重试，或简化描述内容。' });
        } else {
          resolve({ error: stderr || err.message });
        }
        return;
      }

      // 读取输出
      let output = '';
      try {
        output = fs.readFileSync(outputPath, 'utf-8');
      } catch (e) {
        resolve({ error: `读取输出文件失败: ${e.message}` });
        return;
      }

      // 清理临时文件
      try { fs.unlinkSync(inputPath); } catch (_) {}
      try { fs.unlinkSync(outputPath); } catch (_) {}

      resolve({ output, target, log: stdout });
    });
  });
});

// ═══════════════════════════════════════════════════════
// IPC: 文件操作
// ═══════════════════════════════════════════════════════
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '打开 .txt 文件',
    filters: [{ name: 'Everyone Coding 文件', extensions: ['txt'] }],
    properties: ['openFile'],
    defaultPath: path.join(PROJECT_ROOT, 'examples'),
  });
  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const content = fs.readFileSync(filePath, 'utf-8');
  return { path: filePath, name: path.basename(filePath), content };
});

ipcMain.handle('save-file', async (_event, { content, defaultName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存 .txt 文件',
    defaultPath: defaultName || 'untitled.txt',
    filters: [{ name: 'Everyone Coding 文件', extensions: ['txt'] }],
  });
  if (result.canceled || !result.filePath) return null;

  fs.writeFileSync(result.filePath, content, 'utf-8');
  return result.filePath;
});

// ═══════════════════════════════════════════════════════
// IPC: API Key 管理
// ═══════════════════════════════════════════════════════
ipcMain.handle('get-api-key', async () => {
  try {
    if (fs.existsSync(KEY_FILE)) {
      const data = JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8'));
      return { key: data.key || '' };
    }
  } catch (_) {}
  return { key: '' };
});

ipcMain.handle('save-api-key', async (_event, { key }) => {
  try {
    fs.writeFileSync(KEY_FILE, JSON.stringify({ key }), { mode: 0o600 });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ═══════════════════════════════════════════════════════
// App 生命周期
// ═══════════════════════════════════════════════════════
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
