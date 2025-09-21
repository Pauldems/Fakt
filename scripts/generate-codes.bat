@echo off
REM Script batch pour générer des codes d'activation
REM Usage: generate-codes.bat [type] [count]

REM Configuration des variables d'environnement
REM Modifiez ces valeurs avec vos vrais credentials admin
set FIREBASE_ADMIN_EMAIL=admin@example.com
set FIREBASE_ADMIN_PASSWORD=your-admin-password

echo 🔑 Générateur de codes d'activation BookingFakt
echo ===============================================
echo.

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installé ou n'est pas dans le PATH
    echo 💡 Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier si le script existe
if not exist "%~dp0generateCodesAuth.js" (
    echo ❌ Le script generateCodesAuth.js n'existe pas
    echo 💡 Assurez-vous d'être dans le bon répertoire
    pause
    exit /b 1
)

echo 🔐 Email admin: %FIREBASE_ADMIN_EMAIL%
echo 📁 Répertoire: %~dp0
echo.

REM Exécuter le script Node.js avec les paramètres
node "%~dp0generateCodesAuth.js" %*

REM Pause pour voir les résultats
echo.
pause