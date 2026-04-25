$basePath = "d:\cyberAiOllama-master\frontend\nextjs-dashboard\src"

$files = @(
    "$basePath\app\(dashboard)\cve\page.tsx",
    "$basePath\app\(dashboard)\sandbox\page.tsx",
    "$basePath\app\(dashboard)\incidents\page.tsx",
    "$basePath\app\(dashboard)\live-monitor\page.tsx",
    "$basePath\app\(dashboard)\parse-ai\page.tsx",
    "$basePath\app\(dashboard)\parse-ai-history\page.tsx",
    "$basePath\app\(dashboard)\playbooks\page.tsx",
    "$basePath\app\(dashboard)\threat-report\page.tsx",
    "$basePath\app\(dashboard)\ip-intel\page.tsx",
    "$basePath\components\IPAnalysisResults.tsx",
    "$basePath\components\SandboxReport.tsx",
    "$basePath\components\WorldMap.tsx",
    "$basePath\components\AlertChart.tsx",
    "$basePath\components\LiveTrafficChart.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8

        # Fix green buttons that should have white text
        $content = $content -replace 'bg-green-600 text-gray-900', 'bg-green-600 text-white'
        $content = $content -replace 'hover:bg-green-700 text-gray-900', 'hover:bg-green-700 text-white'
        $content = $content -replace 'bg-blue-500 text-gray-900', 'bg-blue-500 text-white'
        $content = $content -replace 'bg-blue-100 text-gray-900', 'bg-blue-500 text-white'
        $content = $content -replace 'hover:bg-green-600 text-gray-900', 'hover:bg-green-600 text-white'
        $content = $content -replace 'bg-rose-500 text-gray-900', 'bg-rose-500 text-white'
        $content = $content -replace 'bg-amber-500 text-gray-900', 'bg-amber-500 text-white'
        $content = $content -replace 'bg-emerald-500 text-gray-900', 'bg-emerald-500 text-white'
        $content = $content -replace 'bg-red-600 text-gray-900', 'bg-red-600 text-white'
        
        # Fix gradient text on white bg (hero titles should stay visible)
        $content = $content -replace 'bg-gradient-to-r from-gray-900 to-gray-200', 'bg-gradient-to-r from-gray-900 to-gray-500'
        $content = $content -replace 'bg-gradient-to-br from-gray-900', 'bg-gradient-to-br from-gray-900'
        
        # Remove remaining dark: prefixes
        $content = $content -replace 'dark:bg-white\b', 'bg-white'
        $content = $content -replace 'dark:bg-gray-\d+', ''
        $content = $content -replace 'dark:bg-slate-\d+/?\d*', ''
        $content = $content -replace 'dark:bg-slate-\d+', ''
        $content = $content -replace 'dark:text-gray-\d+', ''
        $content = $content -replace 'dark:text-slate-\d+', ''
        $content = $content -replace 'dark:text-green-\d+', ''
        $content = $content -replace 'dark:border-gray-\d+', ''
        $content = $content -replace 'dark:border-slate-\d+', ''
        $content = $content -replace 'dark:border-transparent', ''
        $content = $content -replace 'dark:placeholder:text-gray-\d+', ''
        $content = $content -replace 'dark:focus:border-green-\d+/?\d*', ''
        $content = $content -replace 'dark:focus:bg-white', ''
        $content = $content -replace 'dark:shadow-\[[^\]]*\]', ''
        
        # Fix bg-[#030303] that wasn't caught (e.g. in PDF backgroundColor)
        $content = $content -replace "backgroundColor: '#030303'", "backgroundColor: '#ffffff'"
        $content = $content -replace "backgroundColor: '#0a0a0a'", "backgroundColor: '#f9fafb'"
        
        # Fix gradient header text that uses bg-clip-text (needs from-gray-900 to-gray-500)
        $content = $content -replace 'bg-clip-text bg-gradient-to-r from-gray-900 to-gray-200', 'bg-clip-text bg-gradient-to-r from-gray-900 to-gray-400'
        
        Set-Content $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Fixed: $file"
    }
}

Write-Host "Fix pass complete!"
