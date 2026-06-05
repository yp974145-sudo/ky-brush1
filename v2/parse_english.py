# -*- coding: utf-8 -*-
"""
考研英语真题解析器
从 E:\reasonix 解析英语一/二真题，生成 data-english1/2-YYYY.js
英语格式特殊：提取答案速查表，生成选择题骨架
"""

import os, re, json

REASONIX = r'E:\reasonix'
OUTPUT_DIR = r'E:\hanako\408-brush\js'

EN_DIRS = {
    'english1': r'英语一真题及解析（1986-2025）',
    'english2': r'英语二真题及解析（1986-2025）',
}

def clean_text(s):
    s = s.replace('\u3000', ' ').replace('\u00A0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def parse_answer_table(text):
    """从文本中提取答案速查表，返回 {题号: 'A'/'B'/'C'/'D'}"""
    answers = {}
    
    # 格式1: "1~5 BCBCB  6~10 ADAAD"
    # 格式2: "1-5 BCBCB, 6-10 ADAAD"
    # 格式3: "1. B  2. C  3. D"
    
    # Try range format first
    range_pattern = r'(\d{1,2})\s*[~～\-]\s*(\d{1,2})\s+([A-D]{2,})'
    for m in re.finditer(range_pattern, text):
        start = int(m.group(1))
        end = int(m.group(2))
        letters = m.group(3)
        if end - start + 1 == len(letters):
            for i, letter in enumerate(letters):
                answers[start + i] = letter
    
    # Try individual format: "1. B" or "1、B"
    if not answers:
        for m in re.finditer(r'(\d{1,2})\s*[.、．]\s*([A-D])\b', text):
            num = int(m.group(1))
            if 1 <= num <= 50 and num not in answers:
                answers[num] = m.group(2)
    
    # Try inline format: "1. [A] 2. [B]" 
    if not answers:
        for m in re.finditer(r'(\d{1,2})\s*[.、．]\s*[\[\(（]?\s*([A-D])\s*[\]\)）]?', text):
            num = int(m.group(1))
            if 1 <= num <= 50 and num not in answers:
                answers[num] = m.group(2)
    
    # Try "答案速查" section
    if not answers:
        # Find the answer section
        ans_section = None
        for marker in ['答案速查', '参考答案', '答案与解析', '答案快速查询']:
            idx = text.find(marker)
            if idx > 0:
                ans_section = text[idx:idx+1000]
                break
        
        if ans_section:
            # Try to find letter sequences
            letter_blocks = re.findall(r'([A-D]{3,})', ans_section)
            if letter_blocks:
                # Assume the first big block is the answer sequence
                letters = letter_blocks[0] if len(letter_blocks[0]) > len(''.join(letter_blocks[1:])) else ''.join(letter_blocks)
                for i, l in enumerate(letters):
                    if i < 50:
                        answers[i+1] = l
    
    return answers


def get_topic(num):
    if 1 <= num <= 20:
        return 'en-1'  # 完形填空
    elif 21 <= num <= 40:
        return 'en-2'  # 阅读理解
    elif 41 <= num <= 45:
        return 'en-3'  # 新题型
    elif 46 <= num <= 50:
        return 'en-4'  # 翻译
    return 'en-2'


def generate_english_questions(year, subject_code, answers):
    """根据答案生成题目骨架"""
    questions = []
    subject_label = '英语一' if subject_code == 'english1' else '英语二'
    
    # 为每个有答案的题号生成题目
    section_names = {
        (1, 20): 'Section I: Use of English (完形填空)',
        (21, 40): 'Section II: Reading Comprehension (阅读理解)',
        (41, 45): 'Section III: Part B (新题型)',
    }
    
    for num in sorted(answers.keys()):
        letter = answers[num]
        
        # 确定题型和段落
        section_name = ''
        for (start, end), name in section_names.items():
            if start <= num <= end:
                section_name = name
                break
        
        question_text = f'{year}年{subject_label} 第{num}题'
        if section_name:
            question_text += f' [{section_name}]'
        
        qtype = 'single'  # 英语选择题
        
        # 选项固定为 ABCD
        options = ['A. ...', 'B. ...', 'C. ...', 'D. ...']
        
        topic = get_topic(num)
        
        questions.append({
            'id': f'en-{year}-{num}',
            'year': year, 'subject': subject_code, 'topic': topic, 'type': qtype,
            'question': question_text,
            'options': options,
            'answer': letter,
            'analysis': ''
        })
    
    return questions


def write_english_js(questions, year, subject_code):
    """写入英语数据文件"""
    if not questions:
        return 0
    
    subj_upper = subject_code.upper()
    var_name = f'QUESTIONS_{subj_upper}_{year}'
    
    lines = ['// auto-generated from reasonix (english)']
    lines.append(f'const {var_name} = [')
    for q in questions:
        q_esc = q['question'].replace('\\', '\\\\').replace("'", "\\'")
        opts = json.dumps(q['options'], ensure_ascii=False)
        lines.append(
            f"  {{ id:'{q['id']}', year:{q['year']}, subject:'{q['subject']}', "
            f"topic:'{q['topic']}', type:'{q['type']}', question:'{q_esc}', "
            f"options:{opts}, answer:'{q['answer']}', analysis:'' }},"
        )
    lines.append('];')
    
    out_path = os.path.join(OUTPUT_DIR, f'data-{subject_code}-{year}.js')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    return len(questions)


def find_all_en_files():
    """查找所有英语文件，返回 {subject_code: [(year, path, has_answers)]}"""
    result = {'english1': [], 'english2': []}
    
    for subj_code, dir_name in EN_DIRS.items():
        base_dir = os.path.join(REASONIX, dir_name)
        if not os.path.exists(base_dir):
            continue
        
        for root, dirs, files in os.walk(base_dir):
            for f in files:
                if not f.endswith('.txt'):
                    continue
                path = os.path.join(root, f)
                
                # 提取年份
                ym = re.search(r'(\d{4})', f)
                if not ym:
                    continue
                year = int(ym.group(1))
                if year < 1986 or year > 2026:
                    continue
                
                # 判断是否有答案
                has_answers = '答案' in f or '解析' in f
                
                # Check if the file actually contains answer table
                if not has_answers:
                    # Quick check: does the file have "答案速查" or "参考答案" near the end?
                    try:
                        with open(path, 'r', encoding='utf-8') as fh:
                            text = fh.read()
                        if '答案速查' in text or '1~5' in text[-3000:] or '1-5' in text[-3000:]:
                            has_answers = True
                    except:
                        pass
                
                result[subj_code].append((year, path, has_answers))
    
    return result


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    all_files = find_all_en_files()
    total = 0
    
    for subj_code in ['english1', 'english2']:
        subj_label = '英语一' if subj_code == 'english1' else '英语二'
        print(f'\n=== {subj_label} ({subj_code}) ===')
        
        files = all_files[subj_code]
        
        # Group by year, prefer files with answers
        year_best = {}
        for year, path, has_ans in files:
            if year not in year_best or (has_ans and not year_best[year][1]):
                year_best[year] = (path, has_ans)
        
        for year in sorted(year_best.keys()):
            path, has_ans = year_best[year]
            bn = os.path.basename(path)
            
            if not has_ans:
                continue  # Skip files without answers
            
            with open(path, 'r', encoding='utf-8') as f:
                text = f.read()
            
            answers = parse_answer_table(text)
            
            if not answers:
                # Try looking in a companion answer file
                # For 2021-2025, the answer is in the question file itself
                pass
            
            if answers:
                qs = generate_english_questions(year, subj_code, answers)
                cnt = write_english_js(qs, year, subj_code)
                total += cnt
                print(f'  {year}年: {bn[:40]} ... {cnt}题')
            else:
                print(f'  {year}年: {bn[:40]} ... 无答案')
    
    print(f'\n===== 总计生成 {total} 道英语真题 =====')
    return total


if __name__ == '__main__':
    main()
