<p align="center">
  <h1 align="center">Code for Everyone</h1>
  <p align="center"><strong>让每个人都能写代码，哪怕从未学过编程。</strong></p>
</p>

---

## 为什么会有这个项目？

编程的门槛太高了。

即使是最"简单"的 Python，普通人也要花几个月才能写出能用的东西。而 AI 辅助编程（vibe coding）又走向了另一个极端——AI 一次写出几百行代码，人完全跟不上，变成了旁观者，没法精准修改。

**但好消息是**：今天的 AI 非常擅长一件事——**把"意思明确但语法不严格"的表达，翻译成语法严格的代码**。

这就打开了一扇门：如果我们设计一套简单到三五分钟就能学会的"语法"，剩下的交给 AI 来"编译"，会怎样？

> 普通人不需要学编程语言。他们只需要学会**精准地描述自己要什么**。

---

## 怎么工作？

就像写一封简单的信，你用一个 `.txt` 文件描述你要的东西。然后运行"AI 编译器"，它就变成可以真正运行的代码。

```
你的 .txt 文件          AI 编译器           真正能跑的代码
(结构化自然语言)    →    (compiler.py)   →   (网页 / 将来支持更多)
      ↑                                         │
      └── 不满意？改 .txt，重新编译 ────────────┘
```

不需要学 HTML、CSS、JavaScript。只需要用一套直觉式的关键词描述你的想法。

---

## 快速开始（3 分钟）

### 第一步：获取 DeepSeek API Key

在 [platform.deepseek.com](https://platform.deepseek.com) 注册并获取 API Key。

### 第二步：写一个 .txt 文件

```txt
PAGE "我的主页"
COLOR background: #f5f5f5

TITLE "你好！"
TEXT "欢迎来到我用 AI 编译器创建的网页。"
BUTTON "点我试试" (bg:blue, color:white, round)
```

### 第三步：编译

```bash
cd web-compiler
python3 compiler.py 我的页面.txt --open
```

首次使用会询问你的 API Key（可选择保存，下次自动使用）。几秒钟后，浏览器自动打开你创建的网页。

---

## 语法一览

目前支持的关键词（完整语法见 [`web-compiler/grammer/grammer.md`](web-compiler/grammer/grammer.md)）：

| 分类 | 关键词 | 用途 |
|------|--------|------|
| 页面设置 | `PAGE`, `COLOR`, `FONT` | 设置标题、背景色、字体 |
| 基础元素 | `TITLE`, `TEXT`, `BUTTON`, `IMAGE`, `LINE`, `SPACE` | 标题、段落、按钮、图片、分割线、间距 |
| 样式修饰 | `(color:red, size:20px, bold, round)` | 用括号紧跟在元素后面，逗号分隔 |
| 布局容器 | `ROW:`, `COLUMN:`, `BOX:` | 用**缩进**表示嵌套关系 |
| 导航 | `NAV:`, `LOGO`, `NAVLINK` | 顶部导航栏 |
| 列表 | `LIST (bullet:dot):` | 无序/有序列表 |
| 卡片 | `CARDS (columns:3):`, `CARD:` | 商品卡片网格 |
| 表单 | `FORM:`, `INPUT` | 收集用户输入 |
| 对齐 | `ALIGN center` | 内容居中/左/右 |
| 注释 | `-- 这是注释` | 写给自己看，不生成代码 |

一个稍微复杂的例子：

```txt
PAGE "小明的烘焙店"
FONT 微软雅黑, 15px
COLOR background: #fff8f0

-- 导航
NAV (bg:#5a3e2b, color:white):
  LOGO bread.png
  NAVLINK "首页" link:index.html
  NAVLINK "菜单" link:menu.html

-- 商品卡片
SPACE 30px
CARDS (columns:3, gap:20px):
  CARD:
    IMAGE cake1.jpg
    TITLE "草莓蛋糕"
    TEXT "¥68" (bold, color:red)
  CARD:
    IMAGE bread1.jpg
    TITLE "法式长棍"
    TEXT "¥22" (bold, color:red)

SPACE 40px
ALIGN center
BUTTON "查看全部菜单" (bg:#5a3e2b, color:white, round) link:menu.html
```

上面这段会被 AI 编译器翻译成一个完整的、漂亮的网页，带导航栏、商品卡片和按钮。

---

## 目前支持什么？

| 目标领域 | 状态 |
|----------|------|
| 🌐 网页制作 | ✅ 已支持 |

后续计划扩展：

| 计划中 | 说明 |
|--------|------|
| 🎮 2D 互动/小游戏 | 用自然语言描述动画、碰撞、交互 |
| 📊 数据表格 | 筛选、排序、图表 |
| 🔧 自动化脚本 | 文件处理、定时任务 |

---

## 文件结构

```
everyoneCoding/
├── README.md                       # 本文件
└── web-compiler/
    ├── compiler.py                 # AI 编译器
    ├── grammer/
    │   └── grammer.md              # 语法定义（可独立修改扩充）
    └── examples/
        ├── hello.txt               # 入门：一个简单的页面
        ├── landing.txt             # 个人主页：BOX 布局 + 列表 + 按钮
        └── bakery.txt              # 完整案例：导航 + 卡片网格
```

---

## 核心设计理念

1. **每行 = 一个元素。** 你永远知道"这句话对应页面上哪个东西"。不会出现 AI 写了几百行你找不到问题在哪的情况。

2. **语法是"建议"不是"铁律"。** 写得不完全对，AI 也能猜出你的意思。`TITLE 你好` 和 `TITLE "你好"` 都能工作。

3. **不满意就改一句话。** 不需要懂 HTML/CSS，直接改 .txt 里的对应行，重新编译。

4. **语法可以自己演化。** `grammer.md` 是独立文件，你可以随时添加新关键词、新组件，不需要改编译器代码。

---

## 要求

- Python 3.10+
- `pip install openai`
- DeepSeek API Key

---

<p align="center"><em>编程不应该是少数人的特权。每个人都有一个想法值得被实现。</em></p>
