import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';


export type TemplateType = 'modern' | 'classic' | 'minimal' | 'original';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
  preview: any; // Image de preview
  colors: string[];
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Moderne',
    description: 'Design coloré avec gradient violet, parfait pour un style contemporain',
    preview: require('../assets/template-previews/Moderne.jpg'),
    colors: ['#667eea', '#764ba2'],
  },
  {
    id: 'classic',
    name: 'Classique',
    description: 'Style traditionnel noir et blanc, idéal pour un look professionnel',
    preview: require('../assets/template-previews/Classique.jpg'),
    colors: ['#000000', '#333333'],
  },
  {
    id: 'minimal',
    name: 'Minimaliste',
    description: 'Design épuré avec peu d\'ornements, focus sur l\'essentiel',
    preview: require('../assets/template-previews/Minimaliste.jpg'),
    colors: ['#666666', '#999999'],
  },
  {
    id: 'original',
    name: 'Original',
    description: 'Template bleu turquoise utilisé par défaut',
    preview: require('../assets/template-previews/Original.jpg'),
    colors: ['#1a6b7a', '#7fc8d6'],
  },
];

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  const navigation = useNavigation<any>();

  const handlePreview = (template: Template) => {
    // Naviguer vers le viewer avec l'image du template
    navigation.navigate('PDFViewer', {
      templateImage: template.preview,
      invoiceNumber: `Aperçu - ${template.name}`,
      isPreview: true
    });
  };



  return (
    <View style={styles.container}>
      <View style={styles.headerWithIcon}>
        <Ionicons name="brush-outline" size={24} color="#003580" />
        <Text style={styles.sectionTitle}>Style de facture</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Choisissez le design qui correspond à votre image
      </Text>
      
      <View style={styles.templatesGrid}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate === template.id && styles.templateCardSelected
            ]}
            onPress={() => onSelectTemplate(template.id)}
          >
            <View style={styles.templatePreview}>
              <Image 
                source={template.preview} 
                style={styles.templatePreviewImage}
                resizeMode="cover"
              />
            </View>
            
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
            </View>
            
            <View style={styles.templateActions}>
              {selectedTemplate === template.id && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#003580" />
                  <Text style={styles.selectedText}>Sélectionné</Text>
                </View>
              )}
              <View style={styles.previewButtons}>
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={() => handlePreview(template)}
                >
                  <Ionicons name="eye-outline" size={16} color="#003580" />
                  <Text style={styles.previewButtonText}>Aperçu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  headerWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001A40',
    marginLeft: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 20,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: '48%',
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    borderWidth: 2,
    borderColor: '#BBDEFB',
  },
  templateCardSelected: {
    borderColor: '#003580',
    borderWidth: 3,
  },
  templatePreview: {
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#BBDEFB',
  },
  templatePreviewImage: {
    width: '100%',
    height: '100%',
  },
  templateInfo: {
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#001A40',
    marginBottom: 4,
  },
  templateActions: {
    flexDirection: 'column',
    gap: 8,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  selectedText: {
    fontSize: 12,
    color: '#003580',
    marginLeft: 4,
    fontWeight: '600',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  previewButtonText: {
    fontSize: 12,
    color: '#003580',
    marginLeft: 4,
  },
});
