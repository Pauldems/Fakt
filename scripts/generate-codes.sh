#!/bin/bash

# Script shell pour générer des codes d'activation
# Usage: ./generate-codes.sh [type] [count]

# Configuration des variables d'environnement
# Modifiez ces valeurs avec vos vrais credentials admin
export FIREBASE_ADMIN_EMAIL=${FIREBASE_ADMIN_EMAIL:-"admin@example.com"}
export FIREBASE_ADMIN_PASSWORD=${FIREBASE_ADMIN_PASSWORD:-"your-admin-password"}

echo "🔑 Générateur de codes d'activation BookingFakt"
echo "==============================================="
echo ""

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé ou n'est pas dans le PATH"
    echo "💡 Veuillez installer Node.js depuis https://nodejs.org/"
    exit 1
fi

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

# Vérifier si le script existe
if [ ! -f "$SCRIPT_DIR/generateCodesAuth.js" ]; then
    echo "❌ Le script generateCodesAuth.js n'existe pas"
    echo "💡 Assurez-vous d'être dans le bon répertoire"
    exit 1
fi

echo "🔐 Email admin: $FIREBASE_ADMIN_EMAIL"
echo "📁 Répertoire: $SCRIPT_DIR"
echo ""

# Exécuter le script Node.js avec les paramètres
node "$SCRIPT_DIR/generateCodesAuth.js" "$@"