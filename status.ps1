Write-Host "=== Algod status"
./goal.ps1 node status
Write-Host
Write-Host "=== Indexer status"
curl -s "localhost:8980/health?pretty"
Write-Host
