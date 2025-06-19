@echo off
setlocal enabledelayedexpansion

echo 🏥 Medical Registry Backend - Environment Setup
echo ==============================================

REM Check if .env file exists
if not exist ".env" (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env >nul
    echo ✅ .env file created!
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file with your actual configuration values
    echo    The default values are for development only.
) else (
    echo ✅ .env file already exists
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    where pnpm >nul 2>&1
    if !errorlevel! equ 0 (
        pnpm install
    ) else (
        where npm >nul 2>&1
        if !errorlevel! equ 0 (
            npm install
        ) else (
            echo ❌ Neither npm nor pnpm found. Please install Node.js and npm.
            pause
            exit /b 1
        )
    )
    echo ✅ Dependencies installed!
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🔍 Checking environment configuration...

if exist ".env" (
    REM Check for required variables in .env file
    set missing_vars=
    
    findstr /c:"DATABASE_URL=" .env >nul || set missing_vars=!missing_vars! DATABASE_URL
    findstr /c:"KEYCLOAK_BASE_URL=" .env >nul || set missing_vars=!missing_vars! KEYCLOAK_BASE_URL
    findstr /c:"KEYCLOAK_REALM=" .env >nul || set missing_vars=!missing_vars! KEYCLOAK_REALM
    findstr /c:"KEYCLOAK_CLIENT_ID=" .env >nul || set missing_vars=!missing_vars! KEYCLOAK_CLIENT_ID
    findstr /c:"KEYCLOAK_CLIENT_SECRET=" .env >nul || set missing_vars=!missing_vars! KEYCLOAK_CLIENT_SECRET
    
    if "!missing_vars!"=="" (
        echo ✅ All required environment variables are present in .env file
    ) else (
        echo ⚠️  Please review these variables in your .env file:
        echo    !missing_vars!
        echo.
        echo Please edit your .env file and set these variables.
    )
)

echo.
echo 🚀 Setup complete! Next steps:
echo    1. Review and update your .env file with proper values
echo    2. Set up your PostgreSQL database
echo    3. Set up your Keycloak instance
echo    4. Run: npm run build
echo    5. Run: npm start
echo.
echo For Docker development:
echo    docker-compose up -d
echo.
echo 📖 See README.md for detailed configuration instructions
echo.
pause
