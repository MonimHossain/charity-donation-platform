$targetFiles = @(
    "ImpactStats.tsx",
    "Testimonials.tsx",
    "StorySection.tsx",
    "MonthlyUpsell.tsx",
    "Quote.tsx",
    "ZakatResources.tsx",
    "Stories.tsx",
    "Newsletter.tsx",
    "FAQ.tsx",
    "CTA.tsx"
)

$baseDirs = @(
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\b559f526-5bfb-4b61-9a71-2193bf4e3e26",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\83e594bf-0ad6-42af-8417-adc50d4ba5e8",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\4bcd792f-ebdd-4408-8f94-ad5d546b1250",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\3494c111-390c-4ce2-8fa8-f92e0a4b3db2"
)

foreach ($baseDir in $baseDirs) {
    $allJsonl = Get-ChildItem "$baseDir\*.jsonl" -Recurse
    foreach ($jfile in $allJsonl) {
        $content = Get-Content $jfile.FullName -Raw
        $hasAny = $false
        foreach ($t in $targetFiles) {
            if ($content -match [regex]::Escape($t)) {
                $hasAny = $true
                break
            }
        }
        if ($hasAny) {
            Write-Output "MATCH: $($jfile.FullName) ($($jfile.Length) bytes)"
            $lines = Get-Content $jfile.FullName
            for ($i = 0; $i -lt $lines.Count; $i++) {
                $obj = $lines[$i] | ConvertFrom-Json
                if ($obj.message -and $obj.message.content) {
                    foreach ($block in $obj.message.content) {
                        if ($block.type -eq "tool_use" -and $block.name -eq "Write" -and $block.input.path) {
                            foreach ($t in $targetFiles) {
                                if ($block.input.path -match [regex]::Escape($t)) {
                                    $cLen = 0
                                    if ($block.input.contents) { $cLen = $block.input.contents.Length }
                                    Write-Output "  WRITE: $($block.input.path) ($cLen chars) [line $($i+1)]"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
