# -*- coding: utf-8 -*-
"""
软著源代码文档生成脚本
前后各30页，每页50行，共60页 / 3000行
生成 gen-source-doc.txt，复制到 Word 调成宋体五号，导出PDF即可
"""
import os

PROJECT_ROOT = r"E:\hanako\408-brush"
OUTPUT_FILE  = os.path.join(PROJECT_ROOT, "软著-源代码文档.txt")

SOFTWARE_NAME = "考研公共课刷题平台"
VERSION       = "V1.0"

# 核心文件列表（按重要性排序）
CORE_FILES = [
    "js/app.js",
    "js/storage.js",
    "js/search.js",
    "js/auth.js",
    "js/exam-mode.js",
    "js/subjects.js",
    "js/daily-challenge.js",
    "js/stats-dashboard.js",
    "js/study-plan.js",
    "js/kaoyan-guide.js",
    "js/kaoyan-planner.js",
    "js/bank-manager.js",
    "js/code-editor.js",
    "js/scratchpad.js",
    "js/share-card.js",
    "js/supabase.js",
    "css/style.css",
    "index.html",
    "sw.js",
    "manifest.json",
]

LINES_PER_PAGE = 50
FRONT_PAGES = 30
BACK_PAGES  = 30

# ---- 读取拼接 ----
all_lines = []
for f in CORE_FILES:
    full = os.path.join(PROJECT_ROOT, f)
    if os.path.exists(full):
        with open(full, "r", encoding="utf-8") as fh:
            lines = fh.read().splitlines()
        all_lines.append("// ====== 文件: {} ======".format(f))
        all_lines.extend(lines)
        all_lines.append("")

total = len(all_lines)
print("核心文件总行数:", total)

front_count = FRONT_PAGES * LINES_PER_PAGE  # 1500
back_count  = BACK_PAGES * LINES_PER_PAGE   # 1500

if total < front_count + back_count:
    front_count = min(total, total // 2)
    back_count = total - front_count

front_lines = all_lines[:front_count]
back_lines  = all_lines[-back_count:]

# ---- 生成带页眉的文档 ----
def page_header(page_num):
    return [
        "━" * 64,
        "  软件名称：{}    版本号：{}    第 {} 页".format(SOFTWARE_NAME, VERSION, page_num),
        "━" * 64,
        "",
    ]

out = []
page = 1

# 前30页
for i in range(0, len(front_lines), LINES_PER_PAGE):
    out.extend(page_header(page))
    chunk = front_lines[i:i + LINES_PER_PAGE]
    out.extend(chunk)
    out.append("")
    out.append("\f")  # 分页符
    page += 1

# 后30页
for i in range(0, len(back_lines), LINES_PER_PAGE):
    out.extend(page_header(page))
    chunk = back_lines[i:i + LINES_PER_PAGE]
    out.extend(chunk)
    out.append("")
    out.append("\f")
    page += 1

with open(OUTPUT_FILE, "w", encoding="utf-8") as fh:
    fh.write("\n".join(out))

print("OK  源代码文档已生成:", OUTPUT_FILE)
print("   前30页: {} 行 | 后30页: {} 行 | 共 {} 页".format(front_count, back_count, page - 1))
