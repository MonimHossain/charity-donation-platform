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

$transcriptFiles = @(
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents\938755ac-a75c-4ee6-86b7-e90c2fdf7c68.jsonl",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents\f64b6afd-582e-47ca-9eef-8059881cecd8.jsonl",
    "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents\d0c4d4ba-c5b3-4a58-9994-6cd2eafa83e2.jsonl"
)

foreach ($transcript in $transcriptFiles) {
    $lines = Get-Content $transcript
    $fname = [System.IO.Path]::GetFileName($transcript)
    Write-Output "=== $fname ==="
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $hasTarget = $false
        foreach ($target in $targetFiles) {
            if ($line -match [regex]::Escape($target)) {
                $hasTarget = $true
                break
            }
        }
        if ($hasTarget) {
            $obj = $line | ConvertFrom-Json
            $role = $obj.role
            Write-Output "  Line $($i+1) role=$role"
            if ($obj.message -and $obj.message.content) {
                foreach ($block in $obj.message.content) {
                    if ($block.type -eq "tool_use") {
                        $toolName = $block.name
                        if ($block.input.path) {
                            $path = $block.input.path
                            foreach ($t in $targetFiles) {
                                if ($path -match [regex]::Escape($t)) {
                                    $contentLen = 0
                                    if ($block.input.contents) { $contentLen = $block.input.contents.Length }
                                    Write-Output "    TOOL=$toolName PATH=$path contentLen=$contentLen"
                                }
                            }
                        }
                    }
                    if ($block.type -eq "text" -and $block.text) {
                        foreach ($t in $targetFiles) {
                            if ($block.text -match [regex]::Escape($t)) {
                                Write-Output "    TEXT mention of $t (textLen=$($block.text.Length))"
                                break
                            }
                        }
                    }
                }
            }
        }
    }
}
