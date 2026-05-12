$baseDirs = @(
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\4bcd792f-ebdd-4408-8f94-ad5d546b1250",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\83e594bf-0ad6-42af-8417-adc50d4ba5e8",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\3494c111-390c-4ce2-8fa8-f92e0a4b3db2"
)

foreach ($baseDir in $baseDirs) {
    $allJsonl = Get-ChildItem "$baseDir\*.jsonl" -Recurse -ErrorAction SilentlyContinue
    foreach ($jfile in $allJsonl) {
        $content = Get-Content $jfile.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match "Testimonials") {
            Write-Output "TESTIMONIALS in: $($jfile.Name) ($($jfile.Length) bytes, $($jfile.LastWriteTime))"
            $lines = Get-Content $jfile.FullName
            for ($i = 0; $i -lt $lines.Count; $i++) {
                try {
                    $obj = $lines[$i] | ConvertFrom-Json -ErrorAction SilentlyContinue
                    if ($obj -and $obj.message -and $obj.message.content) {
                        foreach ($block in $obj.message.content) {
                            if ($block.type -eq "tool_use" -and $block.input -and $block.input.path -and $block.input.path -match "Testimonials") {
                                $cLen = 0
                                if ($block.input.contents) { $cLen = $block.input.contents.Length }
                                Write-Output "  tool=$($block.name) path=$($block.input.path) contentLen=$cLen [line $($i+1)]"
                            }
                        }
                    }
                } catch {}
            }
        }
    }
}

Write-Output ""
Write-Output "=== Also checking f1e2b6b8 parent transcript for MonthlyUpsell ==="
$parentFile = "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\f1e2b6b8-ce70-4169-863e-99de10c4f64e.jsonl"
$lines = Get-Content $parentFile
Write-Output "Parent transcript has $($lines.Count) lines"
$obj40 = $lines[39] | ConvertFrom-Json
if ($obj40.message -and $obj40.message.content) {
    foreach ($block in $obj40.message.content) {
        if ($block.type -eq "tool_use" -and $block.name -eq "Write" -and $block.input.path -match "MonthlyUpsell") {
            Write-Output "Found MonthlyUpsell Write at line 40, content length: $($block.input.contents.Length)"
            $block.input.contents | Out-File -FilePath "d:\ICCA\New folder\YI test\MonthlyUpsell_original.txt" -Encoding UTF8 -NoNewline
            Write-Output "Saved to MonthlyUpsell_original.txt"
        }
    }
}
