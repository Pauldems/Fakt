@echo off
echo Nettoyage du cache...
if exist "%TEMP%\metro-cache" rmdir /s /q "%TEMP%\metro-cache"
if exist ".expo" rmdir /s /q ".expo"

echo.
echo Démarrage de l'application en mode web...
echo.
npx expo start --web --clear
pause