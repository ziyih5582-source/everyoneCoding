<p align="center">
  <h1 align="center">Everyone Coding</h1>
  <p align="center"><strong>自然语言 → 可运行代码。没有编程语言，只有你的想法。</strong></p>
  <p align="center">

<img width="2560" height="1600" alt="53abad8fde3cc2cc2bb0007903816a8f" src="https://github.com/user-attachments/assets/3303d043-5d4f-4d16-8961-344915fe376d" />
<img width="2560" height="1600" alt="d2080d5c426e96df07aa089871f1e58a" src="https://github.com/user-attachments/assets/df0ca237-daae-483d-be8c-083821b7e7ee" />

  </p>
</p>

---

## 这是什么？

**Everyone Coding** 是一个 AI 编译器。你用自然语言（中文/英文）写一个 `.txt` 文件描述你想要的东西，它帮你编译成真正能跑的代码。

不需要学语法，不需要学框架。你只需要**精确地描述你要什么**。

| 输入（.txt） | 输出 |
| --- | --- |
| "做一个烘焙店网站，有导航栏、商品卡片、联系表单" | 完整的 HTML 网页 |
| "D13 的 LED 每隔 1 秒闪烁一次" | 可烧录的 Arduino .ino 代码 |

---

## 快速开始

```bash
# 1. 安装依赖
pip install openai

# 2. 编译
python3 compiler.py examples/web/hello.txt --open
```

首次运行会询问 DeepSeek API Key（在 [platform.deepseek.com](https://platform.deepseek.com) 获取），可选择保存，后续自动使用。

---

## 怎么工作

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  your_idea.txt  │ ──→ │  compiler.py │ ──→ │  output.html    │
│  (自然语言描述)  │     │  + DeepSeek  │     │  / output.ino   │
└─────────────────┘     └──────────────┘     └─────────────────┘
        ↑                                            │
        └──── 不满意？改 .txt 重新编译 ──────────────┘
```

编译器将你的输入 + 目标领域的 Skill 文件（包含领域知识和编译规则）一起发给 DeepSeek，AI 返回完整代码。

---

## Skill 系统

每个编译目标都是一个 **Skill 文件**（`skills/*.md`）。编译器是纯通用引擎——它扫描 `skills/` 目录发现可用目标，不加任何领域特定代码。

| 命令 | 作用 |
| --- | --- |
| `python3 compiler.py --list` | 列出所有 Skill |
| `python3 compiler.py --grammar` | 查看默认 Skill 的领域知识 |
| `python3 compiler.py 文件.txt --target arduino` | 用指定 Skill 编译 |

每次编译时，对应 Skill 文件的**整个正文**直接作为 AI 的 system prompt。

**加一个新目标只需要创建一个 Skill 文件。** 编译器代码零改动。

---

## 已支持的 Skill

### web — 网页制作

用直觉式的关键词描述网页元素。完整的语法参考见 [`skills/web.md`](skills/web.md)。

```txt
PAGE "我的主页"
COLOR background: #f5f5f5

TITLE "你好！"
TEXT "欢迎来到我用 AI 编译器创建的网页。"
BUTTON "点我试试" (bg:blue, color:white, round)
```

也支持完全自由的纯自然语言描述——参考 [`examples/web/bakery/bakery_cn.txt`](examples/web/bakery/bakery_cn.txt)，一份 494 行的中文描述被编译成了 1900 行的精美烘焙店网站。

### arduino — 嵌入式开发

纯自然语言描述硬件行为，无需学习 C++ 或 Arduino API。领域知识参考见 [`skills/arduino.md`](skills/arduino.md)。

```txt
让开发板上的 LED（D13）每隔 1 秒闪烁一次。亮 1 秒，灭 1 秒，一直循环。
```

覆盖：GPIO、模拟传感器、PWM、舵机、超声波测距、LCD 显示屏、继电器等。

```bash
python3 compiler.py examples/arduino/auto_watering.txt --target arduino
# → 生成自动浇花系统的完整 .ino 代码
```

---

## 添加新 Skill

创建一个 `skills/<name>.md` 文件：

```yaml
---
name: game
display: 2D 小游戏
ext: .html
open: true
---

You are an AI Game Compiler. Your task is to...

=== GAME ENGINE KNOWLEDGE ===
...
```

运行 `python3 compiler.py --list` 即可看到新目标。

---

## 项目结构

```
everyoneCoding/
├── compiler.py              # 通用编译器引擎
├── skills/                  # Skill 目录（加新领域只加这里）
│   ├── web.md
│   └── arduino.md
├── examples/                # 示例输入
│   ├── web/
│   │   ├── hello.txt
│   │   ├── landing.txt
│   │   ├── bakery.txt
│   │   └── bakery/          # 纯自然语言案例
│   └── arduino/
│       ├── blink.txt
│       ├── button_led.txt
│       └── auto_watering.txt
└── README.md
```

---

## 设计理念

1. **一行一个意图。** 每句话对应一个具体的输出，AI 不会在你看不到的地方添加或遗漏东西。

2. **语法是建议，不是规则。** 写得不精确也能工作——AI 会推断你的意思。

3. **迭代即编译。** 不满意就改 `.txt`，重新运行。不需要懂目标代码。

4. **Skill 即扩展。** 每个领域一个 Skill 文件。社区可以贡献新的 Skill，与编译器本体完全解耦。

---

## 要求

- Python 3.10+
- `pip install openai`
- [DeepSeek API Key](https://platform.deepseek.com)

---

<p align="center"><em>编程不应是少数人的特权。每个人都有一个值得被实现的想法。</em></p>
