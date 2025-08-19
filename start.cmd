@echo off
echo Nettoyage du cache...
rd /s /q "%TEMP%\metro-cache" 2>nul
rd /s /q "%TEMP%\haste-map-*" 2>nul

echo Demarrage d'Expo...
npx expo start --clear