import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface DatePickerProps {
  value?: string; // Format JJ/MM/AAAA
  onDateChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = "Sélectionner une date",
  label,
  error,
  style
}) => {
  const { theme } = useTheme();
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
  };

  const generateCalendarDays = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const startingDayOfWeek = firstDay.getDay() || 7;
    
    const days = [];
    
    // Ajouter les jours vides du début
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter tous les jours du mois
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, monthIndex, i));
    }
    
    return days;
  };

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDate(date);
    onDateChange(formattedDate);
    setIsCalendarVisible(false);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    if (!value) return false;
    const formattedDate = formatDate(date);
    return formattedDate === value;
  };

  return (
    <View style={style}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          { borderColor: error ? theme.colors.red500 : theme.border.light },
          { backgroundColor: theme.surface.primary }
        ]}
        onPress={() => setIsCalendarVisible(true)}
      >
        <Text style={[
          styles.dateText,
          { color: value ? theme.text.primary : theme.text.secondary }
        ]}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={theme.text.secondary} />
      </TouchableOpacity>

      {error && <Text style={[styles.error, { color: theme.colors.red500 }]}>{error}</Text>}

      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface.primary }]}>
            
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
              <TouchableOpacity onPress={() => setIsCalendarVisible(false)}>
                <Ionicons name="close" size={24} color={theme.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Sélectionner une date
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Navigation du mois */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => changeMonth('prev')}>
                <Ionicons name="chevron-back" size={24} color={theme.text.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.monthTitle, { color: theme.text.primary }]}>
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </Text>
              
              <TouchableOpacity onPress={() => changeMonth('next')}>
                <Ionicons name="chevron-forward" size={24} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Jours de la semaine */}
            <View style={styles.weekDaysContainer}>
              {dayNames.map((day, index) => (
                <View key={index} style={styles.weekDayCell}>
                  <Text style={[styles.weekDayText, { color: theme.text.secondary }]}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Grille des jours */}
            <View style={styles.daysGrid}>
              {generateCalendarDays(currentMonth).map((date, index) => (
                <View key={index} style={styles.dayCell}>
                  {date ? (
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        { backgroundColor: theme.surface.secondary },
                        { borderColor: theme.border.light },
                        isSelectedDate(date) && { backgroundColor: theme.primary },
                        isToday(date) && !isSelectedDate(date) && { borderColor: theme.primary }
                      ]}
                      onPress={() => handleDateSelect(date)}
                    >
                      <Text style={[
                        styles.dayText,
                        { color: theme.text.primary },
                        isSelectedDate(date) && { color: 'white', fontWeight: '600' },
                        isToday(date) && !isSelectedDate(date) && { color: theme.primary, fontWeight: '600' }
                      ]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.emptyDay} />
                  )}
                </View>
              ))}
            </View>

            {/* Bouton Aujourd'hui */}
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: theme.primary }]}
              onPress={() => handleDateSelect(new Date())}
            >
              <Text style={styles.todayButtonText}>Aujourd'hui</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#003580',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 48,
  },
  dateText: {
    fontSize: 16,
    flex: 1,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 16,
  },
  emptyDay: {
    flex: 1,
  },
  todayButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  todayButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});