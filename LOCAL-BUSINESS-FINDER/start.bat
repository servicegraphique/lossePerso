@echo off
setlocal
cd /d "%~dp0"
title Local Business Finder
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 server.py
  goto :end
)
where python >nul 2>nul
if %errorlevel% equ 0 (
  python server.py
  goto :end
)
echo Python 3 n'est pas installe. Demarrage avec PowerShell, sans installation...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
:end
if errorlevel 1 pause
endlocal
