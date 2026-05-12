$filePath = "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents\6060ce08-f29f-4a28-bfb3-aa01f44beb7f.jsonl"
$lines = Get-Content $filePath
Write-Output "Total lines: $($lines.Count)"
for ($i = 0; $i -lt $lines.Count; $i++) {
    $obj = $lines[$i] | ConvertFrom-Json
    $role = $obj.role
    $len = $lines[$i].Length
    Write-Output "Line $($i+1): role=$role length=$len"
    
    if ($obj.message -and $obj.message.content) {
        foreach ($block in $obj.message.content) {
            if ($block.type) {
                $btype = $block.type
                if ($block.name) {
                    Write-Output "  -> block type=$btype name=$($block.name)"
                } else {
                    $textLen = 0
                    if ($block.text) { $textLen = $block.text.Length }
                    Write-Output "  -> block type=$btype textLen=$textLen"
                }
            }
        }
    }
}
