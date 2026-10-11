$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$toolRoot = Join-Path $projectRoot '.android-build'
$sdkRoot = Join-Path $toolRoot 'sdk'
$jdkRoot = Join-Path $toolRoot 'jdk'
$buildRoot = Join-Path $toolRoot 'app'
$outputRoot = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Force -Path $toolRoot,$sdkRoot,$jdkRoot,$buildRoot,$outputRoot | Out-Null

function Run-Checked($binary, $arguments) {
    & $binary @arguments
    if ($LASTEXITCODE -ne 0) { throw "$binary failed with exit code $LASTEXITCODE" }
}

if (-not (Get-ChildItem -LiteralPath $jdkRoot -Filter javac.exe -Recurse -ErrorAction SilentlyContinue)) {
    Write-Output 'Downloading portable Java build tools...'
    $jdkZip = Join-Path $toolRoot 'jdk.zip'
    Run-Checked 'curl.exe' @('-fL','--retry','3','--silent','--show-error','https://aka.ms/download-jdk/microsoft-jdk-21-windows-x64.zip','-o',$jdkZip)
    Expand-Archive -LiteralPath $jdkZip -DestinationPath $jdkRoot -Force
}
$compiler = Get-ChildItem -LiteralPath $jdkRoot -Filter javac.exe -Recurse | Select-Object -First 1
$javaRoot = Split-Path -Parent (Split-Path -Parent $compiler.FullName)
$env:JAVA_HOME = $javaRoot
$env:PATH = (Join-Path $javaRoot 'bin') + ';' + $env:PATH
$manager = Join-Path $sdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat'
if (-not (Test-Path -LiteralPath $manager)) {
    Write-Output 'Downloading Android command-line tools...'
    $sdkZip = Join-Path $toolRoot 'commandline.zip'
    Run-Checked 'curl.exe' @('-fL','--retry','3','--silent','--show-error','https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip','-o',$sdkZip)
    $extractRoot = Join-Path $toolRoot 'commandline-extracted'
    Expand-Archive -LiteralPath $sdkZip -DestinationPath $extractRoot -Force
    $moveSource = [IO.Path]::GetFullPath((Join-Path $extractRoot 'cmdline-tools'))
    $moveTarget = [IO.Path]::GetFullPath((Join-Path $sdkRoot 'cmdline-tools\latest'))
    $safeRoot = [IO.Path]::GetFullPath($toolRoot) + [IO.Path]::DirectorySeparatorChar
    if (-not $moveSource.StartsWith($safeRoot) -or -not $moveTarget.StartsWith($safeRoot)) { throw 'Tool paths leave the project build folder.' }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $moveTarget) | Out-Null
    Move-Item -LiteralPath $moveSource -Destination $moveTarget
}
$androidJar = Join-Path $sdkRoot 'platforms\android-35\android.jar'
$buildTools = Join-Path $sdkRoot 'build-tools\35.0.0'
if (-not (Test-Path -LiteralPath $androidJar) -or -not (Test-Path -LiteralPath (Join-Path $buildTools 'aapt2.exe'))) {
    Write-Output 'Accepting the approved Android SDK licenses and downloading compiler packages...'
    (1..100 | ForEach-Object { 'y' }) | & $manager "--sdk_root=$sdkRoot" 'platforms;android-35' 'build-tools;35.0.0'
    if ($LASTEXITCODE -ne 0) { throw 'SDK package setup failed.' }
}

$assetsRoot = Join-Path $buildRoot 'assets'
$classRoot = Join-Path $buildRoot 'classes'
$dexRoot = Join-Path $buildRoot 'dex'
New-Item -ItemType Directory -Force -Path $assetsRoot,$classRoot,$dexRoot | Out-Null
foreach ($asset in @('index.html','style.css','script.js','camera-controls.js','app-ui.js')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $asset) -Destination $assetsRoot -Force
}
$sourceFile = Join-Path $PSScriptRoot 'src\com\dsvisualizer\cameratest\MainActivity.java'
Write-Output 'Compiling Android camera wrapper...'
Run-Checked $compiler.FullName @('-encoding','UTF-8','-source','8','-target','8','-classpath',$androidJar,'-d',$classRoot,$sourceFile)
$classesJar = Join-Path $buildRoot 'classes.jar'
Run-Checked (Join-Path $javaRoot 'bin\jar.exe') @('cf',$classesJar,'-C',$classRoot,'.')
Run-Checked (Join-Path $buildTools 'd8.bat') @('--lib',$androidJar,'--min-api','24','--output',$dexRoot,$classesJar)
$unsigned = Join-Path $buildRoot 'unsigned.apk'
$resources = Join-Path $buildRoot 'resources.zip'
Run-Checked (Join-Path $buildTools 'aapt2.exe') @('compile','--dir',(Join-Path $PSScriptRoot 'res'),'-o',$resources)
Run-Checked (Join-Path $buildTools 'aapt2.exe') @('link','-I',$androidJar,'--manifest',(Join-Path $PSScriptRoot 'AndroidManifest.xml'),'-A',$assetsRoot,'-o',$unsigned,$resources)
Run-Checked (Join-Path $javaRoot 'bin\jar.exe') @('uf',$unsigned,'-C',$dexRoot,'classes.dex')
$aligned = Join-Path $buildRoot 'aligned.apk'
Run-Checked (Join-Path $buildTools 'zipalign.exe') @('-f','4',$unsigned,$aligned)
$keyFile = Join-Path $toolRoot 'test-signing.keystore'
if (-not (Test-Path -LiteralPath $keyFile)) {
    Run-Checked (Join-Path $javaRoot 'bin\keytool.exe') @('-genkeypair','-keystore',$keyFile,'-storepass','android','-keypass','android','-alias','ds-test','-keyalg','RSA','-keysize','2048','-validity','3650','-dname','CN=DS Visualizer Test','-noprompt')
}
$apk = Join-Path $outputRoot 'DS-Studio-1.1.apk'
Run-Checked (Join-Path $buildTools 'apksigner.bat') @('sign','--ks',$keyFile,'--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,$aligned)
Run-Checked (Join-Path $buildTools 'apksigner.bat') @('verify','--verbose',$apk)
Run-Checked (Join-Path $buildTools 'aapt2.exe') @('dump','badging',$apk)
Write-Output "APK ready: $apk"
