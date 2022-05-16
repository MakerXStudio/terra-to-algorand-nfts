<#
    .SYNOPSIS
        Algorand dev environment reset.
    .DESCRIPTION
        This tears down and reinstalls the dev environment.
    .EXAMPLE
        ./reset.ps1
        This resets and recreates everything
#>
[CmdletBinding(SupportsShouldProcess = $true)]
Param()

#Requires -Version 7.0.0
Set-StrictMode -Version "Latest"
$ErrorActionPreference = "Stop"

function Test-ThrowIfNotSuccessful() {
  if ($LASTEXITCODE -ne 0) {
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

function Remove-Folder([string] $foldername) {
  if (Test-Path $foldername) { Remove-Item -LiteralPath $foldername -Force -Recurse }
}

if ($PSCmdlet.ShouldProcess("Clear environment")) {

  Write-Header "Stopping containers"
  docker-compose stop
  Test-ThrowIfNotSuccessful
  Write-Header "Deleting containers"
  docker-compose down
  Test-ThrowIfNotSuccessful
  docker-compose rm -f
  Test-ThrowIfNotSuccessful
  Write-Header "Deleting node_modules"
  Remove-Folder "minter/node_modules"
  Write-Header "Deleting build"
  Remove-Folder "minter/build"
  Write-Header "Re-setting up environment"
  & ./setup.ps1
}
