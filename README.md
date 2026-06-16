<img width="2560" height="1600" alt="53abad8fde3cc2cc2bb0007903816a8f" src="https://github.com/user-attachments/assets/b38bece3-889f-480a-8f8a-a4251e4b4462" />
<img width="2560" height="1600" alt="d2080d5c426e96df07aa089871f1e58a" src="https://github.com/user-attachments/assets/606405a3-14fb-42f6-bd15-f60577a70474" />
<div align="center">

# 🚀 Everyone Coding

**从自然语言到可运行代码 · 让编程成为所有人的超能力**

<a href="https://platform.deepseek.com" target="_blank">
  <img src="https://img.shields.io/badge/API-DeepSeek-12B3A8?style=for-the-badge" alt="DeepSeek AI">
</a>
<a href="https://github.com/ziyih5582-source/everyoneCoding" target="_blank">
  <img src="https://img.shields.io/badge/Code-JavaScript%20|%20Python-007acc?style=for-the-badge" alt="Tech Stack">
</a>

[快速开始](#-快速开始) • [工作原理](#-工作原理) • [示例](#-示例) • [贡献](#-贡献)

</div>

---

## ✨ 核心理念

不用学语法，不用学框架，**只用说出你的想法**。

> 💡 **一句话描述** → AI 编译器 → 🎯 完整可运行代码

| 你的想法 | 输出结果 |
|---------|--------|
| "做一个烘焙店网站，有导航栏、商品卡片、购物车" | ✅ 完整 HTML + CSS |
| "LED 每 1 秒闪烁一次，按钮控制开关" | ✅ Arduino .ino 代码 |
| "用户登录表单，邮箱验证" | ✅ 前端 + 逻辑代码 |

---

## 🎯 快速开始

### 1️⃣ 安装

```bash
git clone https://github.com/ziyih5582-source/everyoneCoding.git
cd everyoneCoding
pip install openai
```

### 2️⃣ 获取 API Key

- 访问 [platform.deepseek.com](https://platform.deepseek.com)
- 创建 API Key（首次运行时会提示保存）

### 3️⃣ 编译你的第一个代码

```bash
python3 compiler.py examples/web/hello.txt --open
```

✅ 浏览器自动打开生成的网页

---

## 🔧 工作原理

```
┌────────────────────┐
│   你的想法.txt     │  用自然语言描述需求
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  通用编译引擎      │  + Skill 文件（领域知识）
│  compiler.py       │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  DeepSeek AI       │  理解 + 生成代码
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  output.html       │  ✅ 可直接运行
│  output.ino        │
└────────────────────┘
```

**关键特性：**
- 🎨 编译器是**通用引擎**，零领域特定代码
- 📚 每个领域由一个 **Skill 文件** 定义
- ♻️ 不满意？改 `.txt` 重新编译，无限迭代

---

## 📦 支持的 Skill（编译目标）

### 🌐 web — 网页制作

用直观的关键词或纯自然语言描述页面：

```txt
PAGE "烘焙店主页"
COLOR background: #fffbf0

HEADER (sticky, shadow)
  LOGO "🍪 Sweet Bakery"
  NAV "首页" "菜单" "预订" "联系"

SECTION "特色产品"
  CARD "法式牛角包" (img, price: ¥25)
  CARD "巧克力蛋糕" (img, price: ¥68)

FORM "在线预订" (name, email, date, submit)
```

**输出：** 响应式 HTML5 + 现代 CSS + 交互效果

→ 查看完整语法：[`skills/web.md`](skills/web.md)

### 🤖 arduino — 嵌入式开发

纯自然语言控制硬件，无需学 C++：

```txt
LED（D13）每隔 1 秒闪烁一次，亮 1 秒灭 1 秒。
```

**支持的硬件：**
- GPIO 控制 • 模拟传感器 • PWM
- 舵机 • 超声波测距 • LCD 屏幕 • 继电器
- 温度 / 湿度 / 运动检测

→ 查看完整文档：[`skills/arduino.md`](skills/arduino.md)

```bash
python3 compiler.py examples/arduino/auto_watering.txt --target arduino
# → 自动浇花系统完整代码
```

---

## 🎮 常用命令

```bash
# 列出所有可用 Skill
python3 compiler.py --list

# 查看 web Skill 的领域知识
python3 compiler.py --grammar

# 编译指定 Skill
python3 compiler.py input.txt --target arduino

# 编译后自动打开（web 默认行为）
python3 compiler.py input.txt --open

# 指定输出文件名
python3 compiler.py input.txt -o my_output.html
```

---

## 📂 项目结构

```
everyoneCoding/
├── 🔧 compiler.py              # 通用编译引擎（所有 Skill 共用）
├── 📚 skills/
│   ├── web.md                  # Web 网页编译规则 + 语法
│   └── arduino.md              # Arduino 嵌入式编译规则
├── 📝 examples/
│   ├── web/
│   │   ├── hello.txt           # 简单示例
│   │   ├── landing.txt         # 落地页
│   │   └── bakery/
│   │       └── bakery_cn.txt   # 完整案例（494行 → 1900行代码）
│   └── arduino/
│       ├── blink.txt           # LED 闪烁
│       ├── button_led.txt      # 按钮控制
│       └── auto_watering.txt   # 自动浇花系统
└── README.md
```

---

## 🚀 添加新 Skill（扩展新领域）

**只需 3 步：**

1. 创建文件 `skills/my_skill.md`
2. 写入 Skill 定义：

```markdown
---
name: game
display: 2D 小游戏
ext: .html
open: true
---

You are an AI Game Compiler...

=== GAME ENGINE KNOWLEDGE ===
[领域知识内容]
```

3. 运行 `python3 compiler.py --list` 立即看到新目标！

✨ **编译器代码零改动** — Skill 系统完全解耦

---

## 💡 设计哲学

| 原则 | 含义 |
|------|------|
| **一行一意图** | 每句话对应一个输出，AI 不会隐藏修改 |
| **语法是建议** | 写得不精确也能工作，AI 推断意思 |
| **迭代即编译** | 改 `.txt` → 重新运行 → 看结果（不需懂代码） |
| **Skill 即扩展** | 新领域 = 一个新文件，与引擎完全独立 |

---

## 🛠 技术栈

- **前端编译**：JavaScript (53.3%) + CSS (18.4%)
- **后端编译**：Python (28.3%)
- **AI 引擎**：[DeepSeek](https://www.deepseek.com)

---

## 📋 系统要求

- Python 3.10+
- `pip install openai`
- DeepSeek API Key（免费注册）

---

## 🤝 贡献

我们欢迎新的 Skill 和示例！

1. Fork 本仓库
2. 创建新分支：`git checkout -b add-skill-gaming`
3. 提交 Pull Request

---

## 📄 许可证

MIT

---

<div align="center">

### 🎓 编程不应是少数人的特权

**每个人都有值得被实现的想法**

[⭐ 给个 Star](https://github.com/ziyih5582-source/everyoneCoding) · [📧 反馈](https://github.com/ziyih5582-source/everyoneCoding/issues)

</div>
