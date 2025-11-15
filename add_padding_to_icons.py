#!/usr/bin/env python3
"""
Script pour ajouter du padding blanc autour des icônes de l'app
"""
from PIL import Image
import os

def add_padding_to_icon(input_path, output_path, scale_factor=0.7):
    """
    Réduit l'icône et ajoute du padding blanc autour

    Args:
        input_path: Chemin de l'icône originale
        output_path: Chemin de sauvegarde
        scale_factor: Facteur de réduction (0.7 = 70% de la taille originale)
    """
    # Ouvrir l'image
    img = Image.open(input_path)
    original_size = img.size

    # Calculer la nouvelle taille du logo
    new_width = int(original_size[0] * scale_factor)
    new_height = int(original_size[1] * scale_factor)

    # Réduire le logo
    img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

    # Créer une nouvelle image blanche de la taille originale
    new_img = Image.new('RGBA', original_size, (255, 255, 255, 255))

    # Calculer la position pour centrer le logo réduit
    x = (original_size[0] - new_width) // 2
    y = (original_size[1] - new_height) // 2

    # Coller le logo réduit au centre
    new_img.paste(img_resized, (x, y), img_resized if img_resized.mode == 'RGBA' else None)

    # Sauvegarder
    new_img.save(output_path, 'PNG')
    print(f'✅ {output_path} créé avec succès')

# Liste des icônes à traiter
icons = [
    'assets/icon.png',
    'assets/adaptive-icon.png',
    'assets/splash-icon.png',
    'assets/favicon.png'
]

# Créer des backups d'abord
print('📦 Création des backups...')
for icon_path in icons:
    if os.path.exists(icon_path):
        backup_path = icon_path.replace('.png', '.backup.png')
        img = Image.open(icon_path)
        img.save(backup_path)
        print(f'   Backup: {backup_path}')

print('\n🎨 Application du padding...')
for icon_path in icons:
    if os.path.exists(icon_path):
        add_padding_to_icon(icon_path, icon_path, scale_factor=0.7)

print('\n✨ Terminé ! Les icônes ont été mises à jour avec plus de padding blanc.')
print('💡 Les fichiers originaux sont sauvegardés en .backup.png')
