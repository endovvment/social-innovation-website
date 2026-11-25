@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 20.9 or later, then open this file again.
  pause
  exit /b 1
)
if not exist "node_modules\next\dist\bin\next" (
  echo Installing website dependencies. This is only needed on the first run.
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
node.exe scripts\launch-preview.mjs %*
if errorlevel 1 pause
