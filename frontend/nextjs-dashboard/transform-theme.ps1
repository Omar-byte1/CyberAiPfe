# PowerShell script to batch-transform color classes across all remaining dashboard files
# This applies the light theme color replacements consistently

$basePath = "d:\cyberAiOllama-master\frontend\nextjs-dashboard\src"

$files = @(
    "$basePath\app\(dashboard)\cve\page.tsx",
    "$basePath\app\(dashboard)\incidents\page.tsx",
    "$basePath\app\(dashboard)\live-monitor\page.tsx",
    "$basePath\app\(dashboard)\ip-intel\page.tsx",
    "$basePath\app\(dashboard)\sandbox\page.tsx",
    "$basePath\app\(dashboard)\parse-ai\page.tsx",
    "$basePath\app\(dashboard)\parse-ai-history\page.tsx",
    "$basePath\app\(dashboard)\playbooks\page.tsx",
    "$basePath\app\(dashboard)\threat-report\page.tsx",
    "$basePath\components\ChatWidget.tsx",
    "$basePath\components\AICopilot.tsx",
    "$basePath\components\IPAnalysisResults.tsx",
    "$basePath\components\SandboxReport.tsx",
    "$basePath\components\WorldMap.tsx",
    "$basePath\components\AlertChart.tsx",
    "$basePath\components\LiveTrafficChart.tsx",
    "$basePath\app\(landing)\layout.tsx",
    "$basePath\app\(landing)\page.tsx"
)

# Define replacement pairs - order matters (more specific first)
$replacements = [ordered]@{
    # Background colors - dark to light
    "bg-\[#030303\]/80"     = "bg-white"
    "bg-\[#030303\]/50"     = "bg-white"
    "bg-\[#030303\]"        = "bg-white"
    "bg-\[#0a0a0a\]/80"     = "bg-white"
    "bg-\[#0a0a0a\]/60"     = "bg-white"
    "bg-\[#0a0a0a\]/50"     = "bg-white"
    "bg-\[#0a0a0a\]"        = "bg-gray-50"
    "bg-\[#0f0f0f\]/80"     = "bg-gray-50"
    "bg-\[#0f0f0f\]"        = "bg-gray-50"
    "bg-\[#010101\]"        = "bg-gray-50"
    "bg-slate-950"          = "bg-white"
    "bg-slate-900"          = "bg-white"
    "bg-slate-50/50"        = "bg-gray-50"
    "bg-slate-50"           = "bg-gray-50"

    # Text colors
    "text-zinc-50"          = "text-gray-900"
    "text-zinc-100"         = "text-gray-800"
    "text-zinc-200"         = "text-gray-700"
    "text-zinc-300"         = "text-gray-600"
    "text-zinc-400"         = "text-gray-500"
    "text-zinc-500"         = "text-gray-400"
    "text-zinc-600"         = "text-gray-300"
    "text-zinc-700"         = "text-gray-200"
    "text-zinc-800"         = "bg-gray-200"
    "text-slate-100"        = "text-gray-800"
    "text-slate-200"        = "text-gray-700"
    "text-slate-400"        = "text-gray-400"
    "text-slate-500"        = "text-gray-400"
    "text-slate-700"        = "text-gray-700"
    "text-slate-800"        = "text-gray-800"
    "text-slate-900"        = "text-gray-900"
    "text-white"            = "text-gray-900"

    # Violet/Indigo accent -> Green
    "text-violet-400"       = "text-green-600"
    "text-violet-500"       = "text-green-600"
    "text-violet-500/70"    = "text-green-600"
    "text-violet-500/50"    = "text-green-600"
    "text-indigo-400"       = "text-green-600"
    "text-indigo-500"       = "text-green-600"
    "text-indigo-50"        = "text-green-50"
    "text-indigo-100"       = "text-green-100"
    "text-indigo-300"       = "text-green-600"
    "text-indigo-600"       = "text-green-600"
    "text-blue-100"         = "text-blue-100"
    "text-blue-300"         = "text-blue-400"

    # Cyan accent -> Blue-light / Green
    "text-cyan-400"         = "text-blue-500"
    "text-cyan-400/70"      = "text-blue-400"
    "text-cyan-500"         = "text-blue-500"
    "text-cyan-500/50"      = "text-blue-400"

    # Background accents
    "bg-violet-600"         = "bg-green-600"
    "bg-violet-500"         = "bg-green-600"
    "bg-violet-500/20"      = "bg-green-100"
    "bg-violet-500/10"      = "bg-green-50"
    "bg-violet-500/5"       = "bg-green-50"
    "bg-violet-600/20"      = "bg-green-100"
    "bg-violet-600/10"      = "bg-green-50"
    "bg-violet-600/5"       = "bg-green-50"
    "bg-violet-900/10"      = "bg-green-50"
    "bg-violet-950/20"      = "bg-green-50"
    "bg-indigo-600"         = "bg-green-600"
    "bg-indigo-700"         = "bg-green-700"
    "bg-indigo-500"         = "bg-green-600"
    "bg-indigo-900"         = "bg-green-100"
    "bg-indigo-900/50"      = "bg-green-50"
    "bg-indigo-100"         = "bg-green-50"
    "bg-indigo-500/10"      = "bg-green-50"
    "bg-indigo-500/5"       = "bg-green-50"
    "bg-cyan-600"           = "bg-blue-100"
    "bg-cyan-500"           = "bg-blue-100"
    "bg-cyan-500/10"        = "bg-blue-50"
    "bg-cyan-500/5"         = "bg-blue-50"
    "bg-cyan-600/10"        = "bg-blue-50"

    # Border colors
    "border-white/\[0\.08\]"  = "border-gray-200"
    "border-white/\[0\.05\]"  = "border-gray-200"
    "border-white/\[0\.1\]"   = "border-gray-200"
    "border-white/\[0\.03\]"  = "border-gray-100"
    "border-white/\[0\.04\]"  = "border-gray-100"
    "border-white/\[0\.2\]"   = "border-gray-300"
    "border-white/10"         = "border-gray-200"
    "border-white/[0.05]"     = "border-gray-200"
    "border-slate-200"        = "border-gray-200"
    "border-slate-700"        = "border-gray-200"
    "border-slate-800"        = "border-gray-200"
    "border-violet-500/50"    = "border-green-500"
    "border-violet-500/30"    = "border-green-300"
    "border-violet-500/20"    = "border-green-200"
    "border-violet-500/40"    = "border-green-300"
    "border-indigo-700/50"    = "border-green-300"
    "border-indigo-500/30"    = "border-green-300"
    "border-indigo-500"       = "border-green-500"
    "border-cyan-500/30"      = "border-blue-200"
    "border-cyan-500/50"      = "border-blue-300"

    # Hover backgrounds
    "hover:bg-white/\[0\.05\]"  = "hover:bg-green-50"
    "hover:bg-white/\[0\.08\]"  = "hover:bg-gray-50"
    "hover:bg-white/\[0\.1\]"   = "hover:bg-gray-100"
    "hover:bg-white/\[0\.2\]"   = "hover:bg-gray-100"
    "hover:bg-white/20"         = "hover:bg-gray-100"
    "hover:bg-violet-500"       = "hover:bg-green-700"
    "hover:bg-indigo-700"       = "hover:bg-green-700"
    "hover:bg-violet-500/10"    = "hover:bg-green-50"
    "hover:bg-violet-500/20"    = "hover:bg-green-50"

    # Semi-transparent whites -> grays
    "bg-white/\[0\.03\]"     = "bg-gray-50"
    "bg-white/\[0\.02\]"     = "bg-gray-50"
    "bg-white/\[0\.05\]"     = "bg-gray-100"
    "bg-white/\[0\.01\]"     = "bg-gray-50"
    "bg-white/\[0\.08\]"     = "bg-gray-100"
    "bg-white/10"            = "bg-gray-100"
    "bg-white/20"            = "bg-gray-100"
    "bg-black/20"            = "bg-gray-100"
    "bg-black/30"            = "bg-gray-100"
    "bg-zinc-800"            = "bg-gray-200"
    "bg-zinc-900/50"         = "bg-gray-50"

    # Focus-within borders
    "focus-within:border-violet-500/50"  = "focus-within:border-green-500"
    "focus-within:border-emerald-500/50" = "focus-within:border-green-500"
    "focus-within:border-blue-500/50"    = "focus-within:border-green-500"
    "focus-within:border-cyan-500/50"    = "focus-within:border-green-500"
    "focus-within:border-rose-500/50"    = "focus-within:border-green-500"
    "focus-within:border-indigo-500/50"  = "focus-within:border-green-500"
    "focus:border-violet-500/50"         = "focus:border-green-500"
    "focus:border-rose-500/50"           = "focus:border-green-500"
    "focus:border-blue-500/50"           = "focus:border-green-500"
    "focus:border-emerald-500/50"        = "focus:border-green-500"
    "focus:border-indigo-500/50"         = "focus:border-green-500"
    "focus:border-cyan-500/50"           = "focus:border-green-500"
    "focus:ring-blue-500/50"             = "focus:ring-green-500/50"
    "focus:ring-2 focus:ring-blue-500/50"= "focus:ring-2 focus:ring-green-500/50"

    # Shadows - remove neon glows, use clean shadows
    "shadow-2xl"             = "shadow-sm"
    "shadow-xl"              = "shadow-sm"
    "shadow-inner"           = ""
    "shadow-lg"              = "shadow-sm"

    # Remove blur/glow effects
    "backdrop-blur-3xl"      = ""
    "backdrop-blur-2xl"      = ""
    "backdrop-blur-xl"       = ""
    "backdrop-blur-md"       = "backdrop-blur-sm"
    "backdrop-blur-sm"       = ""
    "mix-blend-screen"       = ""

    # Hover effects
    "hover:text-white"       = "hover:text-gray-900"
    "hover:bg-indigo-600"    = "hover:bg-green-600"
    "hover:bg-blue-600"      = "hover:bg-green-600"
    "hover:bg-blue-700"      = "hover:bg-green-700"
    "hover:bg-cyan-500"      = "hover:bg-blue-100"

    # Group hover
    "group-hover:text-violet-400"  = "group-hover:text-green-600"
    "group-hover:text-violet-300"  = "group-hover:text-green-600"
    "group-hover:text-indigo-400"  = "group-hover:text-green-600"
    "group-hover:text-blue-300"    = "group-hover:text-green-600"
    "group-hover:text-amber-300"   = "group-hover:text-amber-600"
    "group-hover:text-amber-400"   = "group-hover:text-amber-600"
    "group-hover:text-rose-300"    = "group-hover:text-red-600"
    "group-hover:bg-blue-600"      = "group-hover:bg-green-600"
    "group-hover:border-blue-500"  = "group-hover:border-green-500"

    # Specific accent overrides for buttons staying white text
    "bg-green-600 hover:bg-green-700 text-gray-900" = "bg-green-600 hover:bg-green-700 text-white"
    "bg-green-600 text-gray-900"    = "bg-green-600 text-white"

    # Scrollbar colors
    "rgba(255, 255, 255, 0.1)"   = "rgba(0, 0, 0, 0.1)"
    "rgba(255, 255, 255, 0.2)"   = "rgba(0, 0, 0, 0.2)"
    "rgba(255,255,255,0.05)"     = "rgba(0, 0, 0, 0.05)"

    # Chart colors
    "'#8b5cf6'"              = "'#16a34a'"
    "'rgba(139, 92, 246, 0.15)'" = "'rgba(22, 163, 74, 0.1)'"
    "'#71717a'"              = "'#6b7280'"
    "'rgba(255, 255, 255, 0.05)'" = "'#e5e7eb'"
}

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw -Encoding UTF8
        $original = $content

        foreach ($key in $replacements.Keys) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
        }

        # Remove glow shadow patterns like shadow-[0_0_*px_rgba(*)]
        $content = $content -replace 'shadow-\[0_0_\d+px[^\]]*\]', ''
        # Remove blur patterns like blur-[*px]
        $content = $content -replace 'blur-\[\d+px\]', ''
        # Remove animate-pulse on decorative orbs (keep on status dots)
        # Remove pointer-events-none decorative divs with absolute positioning and blur
        # Clean up double spaces from removed classes
        $content = $content -replace '\s{2,}', ' '
        $content = $content -replace '" "', '""'

        if ($content -ne $original) {
            Set-Content $file -Value $content -Encoding UTF8 -NoNewline
            Write-Host "Updated: $file"
        } else {
            Write-Host "No changes: $file"
        }
    } else {
        Write-Host "NOT FOUND: $file"
    }
}

Write-Host "`nBatch transformation complete!"
