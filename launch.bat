@echo off
REM ==============================================================================
REM iDentify - DepEd Multi-Tenant School Management & Attendance SaaS Launcher
REM Windows CMD / PowerShell Wrapper
REM ==============================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Launch script encountered an error. Press any key to exit.
    pause >nul
)
