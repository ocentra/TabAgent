# MediaPipe Recursive Download Script
$baseUrl = "https://registry.npmjs.org/@mediapipe/tasks-genai/0.10.25"
$outputDir = "E:\Desktop\TabAgent\src\assets\mediapipe"

Write-Host "Starting recursive MediaPipe download..." -ForegroundColor Green

# Create output directory
New-Item -ItemType Directory -Path $outputDir -Force

# Function to recursively download files
function Get-RecursiveContent {
    param (
        [string]$url,
        [string]$localPath
    )
    
    try {
        # Get package info from npm registry
        $response = Invoke-RestMethod -Uri $url
        
        # Ensure local directory exists
        if (-not (Test-Path $localPath)) {
            New-Item -ItemType Directory -Path $localPath -Force | Out-Null
        }
        
         # Handle package tarball
         if ($response.dist) {
             $tarUrl = $response.dist.tarball
             $tarFile = Join-Path -Path $localPath -ChildPath "package.tar.gz"
             Write-Host "Downloading tarball: $tarUrl" -ForegroundColor Cyan
             Invoke-WebRequest -Uri $tarUrl -OutFile $tarFile -ErrorAction Stop
             
             # Extract the tarball
             Write-Host "Extracting tarball..." -ForegroundColor Yellow
             try {
                 # Use 7-Zip if available, otherwise try tar
                 if (Get-Command "7z" -ErrorAction SilentlyContinue) {
                     & 7z x $tarFile -o"$localPath" -y
                 } elseif (Get-Command "tar" -ErrorAction SilentlyContinue) {
                     & tar -xzf $tarFile -C $localPath
                 } else {
                     # Fallback: try PowerShell's built-in extraction
                     Add-Type -AssemblyName System.IO.Compression.FileSystem
                     $tempDir = Join-Path -Path $localPath -ChildPath "temp_extract"
                     New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
                     
                     # First extract .gz, then .tar
                     $gzFile = $tarFile -replace '\.tar\.gz$', '.gz'
                     Copy-Item $tarFile $gzFile
                     
                     # This is a simplified approach - might need more robust handling
                     Write-Warning "Automatic extraction not fully supported. Please extract $tarFile manually."
                 }
                 
                 # Clean up the tarball after extraction
                 Write-Host "Cleaning up tarball..." -ForegroundColor Green
                 Remove-Item $tarFile -Force
                 
                 # Move files from package/ subdirectory to root if it exists
                 $packageDir = Join-Path -Path $localPath -ChildPath "package"
                 if (Test-Path $packageDir) {
                     Write-Host "Moving files from package/ subdirectory..." -ForegroundColor Yellow
                     Get-ChildItem -Path $packageDir -Recurse | ForEach-Object {
                         $relativePath = $_.FullName.Substring($packageDir.Length + 1)
                         $targetPath = Join-Path -Path $localPath -ChildPath $relativePath
                         $targetDir = Split-Path -Path $targetPath -Parent
                         
                         if (-not (Test-Path $targetDir)) {
                             New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
                         }
                         
                         Move-Item -Path $_.FullName -Destination $targetPath -Force
                     }
                     Remove-Item $packageDir -Recurse -Force
                 }
             }
             catch {
                 Write-Warning "Failed to extract tarball: $_"
                 Write-Host "Please extract $tarFile manually" -ForegroundColor Red
             }
         }
        
        # Process _files field if available
        if ($response._files) {
            foreach ($file in $response._files) {
                $fileUrl = "https://unpkg.com/@mediapipe/tasks-genai@0.10.25/$($file.path)"
                $fileLocalPath = Join-Path -Path $localPath -ChildPath $file.path
                $fileDir = Split-Path -Path $fileLocalPath -Parent
                
                if (-not (Test-Path $fileDir)) {
                    New-Item -ItemType Directory -Path $fileDir -Force | Out-Null
                }
                
                Write-Host "Downloading file: $($file.path)" -ForegroundColor Cyan
                try {
                    Invoke-WebRequest -Uri $fileUrl -OutFile $fileLocalPath -ErrorAction Stop
                }
                catch {
                    Write-Warning "Failed to download $($file.path): $_"
                }
            }
        }
    }
    catch {
        Write-Warning "Failed to process $url : $_"
    }
}

# Start download
Get-RecursiveContent -url $baseUrl -localPath $outputDir

Write-Host "Download complete!" -ForegroundColor Green

