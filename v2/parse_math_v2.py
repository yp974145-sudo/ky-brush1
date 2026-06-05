# -*- coding: utf-8 -*-
"""
数学真题解析器 v2 - 全面重写
策略：
1. 收集所有数学 txt 文件，按学科(ma1/ma2/ma3)和年份分类
2. 对每个文件：检测是单年份还是多年份合集
3. 多年份合集：按"XXXX年"标题分割
4. 提取题目：选择题(1-10)、填空题(11-16)、解答题(17-22)
5. 提取答案：【答案】X 格式
6. 生成 data-math-YYYY.js（按年份合并三学科）
"""
import os, re, json
from collections import defaultdict

REASONIX = r'E:\reasonix'
OUTPUT_DIR = r'E:\hanako\408-brush\js'

# 学科目录映射
MATH_DIRS = {
    'ma1': r'考研数学 (一) 真题及答案解析（1987-2026）',
    'ma2': r'考研数学 (二) 真题及答案解析（1987-2026）',
    'ma3': r'考研数学 (三) 真题及答案解析（1987-2026）',
}

def clean_text(s):
    s = s.replace('\u3000', ' ').replace('\u00A0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def get_topic(num):
    if num <= 2: return 'ma-1'
    if num <= 4: return 'ma-2'
    if num == 5: return 'ma-3'
    if 6 <= num <= 8: return 'ma-8'
    if 9 <= num <= 10: return 'ma-9'
    if 11 <= num <= 15: return 'ma-4'
    if num == 16: return 'ma-9'
    if 17 <= num <= 19: return 'ma-2'
    if num == 20: return 'ma-6'
    if 21 <= num <= 22: return 'ma-8'
    return 'ma-8'

# ========== 文件发现 ==========

def find_all_math_files():
    """发现所有数学文件，返回 [(subject_code, year, path, is_multi_year)]"""
    results = []
    
    for subj_code, dir_name in MATH_DIRS.items():
        base_dir = os.path.join(REASONIX, dir_name)
        if not os.path.exists(base_dir):
            continue
        
        for root, dirs, files in os.walk(base_dir):
            for fname in files:
                if not fname.endswith('.txt'):
                    continue
                # 跳过纯解析参考书
                if '真题da全解' in fname:
                    continue
                
                path = os.path.join(root, fname)
                results.append((subj_code, path))
    
    return results


def extract_years_from_filename(fname):
    """从文件名提取年份范围"""
    # 匹配 1987, 1987-2016, 1998-2007 等
    years = []
    for m in re.finditer(r'(19|20)(\d{2})', fname):
        years.append(int(m.group()))
    
    if not years:
        return []
    
    # 如果是范围如 1987-2016，返回首尾
    range_match = re.search(r'(\d{4})\s*[-~～]\s*(\d{4})', fname)
    if range_match:
        return [int(range_match.group(1)), int(range_match.group(2))]
    
    return years


def split_by_year_sections(text):
    """按'XXXX年'标题分割文本为 {year: section_text}"""
    sections = {}
    
    # 找年份边界
    year_positions = []
    for m in re.finditer(r'(19\d{2}|20[0-2]\d)年', text):
        year = int(m.group(1))
        if 1987 <= year <= 2026:
            # 检查前面是否有合理上下文
            before = text[max(0, m.start()-30):m.start()]
            # 如果前面是"数学"或"研究生"等，可能是章节标题
            year_positions.append((year, m.start()))
    
    if not year_positions:
        return sections
    
    # 去重相邻同年的
    merged = []
    for y, pos in year_positions:
        if merged and merged[-1][0] == y and pos - merged[-1][1] < 100:
            continue
        merged.append((y, pos))
    
    for i, (year, pos) in enumerate(merged):
        end = merged[i+1][1] if i+1 < len(merged) else len(text)
        section = clean_text(text[pos:end])
        if len(section) > 100:  # 有效章节
            if year not in sections:
                sections[year] = section
            elif len(section) > len(sections[year]):
                sections[year] = section
    
    return sections


# ========== 题目解析 ==========

def split_questions(text):
    """从文本分割出各题"""
    starts = []
    for m in re.finditer(r'(?:^|(?<=\s))(\d{1,2})\s*[.、．]\s+', text):
        num = int(m.group(1))
        if 1 <= num <= 22:
            start = m.start()
            # 跳过前面是数字的情况
            if start > 0 and text[start-1].isdigit():
                continue
            starts.append((num, start))
    
    seen = {}
    unique = []
    for num, pos in starts:
        if num not in seen:
            seen[num] = pos
            unique.append((num, pos))
    return sorted(unique, key=lambda x: x[1])


def parse_question(block, year, num, subject_code):
    """解析单个数学题"""
    block = clean_text(block)
    block = re.sub(r'^\d{1,2}[.、．]\s+', '', block)
    
    # 答案
    ans_match = re.search(r'【答案】\s*([^\s【]+)', block)
    answer = ans_match.group(1).strip().rstrip('.。') if ans_match else ''
    
    # 解析
    analysis = ''
    jx_match = re.search(r'【解析】(.*?)$', block, re.DOTALL)
    if jx_match:
        analysis = clean_text(jx_match.group(1))
    
    question_text = block
    if ans_match:
        question_text = block[:ans_match.start()]
    elif jx_match:
        question_text = block[:jx_match.start()]
    question_text = clean_text(question_text)
    
    # 题型
    if 1 <= num <= 10:
        qtype = 'single'
    elif 11 <= num <= 16:
        qtype = 'fill'
    else:
        qtype = 'essay'
    
    # 选项
    options = []
    if qtype == 'single':
        opt_pattern = r'([A-D])\s*[.．、]?\s*(.*?)(?=\s*[A-D]\s*[.．、]?\s*|【答案】|【解析】|$)'
        opts = re.findall(opt_pattern, question_text, re.DOTALL)
        for letter, content in opts:
            content = clean_text(content)
            if content and len(content) > 2:
                options.append(f"{letter}. {content[:80]}")
        if options:
            first_opt = re.search(r'\s+[A-D]\s*[.．、]?\s', question_text)
            if first_opt:
                question_text = clean_text(question_text[:first_opt.start()])
    
    topic = get_topic(num)
    subj_id = subject_code.replace('ma', 'math')
    
    return {
        'id': f'{subj_id}-{year}-{num}',
        'year': year, 'subject': subject_code, 'topic': topic, 'type': qtype,
        'question': question_text[:350],
        'options': options,
        'answer': answer[:60],
        'analysis': analysis[:500] if analysis else ''
    }


def parse_math_text(text, year, subject_code):
    """解析一段数学文本，提取题目"""
    text = clean_text(text)
    
    # 先尝试按题号分割
    starts = split_questions(text)
    
    # 如果题目太少，尝试更宽松的匹配
    if len(starts) < 5:
        starts = []
        for m in re.finditer(r'(\d{1,2})\s*[.、．]', text):
            num = int(m.group(1))
            if 1 <= num <= 22:
                start = m.start()
                if start > 0 and text[start-1].isdigit():
                    continue
                starts.append((num, start))
        seen = {}
        unique = []
        for num, pos in starts:
            if num not in seen:
                seen[num] = pos
                unique.append((num, pos))
        starts = sorted(unique, key=lambda x: x[1])
    
    questions = []
    for i, (num, pos) in enumerate(starts):
        end = starts[i+1][1] if i+1 < len(starts) else len(text)
        block = text[pos:end].strip()
        
        # 跳过选择题/填空题/解答题标题
        if any(kw in block[:20] for kw in ['选择题', '填空题', '解答题', '小题']):
            continue
        
        q = parse_question(block, year, num, subject_code)
        if q and q['question']:
            questions.append(q)
    
    return questions


# ========== 生成输出 ==========

def write_math_js(questions, output_path):
    if not questions:
        return 0
    year = questions[0]['year']
    var_name = f'QUESTIONS_MATH_{year}'
    
    lines = ['// auto-generated v2']
    lines.append(f'const {var_name} = [')
    for q in questions:
        q_esc = q['question'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
        a_esc = q['analysis'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
        ans_esc = q['answer'].replace('\\', '\\\\').replace("'", "\\'")
        opts = json.dumps(q['options'], ensure_ascii=False)
        lines.append(
            f"  {{ id:'{q['id']}', year:{q['year']}, subject:'{q['subject']}', "
            f"topic:'{q['topic']}', type:'{q['type']}', question:'{q_esc}', "
            f"options:{opts}, answer:'{ans_esc}', analysis:'{a_esc}' }},"
        )
    lines.append('];')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    return len(questions)


# ========== 主流程 ==========

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    all_files = find_all_math_files()
    print(f'Found {len(all_files)} math txt files')
    
    # 收集所有题目: {year: [questions]}
    year_data = defaultdict(list)
    
    for subj_code, path in all_files:
        fname = os.path.basename(path)
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
        except:
            continue
        
        if len(text) < 500:
            continue
        
        text_clean = clean_text(text)
        
        # 检测是多年份合集还是单年份
        year_sections = split_by_year_sections(text_clean)
        
        if year_sections:
            # 多年份合集
            for year, section in year_sections.items():
                qs = parse_math_text(section, year, subj_code)
                if qs:
                    year_data[year].extend(qs)
        else:
            # 单年份文件，从文件名推断年份
            fn_years = extract_years_from_filename(fname)
            if not fn_years:
                continue
            
            # 取第一个4位数作为年份
            year = fn_years[0] if fn_years[0] >= 1987 else fn_years[-1]
            if year < 1987 or year > 2026:
                continue
            
            qs = parse_math_text(text_clean, year, subj_code)
            if qs:
                year_data[year].extend(qs)
    
    # 写入文件
    print(f'\nYears with data: {len(year_data)}')
    total = 0
    for year in sorted(year_data.keys()):
        qs = year_data[year]
        out_path = os.path.join(OUTPUT_DIR, f'data-math-{year}.js')
        cnt = write_math_js(qs, out_path)
        total += cnt
        has_ans = len([q for q in qs if q['answer'].strip()])
        subjects = set(q['subject'] for q in qs)
        print(f'  {year}: {cnt}q ({has_ans} ans) subjects={subjects}')
    
    print(f'\nTotal: {total} math questions')
    return total

if __name__ == '__main__':
    main()
