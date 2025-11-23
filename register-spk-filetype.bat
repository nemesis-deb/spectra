@echo off
REM Register .spk file extension with Windows
REM Run as Administrator

echo Registering .spk file extension...

REM Get the current directory where Spectra is installed
set INSTALL_DIR=%~dp0

REM Create file association
reg add "HKEY_CLASSES_ROOT\.spk" /ve /d "Spectra.Preset" /f
reg add "HKEY_CLASSES_ROOT\.spk" /v "Content Type" /d "application/json" /f

REM Create ProgID
reg add "HKEY_CLASSES_ROOT\Spectra.Preset" /ve /d "Spectra Preset File" /f
reg add "HKEY_CLASSES_ROOT\Spectra.Preset\DefaultIcon" /ve /d "%INSTALL_DIR%spk-icon.ico,0" /f

REM Add "Open with Spectra" context menu
reg add "HKEY_CLASSES_ROOT\Spectra.Preset\shell\open" /ve /d "Open with Spectra" /f
reg add "HKEY_CLASSES_ROOT\Spectra.Preset\shell\open\command" /ve /d "\"%INSTALL_DIR%Spectra.exe\" \"%%1\"" /f

echo.
echo .spk file extension registered successfully!
echo Icon: %INSTALL_DIR%spk-icon.ico
echo.
pause
