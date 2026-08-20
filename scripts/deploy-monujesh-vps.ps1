param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9][a-z0-9-]+$')]
  [string]$ReleaseName,

  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string[]]$Files
)

$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sshKey = '.private\monujesh_cooppilot_vps_ed25519'
$knownHosts = '.private\known_hosts'
$remote = 'monujesh@191.218.161.202'
$archive = Join-Path $workspace ".private\cooppilot-$ReleaseName-patch.tar.gz"
$remoteArchive = "/tmp/cooppilot-$ReleaseName-patch.tar.gz"
$deployLog = "/tmp/$ReleaseName-deploy.log"
$orchestrator = Join-Path $workspace 'scripts\vps-release-orchestrator.sh'

if ($Files.Count -eq 1 -and $Files[0].Contains(',')) {
  $Files = @($Files[0].Split(',', [System.StringSplitOptions]::RemoveEmptyEntries))
}

foreach ($relativePath in $Files) {
  $resolved = Resolve-Path -LiteralPath (Join-Path $workspace $relativePath)
  if (-not $resolved.Path.StartsWith($workspace, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Deployment file is outside the workspace: $relativePath"
  }
}

Push-Location $workspace
try {
  & tar -czf $archive @Files
  if ($LASTEXITCODE -ne 0) { throw 'Failed to create deployment archive.' }

  $sourceOutput = & ssh -i $sshKey -o "UserKnownHostsFile=$knownHosts" $remote 'readlink -f /home/monujesh/apps/cooppilot/current'
  if ($LASTEXITCODE -ne 0 -or -not $sourceOutput) { throw 'Unable to resolve the active source release.' }
  $sourcePath = ($sourceOutput -join '').Trim()
  $sourceRelease = Split-Path -Leaf $sourcePath
  if (-not $sourceRelease) { throw 'Unable to resolve the active source release.' }

  & scp -i $sshKey -o "UserKnownHostsFile=$knownHosts" $archive "${remote}:$remoteArchive"
  if ($LASTEXITCODE -ne 0) { throw 'Failed to upload deployment archive.' }

  & scp -i $sshKey -o "UserKnownHostsFile=$knownHosts" $orchestrator "${remote}:/tmp/vps-release-orchestrator.sh"
  if ($LASTEXITCODE -ne 0) { throw 'Failed to upload the release orchestrator.' }

  $deployCommand = "nohup bash /tmp/vps-release-orchestrator.sh '$ReleaseName' '$sourceRelease' >'$deployLog' 2>&1 &"
  & ssh -i $sshKey -o "UserKnownHostsFile=$knownHosts" $remote $deployCommand
  if ($LASTEXITCODE -ne 0) { throw 'Failed to start the remote deployment.' }

  $deployed = $false
  for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
    Start-Sleep -Seconds 5
    $tail = & ssh -i $sshKey -o "UserKnownHostsFile=$knownHosts" $remote "tail -n 10 '$deployLog'"
    if ($tail -match "DEPLOYED_RELEASE=$ReleaseName") {
      $deployed = $true
      break
    }
    if ($tail -match '(npm error|Build failed|Failed to compile|Post-deployment health check failed)') {
      throw "Remote deployment failed:`n$($tail -join "`n")"
    }
  }
  if (-not $deployed) { throw "Remote deployment did not complete in five minutes. Inspect $deployLog." }

  Write-Output "DEPLOYED_RELEASE=$ReleaseName"
  Write-Output 'HEALTH_HTTP=200'
} finally {
  Pop-Location
}
