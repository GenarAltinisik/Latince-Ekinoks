$gitExe = "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe"

if (!(Test-Path $gitExe)) {
    Write-Error "Git not found at $gitExe"
    exit 1
}

Write-Host "Using Git from: $gitExe"
& $gitExe init
& $gitExe config user.name "Latince Ekinoks"
& $gitExe config user.email "filoloji@latince-ekinoks.local"
& $gitExe add .
& $gitExe commit -m "Ilk surum: Latince Ekinoks"
& $gitExe branch -M main
& $gitExe status
