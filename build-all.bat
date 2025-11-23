@echo off
echo ========================================
echo Building Spectra v1.0.2 for all platforms
echo ========================================
echo.

echo [1/3] Building for Windows...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Windows build failed!
    pause
    exit /b 1
)
echo Windows build complete!
echo.

echo [2/3] Building for macOS...
call npm run build:mac
if %errorlevel% neq 0 (
    echo ERROR: macOS build failed!
    pause
    exit /b 1
)
echo macOS build complete!
echo.

echo [3/3] Building for Linux...
call npm run build:linux
if %errorlevel% neq 0 (
    echo ERROR: Linux build failed!
    pause
    exit /b 1
)
echo Linux build complete!
echo.

echo ========================================
echo All builds completed successfully!
echo ========================================
echo.
echo Installers are in the 'dist' folder:
dir dist /b
echo.
pause
