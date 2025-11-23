@echo off
REM Unregister .spk file extension from Windows
REM Run as Administrator

echo Unregistering .spk file extension...

REM Remove file association
reg delete "HKEY_CLASSES_ROOT\.spk" /f 2>nul
reg delete "HKEY_CLASSES_ROOT\Spectra.Preset" /f 2>nul

echo.
echo .spk file extension unregistered successfully!
echo.
pause
