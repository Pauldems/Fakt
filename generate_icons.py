#!/usr/bin/env python3
"""
Script pour générer les icônes de l'app Fakt avec padding correct
"""

from PIL import Image
import os

# Configuration
INPUT_ICON = "assets/icon.png"
OUTPUT_DIR = "assets"
BACKGROUND_COLOR = (255, 255, 255)  # Blanc
PADDING_PERCENT = 5  # 5% de padding de chaque côté (logo = 90% du carré)

# Tailles à générer
SIZES = {
    "icon.png": 1024,           # App icon principal
    "adaptive-icon.png": 1024,  # Android adaptive icon
    "favicon.png": 48,          # Web favicon
    "splash-icon.png": 512,     # Splash screen
}

def generate_icon(input_path, output_path, size, padding_percent, bg_color):
    """Génère une icône carrée avec padding"""

    # Ouvrir l'image originale
    original = Image.open(input_path).convert("RGBA")

    # Calculer la taille du logo (avec padding)
    padding_ratio = padding_percent / 100
    logo_size = int(size * (1 - 2 * padding_ratio))

    # Redimensionner le logo en gardant le ratio
    original_ratio = original.width / original.height
    if original_ratio > 1:
        # Plus large que haut
        new_width = logo_size
        new_height = int(logo_size / original_ratio)
    else:
        # Plus haut que large
        new_height = logo_size
        new_width = int(logo_size * original_ratio)

    logo = original.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Créer le fond carré
    background = Image.new("RGBA", (size, size), bg_color + (255,))

    # Calculer la position pour centrer le logo
    x = (size - new_width) // 2
    y = (size - new_height) // 2

    # Coller le logo sur le fond
    background.paste(logo, (x, y), logo)

    # Sauvegarder
    # Pour icon.png et adaptive-icon.png, garder RGBA
    # Pour les autres, convertir en RGB si pas de transparence nécessaire
    if output_path.endswith(("icon.png", "adaptive-icon.png")):
        background.save(output_path, "PNG")
    else:
        background.save(output_path, "PNG")

    print(f"✅ {output_path} ({size}x{size}) généré")

def main():
    print("🎨 Génération des icônes Fakt...")
    print(f"   Padding: {PADDING_PERCENT}%")
    print(f"   Couleur fond: #{BACKGROUND_COLOR[0]:02x}{BACKGROUND_COLOR[1]:02x}{BACKGROUND_COLOR[2]:02x}")
    print()

    if not os.path.exists(INPUT_ICON):
        print(f"❌ Fichier {INPUT_ICON} non trouvé!")
        return

    for filename, size in SIZES.items():
        output_path = os.path.join(OUTPUT_DIR, filename)
        generate_icon(INPUT_ICON, output_path, size, PADDING_PERCENT, BACKGROUND_COLOR)

    print()
    print("🎉 Toutes les icônes ont été générées!")
    print("   Relance 'npx expo start' pour voir les changements")

if __name__ == "__main__":
    main()
