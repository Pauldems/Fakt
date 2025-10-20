@echo off
REM Exemple d'utilisation du générateur de codes avec authentification

echo 🔑 Exemple d'utilisation du générateur de codes Fakt
echo ===========================================================
echo.

REM ⚠️ IMPORTANT: Modifiez ces valeurs avec vos vrais credentials !
set FIREBASE_ADMIN_EMAIL=admin@example.com
set FIREBASE_ADMIN_PASSWORD=your-secure-password

echo 🔧 Configuration:
echo   Email admin: %FIREBASE_ADMIN_EMAIL%
echo   Mot de passe: [MASQUÉ]
echo.

echo 📋 Commandes d'exemple disponibles:
echo.
echo   1. Générer 5 codes à vie:
echo      node scripts/generateCodesAuth.js lifetime 5
echo.
echo   2. Générer 10 codes annuels:
echo      node scripts/generateCodesAuth.js annual 10
echo.
echo   3. Lister tous les codes:
echo      node scripts/generateCodesAuth.js list
echo.
echo   4. Lister les codes non utilisés:
echo      node scripts/generateCodesAuth.js list "" unused
echo.

REM Décommenter la ligne suivante pour exécuter un exemple
REM node scripts/generateCodesAuth.js trial 1

echo ⚠️  Pour utiliser ce script:
echo    1. Modifiez les variables FIREBASE_ADMIN_EMAIL et FIREBASE_ADMIN_PASSWORD
echo    2. Créez un compte admin dans Firebase Auth avec ces credentials
echo    3. Décommentez une des commandes ci-dessus
echo.
pause