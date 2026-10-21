$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js is required (22+)' }
if (-not (Test-Path '.\node_modules')) {
  Write-Host 'Installing packages once. This step requires access to an npm package source or populated local npm cache.'
  npm install
}
npm run dev
