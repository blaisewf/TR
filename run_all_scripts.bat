@echo off
echo Running all Python scripts in the scripts folder...
echo.

cd /d "%~dp0"

for %%f in (scripts\*.py) do (
    echo Running %%f...
    python "%%f"
    if errorlevel 1 (
        echo Error running %%f
        pause
        exit /b 1
    )
    echo %%f completed successfully.
    echo.
)

echo All scripts completed successfully!
pause
