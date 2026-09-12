<#
.SYNOPSIS
  Install agent-docs-kit skills, and optionally scaffold docs templates
  into a target repo.

.DESCRIPTION
  PowerShell equivalent of install.sh. The two must stay in step:
  same defaults, same skip/force rules, same dry-run guarantee,
  same summary counters, same exit codes.

.EXAMPLE
  ./install.ps1 -DryRun

.EXAMPLE
  ./install.ps1 -SkillsRoot "$HOME\.claude\skills","$HOME\.config\opencode\skills"

.EXAMPLE
  ./install.ps1 -NoSkills -Docs H:\Projects\homelab-ops
#>
[CmdletBinding()]
param(
    # Install skills here. Accepts several roots for multi-harness setups.
    [string[]] $SkillsRoot,

    # Do not install skills. Use with -Docs.
    [switch] $NoSkills,

    # Scaffold templates/ (AGENTS.md, CONTEXT.md, docs/) into this repository.
    [string] $Docs,

    # Overwrite existing skill dirs and doc files.
    [switch] $Force,

    # Print every action and write nothing at all.
    [switch] $DryRun,

    [switch] $Help
)

$ErrorActionPreference = 'Stop'

$ScriptDir    = $PSScriptRoot
$SkillsSrc    = Join-Path $ScriptDir 'skills'
$TemplatesSrc = Join-Path $ScriptDir 'templates'

$DefaultSkillRoot = Join-Path $HOME '.claude/skills'

$script:Created = 0
$script:Skipped = 0
$script:Would   = 0
$script:Failed  = 0

function Show-Usage {
    @'
Usage: ./install.ps1 [options]

Installs every skill in skills/ into one or more skill roots, and can
scaffold templates/ into a target repository.

Options:
  -SkillsRoot <path[,path]>  Install skills here. Accepts several roots for
                             multi-harness setups.
                             Default: ~/.claude/skills
  -NoSkills                  Do not install skills. Use with -Docs.
  -Docs <path>               Scaffold templates/ (AGENTS.md, CONTEXT.md and the
                             docs/ tree) into this repository.
  -Force                     Overwrite existing skill dirs and doc files.
                             Without it, anything already present is skipped.
  -DryRun                    Print every action and write nothing at all.
  -Help                      Show this help.

Exit status is non-zero if any copy fails.
'@ | Write-Output
}

function Say  { param([string] $Message) Write-Output $Message }
function Fail { param([string] $Message) Write-Error -Message $Message -ErrorAction Continue }

if ($Help) { Show-Usage; exit 0 }

# Normalize to a flat list of roots. Accepts -SkillsRoot a,b (native call) and
# a single "a,b" / "a;b" string, which is how the argument arrives when the
# script is launched with -File from a non-PowerShell shell.
$SkillsRoot = @(
    @($SkillsRoot) |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
        ForEach-Object { $_ -split '[;,]' } |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ }
)
if ($SkillsRoot.Count -eq 0) {
    $SkillsRoot = @($DefaultSkillRoot)
}

$wantDocs = -not [string]::IsNullOrWhiteSpace($Docs)

if ($NoSkills -and -not $wantDocs) {
    Fail '-NoSkills with no -Docs leaves nothing to do'
    exit 2
}

if ($DryRun) { Say 'DRY RUN - no files will be written.' }

function Ensure-Dir {
    param([string] $Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    if (Test-Path -LiteralPath $Path) { return }
    if ($DryRun) { return }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
}

function Copy-Tree {
    param([string] $Source, [string] $Destination, [string] $Label)

    if ($DryRun) {
        Say "would install $Label -> $Destination"
        $script:Would++
        return
    }
    try {
        if (Test-Path -LiteralPath $Destination) {
            Remove-Item -LiteralPath $Destination -Recurse -Force
        }
        Ensure-Dir (Split-Path -Parent $Destination)
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
        Say "installed $Label -> $Destination"
        $script:Created++
    } catch {
        Fail "failed to install $Label -> $Destination : $($_.Exception.Message)"
        $script:Failed++
    }
}

function Copy-File {
    param([string] $Source, [string] $Destination, [string] $Label)

    if ((Test-Path -LiteralPath $Destination) -and (-not $Force)) {
        Say "skip     $Label (exists)"
        $script:Skipped++
        return
    }
    if ($DryRun) {
        Say "would create $Label"
        $script:Would++
        return
    }
    try {
        Ensure-Dir (Split-Path -Parent $Destination)
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
        Say "created  $Label"
        $script:Created++
    } catch {
        Fail "failed to write $Label : $($_.Exception.Message)"
        $script:Failed++
    }
}

function Install-Skills {
    if (-not (Test-Path -LiteralPath $SkillsSrc)) {
        Fail "no skills directory at $SkillsSrc"
        $script:Failed++
        return
    }

    foreach ($root in $SkillsRoot) {
        Say ''
        Say "Skills -> $root"
        Ensure-Dir $root

        $dirs = @(Get-ChildItem -LiteralPath $SkillsSrc -Directory | Sort-Object Name)
        $found = 0

        foreach ($dir in $dirs) {
            if (-not (Test-Path -LiteralPath (Join-Path $dir.FullName 'SKILL.md'))) {
                Say "skip     $($dir.Name) (no SKILL.md)"
                $script:Skipped++
                continue
            }
            $found++
            $target = Join-Path $root $dir.Name
            if ((Test-Path -LiteralPath $target) -and (-not $Force)) {
                Say "skip     $($dir.Name) (already installed; use -Force to replace)"
                $script:Skipped++
                continue
            }
            Copy-Tree -Source $dir.FullName -Destination $target -Label $dir.Name
        }

        if ($found -eq 0) {
            Fail "no skills found under $SkillsSrc"
            $script:Failed++
        }
    }
}

function Scaffold-Docs {
    if (-not (Test-Path -LiteralPath $TemplatesSrc)) {
        Fail "no templates directory at $TemplatesSrc"
        $script:Failed++
        return
    }

    Say ''
    Say "Docs -> $Docs"
    Ensure-Dir $Docs

    # Mirror templates/ into the target. templates/ holds AGENTS.md, CONTEXT.md
    # and the docs/ tree, so a plain mirror is exactly the scaffold.
    $prefix = (Resolve-Path -LiteralPath $TemplatesSrc).Path.TrimEnd('\', '/')
    $files = @(
        Get-ChildItem -LiteralPath $TemplatesSrc -Recurse -File |
            ForEach-Object {
                [pscustomobject]@{
                    Full = $_.FullName
                    Rel  = $_.FullName.Substring($prefix.Length).TrimStart('\', '/') -replace '\\', '/'
                }
            } |
            Sort-Object Rel
    )

    foreach ($file in $files) {
        Copy-File -Source $file.Full -Destination (Join-Path $Docs $file.Rel) -Label $file.Rel
    }
}

if (-not $NoSkills) { Install-Skills }
if ($wantDocs)      { Scaffold-Docs }

Say ''
if ($DryRun) {
    Say "Summary: $script:Would would create, $script:Skipped skipped, $script:Failed failed. Nothing was written."
} else {
    Say "Summary: $script:Created created, $script:Skipped skipped, $script:Failed failed."
}

if ($script:Failed -gt 0) { exit 1 }
exit 0
