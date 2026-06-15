#!/usr/bin/env python3
"""
AI Web Compiler v2 —— 用自定义语法编写网页

用法:
    python compiler.py 页面.txt               # 编译，输出 页面.html
    python compiler.py 页面.txt -o out.html   # 指定输出文件名
    python compiler.py 页面.txt --open        # 编译后在浏览器中打开
    python compiler.py --grammar              # 查看完整语法参考

工作流程:
    1. 在 .txt 文件中用自定义语法描述网页
    2. 运行编译器 → 输入 DeepSeek API Key
    3. AI 将你的描述编译为完整 HTML
    4. 不满意就改 .txt，重新编译
"""

import sys
import os
import json
import argparse
import webbrowser
from pathlib import Path

# ═══════════════════════════════════════════════════════════
# 常量
# ═══════════════════════════════════════════════════════════

DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
DEEPSEEK_MODEL = "deepseek-chat"
KEY_FILE = Path.home() / ".web-compiler-key"
GRAMMAR_FILE = Path(__file__).parent / "grammer" / "grammer.md"

# ═══════════════════════════════════════════════════════════
# 语法加载
# ═══════════════════════════════════════════════════════════

def load_grammar() -> str:
    """读取语法参考文件"""
    if not GRAMMAR_FILE.exists():
        sys.exit(f"❌ 语法文件不存在: {GRAMMAR_FILE}")
    return GRAMMAR_FILE.read_text(encoding="utf-8")


# ═══════════════════════════════════════════════════════════
# API Key 管理
# ═══════════════════════════════════════════════════════════

def get_api_key() -> str:
    """
    获取 DeepSeek API Key：
    1. 先尝试读取缓存文件 ~/.web-compiler-key
    2. 没有缓存则交互式询问
    3. 询问是否保存
    """
    # 尝试读取缓存
    if KEY_FILE.exists():
        try:
            data = json.loads(KEY_FILE.read_text())
            cached = data.get("key", "").strip()
            if cached:
                print(f"🔑 使用已保存的 API Key（{KEY_FILE}）")
                return cached
        except (json.JSONDecodeError, KeyError):
            pass  # 缓存损坏，继续询问

    # 交互式输入
    print()
    print("🔑 请输入你的 DeepSeek API Key")
    print("   （在 https://platform.deepseek.com 获取）")
    print()
    key = input("   API Key: ").strip()

    if not key:
        sys.exit("❌ 未输入 API Key，退出。")

    # 询问是否保存
    save = input("   💾 保存以便下次使用？(y/n): ").strip().lower()
    if save == "y":
        KEY_FILE.write_text(json.dumps({"key": key}))
        KEY_FILE.chmod(0o600)
        print(f"   ✅ 已保存到 {KEY_FILE}")
    print()

    return key


# ═══════════════════════════════════════════════════════════
# AI 编译
# ═══════════════════════════════════════════════════════════

def build_system_prompt(grammar: str) -> str:
    """构建系统提示词（语法参考 + 规则）"""
    return f"""You are an AI Web Compiler. Your sole task is to convert user input into a complete, beautiful HTML webpage according to the grammar defined below.

=== GRAMMAR REFERENCE ===

{grammar}

=== COMPILATION RULES ===

1. Generate a COMPLETE, self-contained HTML file. All CSS must be inline or embedded in <style>. No external dependencies.
2. Output ONLY the HTML code. Start with <!DOCTYPE html>. Do not wrap in markdown code blocks.
3. Follow the grammar precisely: every instruction maps to specific HTML/CSS.
4. Default design: modern, clean, comfortable spacing, responsive for mobile.
5. For Chinese content, use system Chinese fonts (PingFang SC, Microsoft YaHei, etc.).
6. Lines starting with -- are comments → skip them.
7. The example at the end of the grammar is for reference only → compile the actual user input below.
8. If an instruction is ambiguous, use your best judgment. Err on the side of simplicity.
9. Every element the user writes MUST appear in the output. Do not skip anything."""


def call_deepseek(system_prompt: str, user_input: str, api_key: str) -> str:
    """调用 DeepSeek API"""
    try:
        from openai import OpenAI
    except ImportError:
        sys.exit("❌ 请先安装 openai 库：pip install openai")

    client = OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)

    print(f"🔧 正在编译... (DeepSeek: {DEEPSEEK_MODEL})")

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
        temperature=0.1,  # 极低温度 → 稳定、可复现
    )

    raw = response.choices[0].message.content.strip()
    return extract_html(raw)


def extract_html(raw: str) -> str:
    """从 LLM 返回中提取纯 HTML（去掉可能的 markdown 包裹）"""
    for marker in ("```html", "```HTML", "```"):
        if marker in raw:
            parts = raw.split(marker, 1)[1]
            closing = parts.rfind("```")
            if closing != -1:
                html = parts[:closing].strip()
            else:
                html = parts.strip()
            if html.startswith("<!DOCTYPE") or html.startswith("<html"):
                return html

    return raw


def compile_to_html(txt_path: str, api_key: str) -> str:
    """
    主编译流程：
    1. 加载语法文件
    2. 读取用户 .txt
    3. 构建提示词
    4. 调用 DeepSeek
    5. 返回 HTML
    """
    grammar = load_grammar()
    user_input = Path(txt_path).read_text(encoding="utf-8").strip()

    if not user_input:
        raise ValueError(f"文件 '{txt_path}' 是空的。请写入至少一条指令。")

    system_prompt = build_system_prompt(grammar)
    return call_deepseek(system_prompt, user_input, api_key)


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def show_grammar():
    """打印语法参考"""
    print(load_grammar())


def main():
    parser = argparse.ArgumentParser(
        description="AI Web Compiler v2 —— 用自定义语法编写网页"
    )
    parser.add_argument(
        "input", nargs="?",
        help="输入的 .txt 文件路径"
    )
    parser.add_argument(
        "-o", "--output",
        help="输出的 .html 文件路径（默认与输入同名）"
    )
    parser.add_argument(
        "--open", action="store_true",
        help="编译完成后在浏览器中打开"
    )
    parser.add_argument(
        "--grammar", action="store_true",
        help="查看完整语法参考"
    )
    args = parser.parse_args()

    # 显示语法
    if args.grammar or args.input is None:
        show_grammar()
        return

    # 检查输入文件
    if not Path(args.input).exists():
        sys.exit(f"❌ 文件不存在: {args.input}")

    # 获取 API Key
    api_key = get_api_key()

    # 确定输出路径
    output_path = args.output or str(Path(args.input).with_suffix(".html"))

    # 编译
    try:
        html = compile_to_html(args.input, api_key)
    except Exception as e:
        sys.exit(f"❌ 编译失败: {e}")

    # 写入
    Path(output_path).write_text(html, encoding="utf-8")
    print(f"✅ 编译成功 → {output_path}")
    print(f"   {len(html)} 字符")

    # 浏览器打开
    if args.open:
        abs_path = Path(output_path).resolve()
        webbrowser.open(f"file://{abs_path}")
        print(f"🌐 已在浏览器中打开")


if __name__ == "__main__":
    main()
