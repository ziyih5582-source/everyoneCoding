const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Skill 列表
  listSkills: () => ipcRenderer.invoke('list-skills'),

  // 编译
  compile: (content, target, ext) => ipcRenderer.invoke('compile', { content, target, ext }),

  // 文件操作
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content, defaultName) => ipcRenderer.invoke('save-file', { content, defaultName }),

  // API Key
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  saveApiKey: (key) => ipcRenderer.invoke('save-api-key', { key }),
});
