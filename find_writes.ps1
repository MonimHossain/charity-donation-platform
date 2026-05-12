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

$subagentDir = "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents"
$transcripts = Get-ChildItem "$subagentDir\*.jsonl"

foreach ($transcript in $transcripts) {
    $lines = Get-Content $transcript.FullName
    $found = $false
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        foreach ($target in $targetFiles) {
            if ($line -match $target) {
                if (-not $found) {
                    Write-Output ""
                    Write-Output "=== $($transcript.Name) ($($transcript.Length) bytes, $($transcript.LastWriteTime)) ==="
                    $found = $true
                }
                $obj = $line | ConvertFrom-Json
                $role = $obj.role
                if ($obj.message -and $obj.message.content) {
                    foreach ($block in $obj.message.content) {
                        if ($block.type -eq "tool_use" -and $block.name -eq "Write") {
                            $path = $block.input.path
                            foreach ($t in $targetFiles) {
                                if ($path -match $t) {
                                    $contentLen = 0
                                    if ($block.input.contents) { $contentLen = $block.input.contents.Length }
                                    Write-Output "  WRITE: $path (content: $contentLen chars) [line $($i+1)]"
                                }
                            }
                        }
                        if ($block.type -eq "tool_use" -and $block.name -eq "StrReplace") {
                            $path = $block.input.path
                            foreach ($t in $targetFiles) {
                                if ($path -match $t) {
                                    $oldLen = 0
                                    $newLen = 0
                                    if ($block.input.old_string) { $oldLen = $block.input.old_string.Length }
                                    if ($block.input.new_string) { $newLen = $block.input.new_string.Length }
                                    Write-Output "  STREPLACE: $path (old: $oldLen, new: $newLen chars) [line $($i+1)]"
                                }
                            }
                        }
                    }
                }
                break
            }
        }
    }
}
