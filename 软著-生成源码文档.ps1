# ============================================================
# 考研刷题 - 软著源代码文档生成脚本
# 前后各30页，每页50行，共60页 / 3000行
# 运行后复制 gen-source-doc.txt 到 Word，调成宋体五号，导出PDF
# ============================================================

$projectRoot = "E:\hanako\408-brush"
$outputFile  = "$projectRoot\软著-源代码文档.txt"

$softwareName = "考研公共课刷题平台"
$version      = "V1.0"

# 核心文件列表（按重要性排序）
$coreFiles = @(
  "js\app.js",
  "js\storage.js",
  "js\search.js",
  "js\auth.js",
  "js\exam-mode.js",
  "js\subjects.js",
  "js\daily-challenge.js",
  "js\stats-dashboard.js",
  "js\study-plan.js",
  "js\kaoyan-guide.js",
  "js\kaoyan-planner.js",
  "js\bank-manager.js",
  "js\code-editor.js",
  "js\scratchpad.js",
  "js\share-card.js",
  "js\supabase.js",
  "css\style.css",
  "index.html",
  "sw.js",
  "manifest.json"
)

# 读取所有核心文件拼接
$allLines = @()
foreach ($f in $coreFiles) {
  $fullPath = Join-Path $projectRoot $f
  if (Test-Path $fullPath) {
    $lines = Get-Content $fullPath -Encoding UTF8
    $allLines += "// ====== 文件: $f ======"
    $allLines += $lines
    $allLines += ""
  }
}

$totalLines = $allLines.Count
Write-Host "核心文件总行数: $totalLines"

# 软著要求：前30页 + 后30页，每页50行
$linesPerPage = 50
$frontPages = 30
$backPages  = 30
$frontTotal = $frontPages * $linesPerPage  # 1500
$backTotal  = $backPages * $linesPerPage   # 1500

# 如果总行数不足60页，就全取
if ($totalLines -lt ($frontTotal + $backTotal)) {
  $frontTotal = [Math]::Min($totalLines, [Math]::Floor($totalLines / 2))
  $backTotal  = $totalLines - $frontTotal
}

# 取前后各1500行
$frontLines = $allLines[0..($frontTotal - 1)]
$backStart  = [Math]::Max(0, $totalLines - $backTotal)
$backLines  = $allLines[$backStart..($totalLines - 1)]

# ---- 生成带页眉的文档 ----
$sb = [System.Text.StringBuilder]::new()

function Add-PageHeader($pageNum) {
  $sb.AppendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") | Out-Null
  $sb.AppendLine("  软件名称：$softwareName    版本号：$version    第 $pageNum 页") | Out-Null
  $sb.AppendLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━") | Out-Null
  $sb.AppendLine("") | Out-Null
}

# 前30页
$page = 1
for ($i = 0; $i -lt $frontLines.Count; $i += $linesPerPage) {
  Add-PageHeader $page
  $end = [Math]::Min($i + $linesPerPage - 1, $frontLines.Count - 1)
  for ($j = $i; $j -le $end; $j++) {
    $sb.AppendLine($frontLines[$j]) | Out-Null
  }
  $sb.AppendLine("") | Out-Null
  $sb.AppendLine("") | Out-Null  # 分页符
  $page++
}

# 后30页
for ($i = 0; $i -lt $backLines.Count; $i += $linesPerPage) {
  Add-PageHeader $page
  $end = [Math]::Min($i + $linesPerPage - 1, $backLines.Count - 1)
  for ($j = $i; $j -le $end; $j++) {
    $sb.AppendLine($backLines[$j]) | Out-Null
  }
  $sb.AppendLine("") | Out-Null
  $sb.AppendLine("") | Out-Null
  $page++
}

# 输出
$sb.ToString() | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "✅ 源代码文档已生成: $outputFile"
Write-Host "   前30页: $frontTotal 行 | 后30页: $backTotal 行 | 共 $($page - 1) 页"
