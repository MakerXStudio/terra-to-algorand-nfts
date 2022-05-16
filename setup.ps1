<#
    .SYNOPSIS
        Algorand dev environment setup.
    .DESCRIPTION
        The goal of this script is that every dev can go from clean (or dirty :P) machine -> clone -> setup.ps1 -> open in IDE -> F5 debugging in minutes, cross-platform.
        If you find problems with your local environment after running this (or during running this!) be sure to contribute fixes :)
        This script is idempotent nadn re-entrant; you can safely execute it multiple times.

        Pre-requisite: You have Docker and Docker Compose installed.
    .EXAMPLE
        ./setup.ps1
        This executes everything
    .EXAMPLE
        ./setup.ps1 -SkipNode
        This skips the install of nvm and node 16; ensure node 16 is already installed
#>
[CmdletBinding(SupportsShouldProcess = $true)]
Param(
  [Parameter(Mandatory = $false)]
  [switch] $SkipPython = $false,

  [Parameter(Mandatory = $false)]
  [switch] $SkipNode = $false
)

#Requires -Version 7.0.0
Set-StrictMode -Version "Latest"
$ErrorActionPreference = "Stop"

###############################################################################################################
###############################################################################################################
###############################################################################################################

# https://github.com/MRCollective/repave.psm1/blob/master/repave.psm1
function Test-Administrator() {
  $user = [Security.Principal.WindowsIdentity]::GetCurrent();
  return (New-Object Security.Principal.WindowsPrincipal $user).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

# https://github.com/MRCollective/repave.psm1/blob/master/repave.psm1
function Install-Chocolatey() {
  try {
      (Invoke-Expression "choco list -lo") -Replace "^Reading environment variables.+$","" | Set-Variable -Name "installedPackages" -Scope Global
      Write-Output "choco already installed with the following packages:`r`n"
      Write-Output $global:installedPackages
      Write-Output "`r`n"
  }
  catch {
      Write-Output "Installing Chocolatey`r`n"
      Invoke-Expression ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))
      [Environment]::SetEnvironmentVariable("Path", $env:Path + ";c:\programdata\chocolatey\bin", "Process")
      Write-Warning "If the next command fails then restart powershell and run the script again to update the path variables properly`r`n"
  }
}

# https://github.com/MRCollective/repave.psm1/blob/master/repave.psm1
function Install-ChocolateyPackage {
  [CmdletBinding()]
  Param (
      [String] $PackageName,
      [String] $InstallArgs,
      $RunIfInstalled
  )

  if ($global:installedPackages -match "^$PackageName \d") {
      Write-Output "$PackageName already installed`r`n"
  } else {
      if ($InstallArgs -ne $null -and $InstallArgs -ne "") {
          Write-Output "choco install -y $PackageName -InstallArguments ""$InstallArgs""`r`n"
          Invoke-Expression "choco install -y $PackageName -InstallArguments ""$InstallArgs""" | Out-Default
      } else {
          Write-Output "choco install -y $PackageName`r`n"
          Invoke-Expression "choco install -y $PackageName" | Out-Default
      }
      
      $env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)\..\.."
      Import-Module "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
      Update-SessionEnvironment

      if ($null -ne $RunIfInstalled) {
          &$RunIfInstalled
      }
  }
}

function Test-ThrowIfNotSuccessful($exitCode = 0) {
  if ($LASTEXITCODE -ne 0 -or $exitCode -ne 0) {
    Pop-Location
    throw "Error executing last command"
  }
}

function Write-Header([string] $title) {
  Write-Host
  Write-Host "#########################"
  Write-Host "### $title"
  Write-Host "#########################"
  Write-Host
}

###############################################################################################################
###############################################################################################################
###############################################################################################################

$LASTEXITCODE = 0

# Ensure running as admin
Write-Header "Ensuring we are running as admin"
if ($IsWindows -and -not (Test-Administrator)) {
  Write-Error "Re-run as Administrator`r`n"
  exit 1
}

Push-Location $PSScriptRoot

# Start up docker containers
Write-Header "Start docker containers"
& docker-compose up -d
Test-ThrowIfNotSuccessful

if ($IsWindows) {
  Install-Chocolatey
}

if (-not $SkipNode) {
  # Install nvm
  Write-Header "Install nvm"
  if ($IsWindows) {
    Install-ChocolateyPackage -PackageName nvm
  } elseif ($IsMacOS) {
    & brew install nvm

    # proxy nvm commands to a posix subshell
    # source https://github.com/nvm-sh/nvm/issues/2058#issuecomment-735551849
    $ENV:NVM_DIR = "$HOME/.nvm"
    $nvmPrefix = zsh -c "brew --prefix nvm"
    function nvm() {
      $quotedArgs = ($args | ForEach-Object { "'$_'" }) -join ' '
      
      zsh -c "source $nvmPrefix/nvm.sh && nvm $quotedArgs && echo __PATH_AFTER__`$PATH" | Tee-Object -Variable zsh_output | Where-Object { -not ($_ -match "^__PATH_AFTER__") }

      $path_after = $zsh_output | Select-String "^__PATH_AFTER__(.+)"
      if ($path_after) {
        $ENV:PATH = $path_after.Matches.Groups[1].Value
      }
    }
    nvm --version | Out-Null # Load your current nvm path
  } else {
    & curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    Test-ThrowIfNotSuccessful
    source ~/.bashrc
  }

  Test-ThrowIfNotSuccessful

  # Install Node.js 16
  Write-Header "Install Node.js 16.13.2"
  & nvm install 16.13.2
  Test-ThrowIfNotSuccessful
  & nvm use 16.13.2
  Test-ThrowIfNotSuccessful
}

# Set up file permissions for node_modules
Write-Header "Setting up file permissions so normal users can rwx in node_modules (multiple)"
New-Item -ItemType Directory -Force -Path node_modules
New-Item -ItemType Directory -Force -Path minter/node_modules
if ($IsWindows) {
  icacls node_modules /grant everyone:f
  icacls minter/node_modules /grant everyone:f
} else {
  chmod 777 node_modules
  chmod 777 minter/node_modules
}

# Install various npm dependencies
Write-Header "npm install (multiple)"
$process = Start-Process "npm" -ArgumentList "install" -Wait -NoNewWindow -PassThru
Test-ThrowIfNotSuccessful -exitCode $process.ExitCode
$process = Start-Process "npm" -ArgumentList "install" -WorkingDirectory "minter" -Wait -NoNewWindow -PassThru
Test-ThrowIfNotSuccessful -exitCode $process.ExitCode

# Check status of key dependencies
Write-Header "Checking status of Algorand sandbox and localstack"
& ./status.ps1
Test-ThrowIfNotSuccessful

Pop-Location
