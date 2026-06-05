# -*- coding: utf-8 -*-
"""
考研政治真题解析器
从 E:\reasonix 下的 txt 文件解析真题，生成 js 数据文件到 E:\hanako\408-brush\js\
"""

import os, re, json, sys

REASONIX = r'E:\reasonix'
OUTPUT_DIR = r'E:\hanako\408-brush\js'

def clean_text(s):
    s = s.replace('\u3000', ' ').replace('\u00A0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def extract_option_letter(opt_text):
    m = re.match(r'^([A-E])\s*[.．、]\s*(.*)', opt_text, re.DOTALL)
    if m:
        return m.group(1), m.group(2).strip()
    return None, opt_text.strip()

def get_topic(num, year):
    if 1 <= num <= 4 or 17 <= num <= 21 or num == 34:
        return 'po-1'
    elif (5 <= num <= 8) or (22 <= num <= 26) or num == 35:
        return 'po-2'
    elif (9 <= num <= 12) or (27 <= num <= 29) or num == 36:
        return 'po-3'
    elif (13 <= num <= 14) or (30 <= num <= 31) or num == 37:
        return 'po-4'
    elif (15 <= num <= 16) or (32 <= num <= 33) or num == 38:
        return 'po-5'
    return 'po-1'

# ============ 通用题目解析 ============

def parse_single_question(block, year, num):
    """解析单个题目块（含答案的格式）"""
    block = clean_text(block)
    block = re.sub(r'^\d{1,2}[.、．]\s*', '', block)
    
    ans_match = re.search(r'【答案】\s*([A-E]+)', block)
    answer = ans_match.group(1) if ans_match else ''
    
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
    if 1 <= num <= 16:
        qtype = 'single'
    elif 17 <= num <= 33:
        qtype = 'multi'
    else:
        qtype = 'essay'
    
    # 提取选项（支持 A. A．A、 和 A  格式）
    options = []
    if qtype in ('single', 'multi'):
        opt_pattern = r'([A-E])\s*[.．、]?\s*(.*?)(?=\s*[A-E]\s*[.．、]?\s|\s*【答案】|\s*【解析】|$)'
        opts = re.findall(opt_pattern, question_text, re.DOTALL)
        
        for letter, content in opts:
            content = clean_text(content)
            if content:
                options.append(f"{letter}. {content}")
        
        if options:
            first_opt = re.search(r'\s+[A-E]\s*[.．、]?\s', question_text)
            if first_opt:
                question_text = clean_text(question_text[:first_opt.start()])
    
    topic = get_topic(num, year)
    
    return {
        'id': f'pol-{year}-{num}',
        'year': year, 'subject': 'po', 'topic': topic, 'type': qtype,
        'question': question_text[:500],
        'options': options,
        'answer': answer,
        'analysis': analysis[:800] if analysis else ''
    }


def parse_answer_file(a_text):
    """解析答案文件，支持多种格式"""
    answers = {}
    
    # 格式1: "1.【答案】B【解析】..."
    pattern1 = r'(\d{1,2})[.、．]\s*【答案】\s*([A-E]+)\s*【解析】(.*?)(?=\s*\d{1,2}[.、．]\s*【答案】|\s*\d{1,2}[.、．]\s*【答案解析】|$)'
    for m in re.finditer(pattern1, a_text, re.DOTALL):
        num = int(m.group(1))
        if num not in answers:
            answers[num] = {'answer': m.group(2), 'analysis': clean_text(m.group(3))[:800]}
    
    # 格式2: "1.【答案解析】本题正确选项为 C 选项..."
    pattern2 = r'(\d{1,2})[.、．]\s*【答案解析】\s*本题正确选项为\s*([A-E]+)\s*选项(.*?)(?=\s*\d{1,2}[.、．]\s*【答案解析】|\s*\d{1,2}[.、．]\s*【答案】|$)'
    for m in re.finditer(pattern2, a_text, re.DOTALL):
        num = int(m.group(1))
        if num not in answers:
            answers[num] = {'answer': m.group(2), 'analysis': clean_text(m.group(3))[:800]}
    
    # 格式3: 紧凑型 "答案：1-5 CDDAC  6-10 ABBDA"
    if not answers:
        range_pattern = r'(\d{1,2})\s*-\s*(\d{1,2})\s+([A-E]+)'
        for m in re.finditer(range_pattern, a_text):
            start = int(m.group(1))
            end = int(m.group(2))
            letters = list(m.group(3))
            for i, letter in enumerate(letters):
                num = start + i
                if num <= end and num not in answers:
                    answers[num] = {'answer': letter, 'analysis': ''}
        # Also try: single answers like "1. C" or "1、C"
        if not answers:
            single_pattern = r'(\d{1,2})[.、．]\s*([A-E]+)\s'
            for m in re.finditer(single_pattern, a_text):
                num = int(m.group(1))
                if 1 <= num <= 50 and num not in answers:
                    answers[num] = {'answer': m.group(2), 'analysis': ''}
    
    # 格式4: "1.【答案】B" (无解析)
    if not answers:
        pattern4 = r'(\d{1,2})[.、．]\s*【答案】\s*([A-E]+)'
        for m in re.finditer(pattern4, a_text):
            num = int(m.group(1))
            if num not in answers:
                answers[num] = {'answer': m.group(2), 'analysis': ''}
    
    return answers


def split_questions_from_text(text):
    """从文本中按题号分割题目"""
    # 匹配 "1." "2、" 等格式，数字后跟分隔符且后面不紧跟数字
    # 前面不能是数字（避免 "20.5" 被匹配为5）
    question_starts = []
    for m in re.finditer(r'(\d{1,2})([.、．])', text):
        num = int(m.group(1))
        if not (1 <= num <= 50):
            continue
        start = m.start()
        delim_end = m.end()
        
        # 跳过前面是数字的情况（如 20.5）
        if start > 0 and text[start-1].isdigit():
            continue
        
        # 分隔符后不能紧跟数字（如 "1.5"）
        if delim_end < len(text) and text[delim_end].isdigit():
            continue
        
        # 分隔符后应该是中文或空格（排除英文单词开头）
        if delim_end < len(text) and text[delim_end] in '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.':
            continue
        
        question_starts.append((num, start))
    
    # 去重（保留第一个匹配位置）
    seen = {}
    unique = []
    for num, pos in question_starts:
        if num not in seen:
            seen[num] = pos
            unique.append((num, pos))
    return sorted(unique, key=lambda x: x[1])


def extract_year(text):
    m = re.search(r'(\d{4})年', text)
    return int(m.group(1)) if m else None


# ============ 各格式解析入口 ============

def parse_combined(filepath, force_year=None):
    """解析合体文件（2003-2016, 2022-2023, 2026）"""
    with open(filepath, 'r', encoding='utf-8') as f:
        text = clean_text(f.read())
    
    # Use forced year if provided, otherwise try to extract
    if force_year:
        year = force_year
    else:
        year = extract_year(text)
        if not year:
            bn = os.path.basename(filepath)
            ym = re.search(r'(\d{4})', bn)
            year = int(ym.group(1)) if ym else 0
    
    starts = split_questions_from_text(text)
    questions = []
    for i, (num, pos) in enumerate(starts):
        end = starts[i+1][1] if i+1 < len(starts) else len(text)
        block = text[pos:end].strip()
        if '小题' in block[:50] or '单项' in block[:80] or '多项' in block[:80]:
            continue
        q = parse_single_question(block, year, num)
        if q:
            questions.append(q)
    return questions


def parse_split(question_file, answer_file, year):
    """解析分离文件（2017-2021）"""
    with open(question_file, 'r', encoding='utf-8') as f:
        q_text = clean_text(f.read())
    
    answers = {}
    if answer_file and os.path.exists(answer_file):
        with open(answer_file, 'r', encoding='utf-8') as f:
            answers = parse_answer_file(clean_text(f.read()))
    
    starts = split_questions_from_text(q_text)
    questions = []
    for i, (num, pos) in enumerate(starts):
        end = starts[i+1][1] if i+1 < len(starts) else len(q_text)
        block = q_text[pos:end].strip()
        if '小题' in block[:50] or '单项' in block[:80] or '多项' in block[:80]:
            continue
        
        block = clean_text(block)
        block = re.sub(r'^\d{1,2}[.、．]\s*', '', block)
        
        if 1 <= num <= 16:
            qtype = 'single'
        elif 17 <= num <= 33:
            qtype = 'multi'
        else:
            qtype = 'essay'
        
        options = []
        question_text = block
        
        if qtype in ('single', 'multi'):
            opt_pattern = r'([A-E])\s*[.．、]?\s*(.*?)(?=\s*[A-E]\s*[.．、]?\s|$)'
            opts = re.findall(opt_pattern, block, re.DOTALL)
            for letter, content in opts:
                content = clean_text(content)
                if content:
                    options.append(f"{letter}. {content}")
            if options:
                first_opt = re.search(r'\s+[A-E]\s*[.．、]?\s', block)
                if first_opt:
                    question_text = clean_text(block[:first_opt.start()])
        
        topic = get_topic(num, year)
        ans = answers.get(num, {})
        
        questions.append({
            'id': f'pol-{year}-{num}',
            'year': year, 'subject': 'po', 'topic': topic, 'type': qtype,
            'question': question_text[:500],
            'options': options,
            'answer': ans.get('answer', ''),
            'analysis': ans.get('analysis', '')
        })
    
    return questions


def generate_js(questions, output_path):
    if not questions:
        return 0
    year = questions[0]['year']
    var_name = f'QUESTIONS_POLITICS_{year}'
    
    lines = ['// auto-generated from reasonix']
    lines.append(f'const {var_name} = [')
    for q in questions:
        q_esc = q['question'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
        a_esc = q['analysis'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
        opts = json.dumps(q['options'], ensure_ascii=False)
        lines.append(
            f"  {{ id:'{q['id']}', year:{q['year']}, subject:'{q['subject']}', "
            f"topic:'{q['topic']}', type:'{q['type']}', question:'{q_esc}', "
            f"options:{opts}, answer:'{q['answer']}', analysis:'{a_esc}' }},"
        )
    lines.append('];')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    return len(questions)


def find_txt(base, *keywords):
    """递归查找包含所有关键词的 txt 文件"""
    for root, dirs, files in os.walk(base):
        for f in files:
            if not f.endswith('.txt'):
                continue
            if all(k in f for k in keywords):
                return os.path.join(root, f)
    return None


def find_txt_exclude(base, include_kw, exclude_kw):
    """递归查找包含 include_kw 但不含 exclude_kw 的 txt 文件"""
    for root, dirs, files in os.walk(base):
        for f in files:
            if not f.endswith('.txt'):
                continue
            if include_kw in f and exclude_kw not in f:
                return os.path.join(root, f)
    return None


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    total = 0
    
    # === 2003-2016: 合体 ===
    combined_dir = os.path.join(REASONIX, '2003-2016真题及答案解析')
    print("=== 2003-2016 合体格式 ===")
    for year in range(2003, 2017):
        f = find_txt(combined_dir, f'{year}', '考研政治')
        if f:
            bn = os.path.basename(f)
            print(f'  {year}年: {bn} ...', end=' ')
            qs = parse_combined(f, force_year=year)
            cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-{year}.js'))
            total += cnt
            print(f'{cnt}题')
        else:
            print(f'  {year}年: 未找到文件')
    
    # === 2017-2021: 分离 ===
    split_dir = os.path.join(REASONIX, '2017-2021真题及答案解析')
    print("\n=== 2017-2021 分离格式 ===")
    for year in range(2017, 2022):
        # Special case for 2021: file uses "21" prefix
        if year == 2021:
            qf = find_txt(split_dir, '21考研政治')
            if qf:
                # This is a combined file with answers
                print(f'  {year}年: {os.path.basename(qf)} (合体) ...', end=' ')
                qs = parse_combined(qf, force_year=year)
                cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-{year}.js'))
                total += cnt
                print(f'{cnt}题')
            else:
                print(f'  {year}年: 未找到文件')
            continue
        
        qf = find_txt_exclude(split_dir, f'{year}', '答案')
        af = find_txt(split_dir, f'{year}', '答案')
        
        if qf:
            print(f'  {year}年: {os.path.basename(qf)}', end='')
            if af:
                print(f' + {os.path.basename(af)}', end='')
            print(' ...', end=' ')
            qs = parse_split(qf, af, year)
            cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-{year}.js'))
            total += cnt
            print(f'{cnt}题')
        else:
            print(f'  {year}年: 未找到文件')
    
    # === 2022-2023: 老杨 ===
    laoyang_dir = os.path.join(REASONIX, '2022-2023真题及答案解析')
    print("\n=== 2022-2023 老杨格式 ===")
    for year in [2022, 2023]:
        f = find_txt(laoyang_dir, f'{year}', '政治')
        if f:
            print(f'  {year}年: {os.path.basename(f)} ...', end=' ')
            qs = parse_combined(f, force_year=year)
            cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-{year}.js'))
            total += cnt
            print(f'{cnt}题')
        else:
            print(f'  {year}年: 未找到文件')
    
    # === 2024-2025: 合集文件 ===
    multi = os.path.join(REASONIX, '2021-2025年考研政治真题.txt')
    print("\n=== 2024-2025 从合集提取 ===")
    if os.path.exists(multi):
        with open(multi, 'r', encoding='utf-8') as f:
            full = f.read()
        
        # Find sections by "绝密★启用前XXXX年" markers, sorted by position in file
        year_markers = []
        for m in re.finditer(r'绝密★启用前(\d{4})年', full):
            year_markers.append((int(m.group(1)), m.start()))
        
        # Sort by position in file
        year_markers.sort(key=lambda x: x[1])
        
        # Build section map: {year: (start_pos, end_pos)}
        sections = {}
        for i, (y, pos) in enumerate(year_markers):
            end = year_markers[i+1][1] if i+1 < len(year_markers) else len(full)
            sections[y] = (pos, end)
        
        for y in [2024, 2025]:
            if y in sections:
                start, end = sections[y]
                section = clean_text(full[start:end])
                
                tmp = os.path.join(os.path.dirname(OUTPUT_DIR), f'_tmp_{y}.txt')
                with open(tmp, 'w', encoding='utf-8') as f:
                    f.write(section)
                
                print(f'  {y}年: 从合集提取 ({end-start} chars) ...', end=' ')
                qs = parse_combined(tmp, force_year=y)
                cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-{y}.js'))
                total += cnt
                print(f'{cnt}题')
                os.remove(tmp)
            else:
                print(f'  {y}年: 在合集中未找到')
    else:
        print('  合集文件不存在')
    
    # === 2026: 苏一 ===
    suyi = os.path.join(REASONIX, '2026考研政治真题及答案（苏一版）.txt')
    print("\n=== 2026 ===")
    if os.path.exists(suyi):
        print(f'  2026年: 苏一版 ...', end=' ')
        qs = parse_combined(suyi, force_year=2026)
        cnt = generate_js(qs, os.path.join(OUTPUT_DIR, f'data-politics-2026.js'))
        total += cnt
        print(f'{cnt}题')
    else:
        print('  2026年: 未找到')
    
    print(f'\n===== 总计生成 {total} 道政治真题 =====')
    return total


if __name__ == '__main__':
    main()
