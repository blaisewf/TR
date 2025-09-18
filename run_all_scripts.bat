@echo off
echo Running all Python scripts in scripts and scripts\evals...
echo.

cd /d "%~dp0"

for %%f in (scripts\*.py scripts\evals\*.py) do (
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
