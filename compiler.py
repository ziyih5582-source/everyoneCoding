#!/usr/bin/env python3
"""
AI Compiler —— 用自然语言生成代码，通过 Skills 支持多目标

用法:
    python3 compiler.py 文件.txt                         # 默认目标 web
    python3 compiler.py 文件.txt --target arduino         # 编译为 Arduino .ino
    python3 compiler.py 文件.txt -o output.html --open    # 指定输出并在浏览器打开
    python3 compiler.py --grammar --target arduino        # 查看 arduino skill 参考
    python3 compiler.py --list                            # 列出所有可用目标

架构:
    compiler.py   → 纯通用引擎：扫描 skills/ 发现目标 → 加载 skill → 调用 AI
    skills/*.md   → 每个文件 = 元数据(前导) + 完整 system prompt
                    加新领域只需新增一个 skill 文件
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
DEEPSEEK_MODEL = "deepseek-v4-pro"
KEY_FILE = Path.home() / ".everyone-coding-key"
SKILLS_DIR = Path(__file__).parent / "skills"


# ═══════════════════════════════════════════════════════════
# Skill 系统
# ═══════════════════════════════════════════════════════════

def parse_skill(filepath: Path):
    """
    解析 skill 文件（YAML 前导元数据 + Markdown 正文）。
    返回 (metadata: dict, body: str)。
    
    Skill 文件格式：
    ---
    name: arduino
    display: Arduino / 嵌入式
    ext: .ino
    open: false
    ---
    <完整的 system prompt 正文>
    """
    text = filepath.read_text(encoding="utf-8")
    metadata = {}
    body = text

    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            for line in parts[1].strip().split("\n"):
                line = line.strip()
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip()
                    val = val.strip()
                    if val == "true":
                        val = True
                    elif val == "false":
                        val = False
                    metadata[key] = val
            body = parts[2].strip()

    return metadata, body


def scan_skills() -> dict:
    """
    扫描 skills/ 目录，返回 {target_name: {name, display, ext, open, path}}。
    如果没有任何 skill 文件，退出报错。
    """
    if not SKILLS_DIR.exists():
        sys.exit(f"❌ skills 目录不存在: {SKILLS_DIR}")

    targets = {}
    for f in sorted(SKILLS_DIR.glob("*.md")):
        metadata, _ = parse_skill(f)
        name = metadata.get("name", f.stem)
        if name in targets:
            print(f"⚠️  重复的 skill name '{name}'，后者覆盖前者")
        targets[name] = {
            "name": name,
            "display": metadata.get("display", name),
            "ext": metadata.get("ext", ""),
            "open": metadata.get("open", False),
            "path": str(f),
        }

    if not targets:
        sys.exit(f"❌ skills/ 目录中没有找到任何 .md 文件")

    return targets


def load_skill(target: str) -> tuple:
    """
    加载指定 skill，返回 (metadata: dict, system_prompt: str)。
    target 不存在时退出报错。
    """
    targets = scan_skills()
    if target not in targets:
        names = ", ".join(targets.keys())
        sys.exit(f"❌ 未知目标 '{target}'。可用目标: {names}")

    meta = targets[target]
    _, body = parse_skill(Path(meta["path"]))
    return meta, body


# ═══════════════════════════════════════════════════════════
# API Key 管理
# ═══════════════════════════════════════════════════════════

def get_api_key() -> str:
    """
    获取 DeepSeek API Key：
    1. 先尝试读取缓存文件
    2. 没有缓存则交互式询问
    3. 询问是否保存
    """
    if KEY_FILE.exists():
        try:
            data = json.loads(KEY_FILE.read_text())
            cached = data.get("key", "").strip()
            if cached:
                print(f"🔑 使用已保存的 API Key（{KEY_FILE}）")
                return cached
        except (json.JSONDecodeError, KeyError):
            pass

    print()
    print("🔑 请输入你的 DeepSeek API Key")
    print("   （在 https://platform.deepseek.com 获取）")
    print()
    key = input("   API Key: ").strip()

    if not key:
        sys.exit("❌ 未输入 API Key，退出。")

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

def call_deepseek(system_prompt: str, user_input: str, api_key: str, target: str) -> str:
    """调用 DeepSeek API"""
    try:
        from openai import OpenAI
    except ImportError:
        sys.exit("❌ 请先安装 openai 库：pip install openai")

    client = OpenAI(api_key=api_key, base_url=DEEPSEEK_BASE_URL)
    print(f"🔧 正在编译... (目标: {target}, 模型: {DEEPSEEK_MODEL})")

    response = client.chat.completions.create(
        model=DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input},
        ],
        temperature=0.1,
    )

    raw = response.choices[0].message.content.strip()
    return extract_code(raw)


def extract_code(raw: str) -> str:
    """从 LLM 返回中提取纯代码（去掉可能的 markdown 包裹）"""
    # 尝试所有常见的代码块标记
    markers = [
        "```cpp", "```c++", "```c", "```ino", "```arduino",
        "```html", "```HTML", "```"
    ]
    for marker in markers:
        if marker in raw:
            parts = raw.split(marker, 1)[1]
            closing = parts.rfind("```")
            if closing != -1:
                code = parts[:closing].strip()
            else:
                code = parts.strip()
            # 验证提取的内容有意义
            if len(code) > 20:
                return code

    return raw


def compile_to_code(txt_path: str, api_key: str, target: str) -> str:
    """
    主编译流程：
    1. 加载 skill（元数据 + system prompt）
    2. 读取用户 .txt
    3. 调用 DeepSeek
    4. 返回代码
    """
    meta, system_prompt = load_skill(target)
    user_input = Path(txt_path).read_text(encoding="utf-8").strip()

    if not user_input:
        raise ValueError(f"文件 '{txt_path}' 是空的。请写入至少一条描述。")

    return call_deepseek(system_prompt, user_input, api_key, target)


# ═══════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════

def show_grammar(target: str):
    """打印指定 skill 的参考内容"""
    _, body = load_skill(target)
    print(body)


def list_targets():
    """列出所有可用目标"""
    targets = scan_skills()
    print("可用目标：")
    for name, meta in targets.items():
        print(f"  {name:<12} → {meta['display']:<16} (输出: *{meta['ext']})")
    print(f"\n共 {len(targets)} 个 skill")


def main():
    # 预先扫描一次，获取可用目标列表和默认值
    all_targets = scan_skills()
    target_names = list(all_targets.keys())
    default_target = "web" if "web" in target_names else target_names[0]

    parser = argparse.ArgumentParser(
        description="AI Compiler —— 用自然语言生成代码，通过 Skills 支持多目标"
    )
    parser.add_argument(
        "input", nargs="?",
        help="输入的 .txt 文件路径"
    )
    parser.add_argument(
        "-o", "--output",
        help="输出文件路径（默认与输入同名，扩展名由目标决定）"
    )
    parser.add_argument(
        "--target", choices=target_names, default=default_target,
        help=f"编译目标（默认: {default_target}）"
    )
    parser.add_argument(
        "--open", action="store_true",
        help="编译完成后在浏览器中打开（仅支持 open: true 的目标）"
    )
    parser.add_argument(
        "--grammar", action="store_true",
        help="查看指定目标的 skill 参考内容"
    )
    parser.add_argument(
        "--list", action="store_true",
        help="列出所有可用目标"
    )
    args = parser.parse_args()

    # --list
    if args.list:
        list_targets()
        return

    # --grammar 或无输入文件
    if args.grammar or args.input is None:
        show_grammar(args.target)
        return

    # 检查输入文件
    if not Path(args.input).exists():
        sys.exit(f"❌ 文件不存在: {args.input}")

    # 获取 API Key
    api_key = get_api_key()

    # 确定输出路径
    meta, _ = load_skill(args.target)
    ext = meta["ext"]
    output_path = args.output or str(Path(args.input).with_suffix(ext))

    # 编译
    try:
        code = compile_to_code(args.input, api_key, args.target)
    except Exception as e:
        sys.exit(f"❌ 编译失败: {e}")

    # 写入
    Path(output_path).write_text(code, encoding="utf-8")
    print(f"✅ 编译成功 → {output_path}")
    print(f"   {len(code)} 字符")

    # 浏览器打开
    if args.open:
        if meta["open"]:
            abs_path = Path(output_path).resolve()
            webbrowser.open(f"file://{abs_path}")
            print(f"🌐 已在浏览器中打开")
        else:
            print(f"⚠️  --open 对此目标无效（该 skill 未启用 open）")


if __name__ == "__main__":
    main()
