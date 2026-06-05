# -*- coding: utf-8 -*-
"""全面下载 Awesome-408 + 重解析 suhan42，最大化提取 408 真题"""
import urllib.request, urllib.parse, json, os, re, ssl, base64, time

ssl._create_default_https_context = ssl._create_unverified_context

OUTPUT_DIR = r'E:\hanako\408-brush\js'
SUHAN_DIR = r'E:\hanako\suhan42_md'
AWESOME_DIR = r'E:\hanako\awesome408_md'

def get_json(url):
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            if attempt < 4:
                time.sleep(3)
            else:
                raise e

def download_repo(repo_url, dest_dir):
    """下载整个仓库的所有文件"""
    os.makedirs(dest_dir, exist_ok=True)
    
    # 获取根目录
    print(f'Fetching {repo_url}...')
    contents = get_json(repo_url + '/contents/')
    
    def download_recursive(items, prefix=''):
        for item in items:
            if item['type'] == 'dir':
                try:
                    sub = get_json(item['url'])
                    download_recursive(sub, item['name'] + '/')
                except:
                    pass
            elif item['type'] == 'file':
                fname = prefix + item['name']
                local = os.path.join(dest_dir, fname.replace('/', '_'))
                if os.path.exists(local) and os.path.getsize(local) > 50:
                    continue
                
                # 只下载文本文件
                ext = os.path.splitext(item['name'])[1].lower()
                if ext not in ['.md', '.txt', '.c', '.cpp', '.java', '.py', '.js', '.html']:
                    continue
                
                try:
                    data = get_json(item['url'])
                    if 'content' in data:
                        content = base64.b64decode(data['content']).decode('utf-8')
                        with open(local, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f'  {fname[:60]} ({len(content)} chars)')
                except:
                    pass
                time.sleep(0.5)
    
    download_recursive(contents)
    print(f'Done downloading to {dest_dir}')

def clean_text(s):
    s = s.replace('\u3000', ' ').replace('\u00A0', ' ')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

TOPIC_MAP = {
    'ds': {'绪论':'ds-1','线性表':'ds-2','链表':'ds-2','栈':'ds-3','队列':'ds-3','串':'ds-4','KMP':'ds-4','矩阵':'ds-3','树':'ds-5','二叉':'ds-5','森林':'ds-5','哈夫曼':'ds-5','并查集':'ds-5','图':'ds-6','MST':'ds-6','最短路径':'ds-6','拓扑':'ds-6','查找':'ds-7','折半':'ds-7','B树':'ds-7','B+树':'ds-7','散列':'ds-7','哈希':'ds-7','排序':'ds-8','快排':'ds-8','归并':'ds-8','堆排':'ds-8','基数':'ds-8'},
    'co': {'概述':'co-1','冯诺依曼':'co-1','性能':'co-1','进制':'co-2','表示':'co-2','运算':'co-2','IEEE':'co-2','浮点':'co-2','ALU':'co-2','存储':'co-3','Cache':'co-3','主存':'co-3','虚存':'co-3','TLB':'co-3','指令':'co-4','寻址':'co-4','CPU':'co-5','流水线':'co-5','数据通路':'co-5','冒险':'co-5','总线':'co-6','PCI':'co-6','I/O':'co-7','DMA':'co-7','中断':'co-7','查询':'co-7'},
    'os': {'概述':'os-1','系统调用':'os-1','进程':'os-2','线程':'os-2','调度':'os-2','同步':'os-2','死锁':'os-2','信号量':'os-2','PV':'os-2','管程':'os-2','互斥':'os-2','临界':'os-2','内存':'os-3','分页':'os-3','分段':'os-3','虚拟':'os-3','页面':'os-3','置换':'os-3','文件':'os-4','inode':'os-4','磁盘':'os-4','I/O':'os-5','缓冲':'os-5','SPOOL':'os-5'},
    'cn': {'概述':'cn-1','体系':'cn-1','OSI':'cn-1','TCP/IP':'cn-1','物理层':'cn-2','编码':'cn-2','链路':'cn-3','MAC':'cn-3','CSMA':'cn-3','交换机':'cn-3','网桥':'cn-3','网络层':'cn-4','IP':'cn-4','路由':'cn-4','RIP':'cn-4','OSPF':'cn-4','BGP':'cn-4','子网':'cn-4','CIDR':'cn-4','NAT':'cn-4','传输层':'cn-5','TCP':'cn-5','UDP':'cn-5','流量':'cn-5','拥塞':'cn-5','三次握手':'cn-5','应用层':'cn-6','DNS':'cn-6','HTTP':'cn-6','FTP':'cn-6','SMTP':'cn-6'}
}

def guess_subject(fname, text):
    f = fname.lower()
    if '数据' in f or 'ds' in f or 'data' in f: return 'ds'
    if '计组' in f or '组成' in f or 'co' in f: return 'co'
    if '操作' in f or 'os' in f: return 'os'
    if '网络' in f or 'cn' in f or 'network' in f: return 'cn'
    # Guess from content
    for kw in ['数据结构', '二叉树', '链表', '排序', '图论']:
        if kw in text[:1000]: return 'ds'
    for kw in ['CPU', '指令', '流水线', '存储系统', 'Cache']:
        if kw in text[:1000]: return 'co'
    for kw in ['进程', '线程', '信号量', '死锁', '分页']:
        if kw in text[:1000]: return 'os'
    for kw in ['TCP', 'IP地址', '路由器', '子网', 'DNS']:
        if kw in text[:1000]: return 'cn'
    return 'ds'

def guess_topic(subj, text, fname):
    text_lower = text + fname
    for kw, tp in TOPIC_MAP.get(subj, {}).items():
        if kw in text_lower:
            return tp
    return subj + '-1'

def extract_all_questions(text, fname):
    """增强版解析器，捕获所有真题引用格式"""
    questions = []
    subj = guess_subject(fname, text)
    
    # 移除代码块和图片
    text = re.sub(r'```.*?```', ' ', text, flags=re.DOTALL)
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
    
    # 逐行处理（真题引用通常在单独的行或blockquote中）
    lines = text.split('\n')
    
    for line in lines:
        cline = re.sub(r'[\*=`>#\-]', ' ', line)
        cline = clean_text(cline)
        if len(cline) < 15:
            continue
        
        # === 多种年份标记匹配 ===
        year = None
        # 格式1: 【2014年408真题】
        ym = re.search(r'【?(\d{4})年\s*(?:408|统考)\s*(?:真题)?】?', cline)
        if ym:
            year = int(ym.group(1))
        # 格式2: （2014年408真题）or （2014年408）
        if not year:
            ym = re.search(r'[（(](\d{4})年\s*(?:408|统考)', cline)
            if ym:
                year = int(ym.group(1))
        # 格式3: 【2014年408】
        if not year:
            ym = re.search(r'【(\d{4})年\s*408', cline)
            if ym:
                year = int(ym.group(1))
        
        if not year or year < 2009 or year > 2026:
            continue
        
        # 移除年份标记后的文本
        remaining = cline
        for pat in [r'【?\d{4}年\s*(?:408|统考)\s*(?:真题)?】?', r'[（(]\d{4}年\s*(?:408|统考)\s*(?:真题)?[）)]', r'【\d{4}年\s*408】']:
            remaining = re.sub(pat, '', remaining)
        remaining = clean_text(remaining)
        
        if len(remaining) < 5:
            continue
        
        # === 提取答案 ===
        answer = ''
        # 括号答案: （B）、（A）、（C）
        ans_match = re.search(r'[（(]\s*([A-D])\s*[）)]', remaining)
        if ans_match:
            answer = ans_match.group(1)
            # 移除答案括号
            remaining = re.sub(r'[（(]\s*[A-D]\s*[）)]', '', remaining)
        
        # 数字答案: （2）、（6）、（1.8）
        if not answer:
            num_match = re.search(r'[（(]\s*([\d.]+)\s*[）)]', remaining)
            if num_match:
                answer = num_match.group(1)
                remaining = re.sub(r'[（(]\s*[\d.]+\s*[）)]', '', remaining)
        
        # 冒号答案: 答案：B 或 选B
        if not answer:
            ans2 = re.search(r'(?:答案|选)[：:]\s*([A-D])', remaining)
            if ans2:
                answer = ans2.group(1)
        
        remaining = clean_text(remaining)
        
        # === 提取选项 ===
        options = []
        opt_pattern = r'([A-D])\s*[.、．]\s*(.*?)(?=\s*[A-D]\s*[.、．]\s|$)'
        opts = re.findall(opt_pattern, remaining, re.DOTALL)
        if len(opts) >= 2:
            for letter, content in opts:
                content = clean_text(content)
                if content:
                    options.append(f"{letter}. {content[:60]}")
            # 截断题目文本
            first_opt = re.search(r'\s+[A-D]\s*[.、．]', remaining)
            if first_opt:
                remaining = clean_text(remaining[:first_opt.start()])
        
        # === 最终题目 ===
        question_text = remaining[:400]
        if len(question_text) < 5:
            continue
        
        # 题型
        if not answer:
            qtype = 'single'
        elif len(answer) == 1 and answer in 'ABCD':
            qtype = 'single'
        elif len(answer) > 1 and all(c in 'ABCD' for c in answer):
            qtype = 'multi'
        else:
            qtype = 'fill'
        
        # 没有选项时可能是填空/判断
        if not options and qtype == 'single':
            options = []
        
        topic = guess_topic(subj, question_text, fname)
        
        questions.append({
            'id': f'{year}-{subj}-{len(questions)+1}',
            'year': year, 'subject': subj, 'topic': topic, 'type': qtype,
            'question': question_text,
            'options': options,
            'answer': answer,
            'analysis': ''
        })
    
    return questions


def parse_all_dirs():
    """解析所有已下载目录中的markdown文件"""
    all_qs = []
    
    for dname, dpath in [('suhan42', SUHAN_DIR), ('awesome408', AWESOME_DIR)]:
        if not os.path.exists(dpath):
            continue
        for fname in sorted(os.listdir(dpath)):
            if not any(fname.endswith(ext) for ext in ['.md', '.txt']):
                continue
            path = os.path.join(dpath, fname)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    text = f.read()
            except:
                continue
            
            qs = extract_all_questions(text, fname)
            if qs:
                print(f'  [{dname}] {fname[:50]:50s} {len(qs)}q')
            all_qs.extend(qs)
    
    return all_qs


def write_data_files(all_qs):
    """写入数据文件并按年份分组"""
    year_data = {}
    for q in all_qs:
        year = q['year']
        year_data.setdefault(year, []).append(q)
    
    total = 0
    for year in sorted(year_data.keys()):
        qs = year_data[year]
        out_path = os.path.join(OUTPUT_DIR, f'data-408-{year}.js')
        var_name = f'QUESTIONS_408_{year}'
        
        lines = [f'// 408 {year}年真题 (auto-extracted)']
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
        has_ans = len([q for q in qs if q['answer']])
        print(f'  {year}: {len(qs)}q ({has_ans} ans)')
    
    print(f'\nTotal: {total} questions in {len(year_data)} years')
    return total


def main():
    # 1. 下载 Awesome-408
    print('=== Downloading Awesome-408 ===')
    download_repo('https://api.github.com/repos/amatureemoprince/Awesome-408', AWESOME_DIR)
    
    # 2. 解析所有文件
    print('\n=== Parsing all files ===')
    all_qs = parse_all_dirs()
    
    # 3. 去重（同一年份同一科目同一题目内容）
    seen = set()
    unique = []
    for q in all_qs:
        key = (q['year'], q['subject'], q['question'][:50])
        if key not in seen:
            seen.add(key)
            unique.append(q)
    
    print(f'\nAfter dedup: {len(unique)} questions (removed {len(all_qs)-len(unique)} duplicates)')
    
    # 4. 写入
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    write_data_files(unique)

if __name__ == '__main__':
    main()
