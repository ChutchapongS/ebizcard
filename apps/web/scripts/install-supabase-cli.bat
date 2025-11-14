@echo off
echo Installing Supabase CLI for Windows...

REM Create directory for Supabase CLI
if not exist "%USERPROFILE%\supabase-cli" mkdir "%USERPROFILE%\supabase-cli"

REM Download Supabase CLI
echo Downloading Supabase CLI...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip' -OutFile '%USERPROFILE%\supabase-cli\supabase.zip'"

REM Extract the zip file
echo Extracting...
powershell -Command "Expand-Archive -Path '%USERPROFILE%\supabase-cli\supabase.zip' -DestinationPath '%USERPROFILE%\supabase-cli' -Force"

REM Add to PATH (temporary for current session)
set PATH=%PATH%;%USERPROFILE%\supabase-cli

REM Test installation
echo Testing installation...
supabase --version

echo.
echo Supabase CLI installed successfully!
echo To make it permanent, add %USERPROFILE%\supabase-cli to your PATH environment variable.
echo.
echo Next steps:
echo 1. supabase login
echo 2. supabase link --project-ref eccyqifrzipzrflkcdkd
echo 3. supabase functions deploy update-profile --project-ref eccyqifrzipzrflkcdkd
