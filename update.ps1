<#
    .SYNOPSIS
        Algorand environment update.
    .DESCRIPTION
        The goal of this script is that when you pull changes or restart your computer you can quickly get everything to a running state.
    .EXAMPLE
        ./update.ps1
#>

#Requires -Version 7.0.0
Set-StrictMode -Version "Latest"
$ErrorActionPreference = "Stop"

function Test-ThrowIfNotSuccessful() {
  if ($LASTEXITCODE -ne 0) {
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

Push-Location $PSScriptRoot

Write-Header "Start / update docker containers"
& docker-compose down
& docker-compose pull
& docker-compose up -d

Write-Header "Install npm packages"
Start-Process "npm" -ArgumentList "install" -WorkingDirectory "minter" -Wait -NoNewWindow -PassThru

Pop-Location
