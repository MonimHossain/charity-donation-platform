$filePath = "c:\Users\santo\.cursor\projects\d-ICCA-New-folder-YI-test\agent-transcripts\f1e2b6b8-ce70-4169-863e-99de10c4f64e\subagents\6060ce08-f29f-4a28-bfb3-aa01f44beb7f.jsonl"
$lines = Get-Content $filePath
$line7 = $lines[6] | ConvertFrom-Json
$text = $line7.message.content[0].text
$text | Out-File -FilePath "d:\ICCA\New folder\YI test\transcript_line7.txt" -Encoding UTF8
Write-Output "Wrote line 7 text to transcript_line7.txt, length: $($text.Length)"
