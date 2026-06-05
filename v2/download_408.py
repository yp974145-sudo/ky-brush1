# -*- coding: utf-8 -*-
"""从 suhan42/cs-408 仓库下载 markdown 文件并提取 408 真题"""
import urllib.request
import urllib.parse
import json
import os
import re
import ssl
import base64

# 禁用 SSL 验证
ssl._create_default_https_context = ssl._create_unverified_context

OUTPUT_DIR = r'E:\hanako\408-brush\js'
DOWNLOAD_DIR = r'E:\hanako\suhan42_md'

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return json.loads(urllib.request.urlopen(req).read().decode())

def get_file_content(url):
    """获取文件内容（GitHub API 返回 base64）"""
    data = get_json(url)
    if 'content' in data:
        return base64.b64decode(data['content']).decode('utf-8')
    return None

def clean_text(s):
    s = s.replace('\u3000', ' ').replace('\u00A0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

TOPIC_MAP = {
    'ds': {
        '数据结构': 'ds-1', '线性表': 'ds-2', '栈': 'ds-3', '队列': 'ds-3',
        '串': 'ds-4', '矩阵': 'ds-3', '树': 'ds-5', '二叉树': 'ds-5',
        '哈夫曼': 'ds-5', '并查集': 'ds-5', '图': 'ds-6', '查找': 'ds-7',
        'B树': 'ds-7', '散列': 'ds-7', '排序': 'ds-8',
    },
    'co': {
        '计算机系统': 'co-1', '数据': 'co-2', 'IEEE': 'co-2', 'ALU': 'co-2',
        '存储': 'co-3', 'Cache': 'co-3', '主存': 'co-3', '虚存': 'co-3',
        '指令': 'co-4', '寻址': 'co-4', 'CPU': 'co-5', '中央处理器': 'co-5',
        '流水线': 'co-5', '总线': 'co-6', 'I/O': 'co-7', '输入输出': 'co-7',
        'DMA': 'co-7', '中断': 'co-7',
    },
    'os': {
        '操作系统': 'os-1', '进程': 'os-2', '线程': 'os-2', '调度': 'os-2',
        '同步': 'os-2', '死锁': 'os-2', '内存': 'os-3', '分页': 'os-3',
        '分段': 'os-3', '虚拟内存': 'os-3', '文件': 'os-4', '磁盘': 'os-4',
        'SPOOLing': 'os-5', '缓冲': 'os-5',
    },
    'cn': {
        '网络': 'cn-1', 'OSI': 'cn-1', 'TCP': 'cn-1', '物理层': 'cn-2',
        '奈奎斯特': 'cn-2', '香农': 'cn-2', '链路层': 'cn-3', 'MAC': 'cn-3',
        '交换机': 'cn-3', '网络层': 'cn-4', 'IP': 'cn-4', '路由': 'cn-4',
        '子网': 'cn-4', '传输层': 'cn-5', 'UDP': 'cn-5', '流量': 'cn-5',
        '拥塞': 'cn-5', '应用层': 'cn-6', 'DNS': 'cn-6', 'HTTP': 'cn-6',
    }
}

def guess_subject_and_topic(filepath, question_text):
    """从文件路径和题目文本推断科目和知识点"""
    filepath = filepath.lower()
    
    # 确定科目
    if '数据结构' in filepath or 'ds' in filepath:
        subj = 'ds'
    elif '计算机组成' in filepath or '计组' in filepath or 'co' in filepath:
        subj = 'co'
    elif '操作系统' in filepath or 'os' in filepath:
        subj = 'os'
    elif '计算机网络' in filepath or '计网' in filepath or 'cn' in filepath:
        subj = 'cn'
    else:
        subj = 'ds'
    
    # 确定知识点
    topic = subj + '-1'  # 默认
    for keyword, tp in TOPIC_MAP.get(subj, {}).items():
        if keyword in question_text or keyword in filepath:
            topic = tp
            break
    
    return subj, topic


def parse_questions_from_md(content, filepath):
    """从 markdown 内容中提取 408 真题"""
    questions = []
    
    # 匹配模式1: > 【YYYY年408真题】问题...  答案：X
    # 匹配模式2: > 【YYYY统考真题】问题...  答案：X
    # 匹配模式3: 直接 问题?  A.xxx B.xxx C.xxx D.xxx  答案：X
    
    # 先找所有带答案的题目块
    # 正则思路：找”答案：X“附近的内容
    answer_pattern = r'(?:答案|【答案】)[：:]\s*([A-D]+)'
    
    # 逐个找到答案位置，向前回溯找题目
    for m in re.finditer(answer_pattern, content):
        answer = m.group(1)
        ans_pos = m.start()
        
        # 向前找题目开始（最多向前500字符）
        search_start = max(0, ans_pos - 600)
        before = content[search_start:ans_pos]
        
        # 提取年份
        year_match = re.search(r'(\d{4})年.*?408|(\d{4})统考', before)
        if not year_match:
            year_match = re.search(r'【(\d{4})', before)
        year = int(year_match.group(1) or year_match.group(2)) if year_match else None
        
        if not year or year < 2009 or year > 2026:
            continue
        
        # 提取题目文本
        # 找题目起始标记: > 、数字.、或是选项前的文字
        q_start_patterns = [
            r'(?:>|》)\s*【?\d{4}年.*?(?:408)?(?:真题|统考)】?\s*(.*?)(?=[A-D]\s*[.、．])',
            r'(\d{1,2})[.、．]\s*(.*?)(?=[A-D]\s*[.、．]|答案)',
        ]
        
        question_text = ''
        question_num = 1
        
        for pattern in q_start_patterns:
            qm = re.search(pattern, before, re.DOTALL)
            if qm:
                question_text = clean_text(qm.group(1) if qm.lastindex == 1 else qm.group(2))
                if qm.lastindex and qm.group(1).isdigit():
                    question_num = int(qm.group(1))
                break
        
        if not question_text or len(question_text) < 10:
            continue
        
        # 提取选项
        options = []
        opt_pattern = r'([A-D])\s*[.、．]\s*(.*?)(?=\s*[A-D]\s*[.、．]\s|答案|$)'
        opts = re.findall(opt_pattern, before, re.DOTALL)
        for letter, content in opts:
            content = clean_text(content)
            if content and len(content) > 1:
                options.append(f"{letter}. {content[:80]}")
        
        # 确定题型
        qtype = 'single' if len(answer) == 1 else 'multi'
        
        # 科目和知识点
        subj, topic = guess_subject_and_topic(filepath, question_text)
        
        # 截断过长的题目
        question_text = question_text[:400]
        
        questions.append({
            'id': f'{year}-{subj}-{len(questions)+1}',
            'year': year, 'subject': subj, 'topic': topic, 'type': qtype,
            'question': question_text,
            'options': options,
            'answer': answer,
            'analysis': ''
        })
    
    return questions


def main():
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 获取文件树
    print('Fetching repo tree...')
    tree_url = 'https://api.github.com/repos/suhan42/cs-408/git/trees/main?recursive=1'
    tree_data = get_json(tree_url)
    
    md_files = []
    for item in tree_data['tree']:
        if item['path'].endswith('.md') and item['type'] == 'blob':
            md_files.append(item)
    
    print(f'Found {len(md_files)} markdown files')
    
    # 下载并解析每个文件
    all_questions = []
    for item in md_files:
        path = item['path']
        print(f'  Downloading: {path}...', end=' ')
        
        # 获取文件内容 - 需要 URL 编码中文路径
        encoded_path = urllib.parse.quote(path, safe='/')
        api_url = f'https://api.github.com/repos/suhan42/cs-408/contents/{encoded_path}'
        try:
            content = get_file_content(api_url)
        except Exception as e:
            print(f'FAILED: {e}')
            continue
        
        if not content:
            print('EMPTY')
            continue
        
        # 保存原始文件
        safe_name = path.replace('/', '_').replace('\\', '_')
        local_path = os.path.join(DOWNLOAD_DIR, safe_name)
        with open(local_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 解析题目
        qs = parse_questions_from_md(content, path)
        print(f'{len(qs)} questions')
        all_questions.extend(qs)
    
    print(f'\nTotal questions found: {len(all_questions)}')
    
    # 按年份分组并生成数据文件
    year_data = {}
    for q in all_questions:
        year = q['year']
        if year not in year_data:
            year_data[year] = []
        year_data[year].append(q)
    
    total = 0
    for year in sorted(year_data.keys()):
        qs = year_data[year]
        out_path = os.path.join(OUTPUT_DIR, f'data-408-{year}.js')
        var_name = f'QUESTIONS_408_{year}'
        
        lines = ['// from suhan42/cs-408']
        lines.append(f'const {var_name} = [')
        for q in qs:
            q_esc = q['question'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
            opts = json.dumps(q['options'], ensure_ascii=False)
            lines.append(
                f"  {{ id:'{q['id']}', year:{q['year']}, subject:'{q['subject']}', "
                f"topic:'{q['topic']}', type:'{q['type']}', question:'{q_esc}', "
                f"options:{opts}, answer:'{q['answer']}', analysis:'' }},"
            )
        lines.append('];')
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines) + '\n')
        total += len(qs)
        print(f'  {year}: {len(qs)} questions')
    
    print(f'\nDone! {total} questions in {len(year_data)} years')

if __name__ == '__main__':
    main()
