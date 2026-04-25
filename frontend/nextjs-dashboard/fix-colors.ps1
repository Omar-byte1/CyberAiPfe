$basePath = "d:\cyberAiOllama-master\frontend\nextjs-dashboard\src"

$files = Get-ChildItem -Path "$basePath\app\(dashboard)", "$basePath\components" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # Replace specific dark mode background and border colors
    $newContent = $content -replace 'bg-\[#0a0a0a\]/(\d+)', 'bg-white'
    $newContent = $newContent -replace 'bg-\[#0a0a0a\]', 'bg-white'
    $newContent = $newContent -replace 'bg-\[#030303\]/(\d+)', 'bg-gray-50'
    $newContent = $newContent -replace 'bg-\[#030303\]', 'bg-gray-50'
    
    # Replace borders
    $newContent = $newContent -replace 'border-white/\[\d*\.\d+\]', 'border-gray-200'
    $newContent = $newContent -replace 'border-white/\[\d+\]', 'border-gray-200'
    
    # Replace translucent white backgrounds
    $newContent = $newContent -replace 'bg-white/\[\d*\.\d+\]', 'bg-gray-50'
    
    # Replace text colors
    $newContent = $newContent -replace 'text-gray-9000', 'text-gray-500'
    $newContent = $newContent -replace 'text-gray-300', 'text-gray-600'
    
    if ($content -ne $newContent) {
        Set-Content $file.FullName -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "Replaced dark colors in: $($file.Name)"
    }
}
