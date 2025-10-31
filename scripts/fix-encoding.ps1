Param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path '.').Path
$targets = @(
  (Join-Path $root 'apps/web')
  (Join-Path $root 'packages')
)
$exts = @('*.ts','*.tsx','*.json')

$enc1251     = [Text.Encoding]::GetEncoding(1251)
$encUtf8     = [Text.Encoding]::UTF8
$encUtf8NoBom = New-Object System.Text.UTF8Encoding($false)

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupRoot = Join-Path $root "_backup_bom/$stamp"
New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

function Get-RelPath([string]$path) {
  $r = $path
  if ($r.StartsWith($root)) { $r = $r.Substring($root.Length) }
  $r = $r.TrimStart([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
  return $r
}

function Ensure-Backup([string]$file) {
  $rel = Get-RelPath $file
  $dest = Join-Path $backupRoot $rel
  $destDir = Split-Path $dest -Parent
  if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item -LiteralPath $file -Destination $dest -Force
}

$total = 0

foreach ($t in $targets) {
  if (!(Test-Path $t)) { continue }
  $files = Get-ChildItem -Path $t -Recurse -File -Include $exts -ErrorAction SilentlyContinue
  foreach ($f in $files) {
    try {
      $bytes = [IO.File]::ReadAllBytes($f.FullName)

      $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
      $asUtf8  = $encUtf8.GetString($bytes)
      $as1251  = $enc1251.GetString($bytes)

      # Heuristic: fix mojibake — if UTF-8 shows replacement chars or no Cyrillic, but 1251 has Cyrillic
      $looksBroken = ($asUtf8 -match "[�]") -or (($as1251 -match "[А-Яа-яЁё]") -and -not ($asUtf8 -match "[А-Яа-яЁё]"))

      # Start from UTF-8 text (it may include BOM char \uFEFF as first char)
      $text = $asUtf8
      if ($looksBroken) { $text = $as1251 }

      # Strip BOM char and visible BOM remnants, normalize endings
      $text = $text -replace "^\uFEFF", ""
      $text = $text -replace 'п»ї', ''
      $text = $text -replace "\r\n?", "`n"

      # If nothing to change, skip
      $wouldChange = $hasBom -or ($asUtf8 -ne $text)
      if (-not $wouldChange) { continue }

      Ensure-Backup $f.FullName
      [IO.File]::WriteAllText($f.FullName, $text, $encUtf8NoBom)
      $total++
      Write-Host ("fixed: {0}" -f (Get-RelPath $f.FullName))
    }
    catch {
      Write-Warning ("skip: {0} - {1}" -f (Get-RelPath $f.FullName), $_.Exception.Message)
    }
  }
}

Write-Host ("Done. Files fixed: {0}" -f $total)
Write-Host ("Backups: {0}" -f $backupRoot)
