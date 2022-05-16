<#
    .SYNOPSIS
        Algorand dev environment setup.
    .DESCRIPTION
        The goal of this script is that every dev can go from clean (or dirty :P) machine -> clone -> setup.ps1 -> open in IDE -> F5 debugging in minutes, cross-platform.
        If you find problems with your local environment after running this (or during running this!) be sure to contribute fixes :)
        This script is idempotent nadn re-entrant; you can safely execute it multiple times.

        Pre-requisite: You have Docker, Docker Compose and Node 16+ installed.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
Param()

#Requires -Version 7.0.0
Set-StrictMode -Version "Latest"
$ErrorActionPreference = "Stop"

###############################################################################################################
###############################################################################################################
###############################################################################################################

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

Push-Location $PSScriptRoot

# Start up docker containers
Write-Header "Start docker containers"
& docker-compose up -d
Test-ThrowIfNotSuccessful

# Install various npm dependencies
Write-Header "npm install"
$process = Start-Process "npm" -ArgumentList "install" -WorkingDirectory "minter" -Wait -NoNewWindow -PassThru
Test-ThrowIfNotSuccessful -exitCode $process.ExitCode

# Check status of key dependencies
Write-Header "Checking status of Algorand sandbox and localstack"
& ./status.ps1
Test-ThrowIfNotSuccessful

Pop-Location
