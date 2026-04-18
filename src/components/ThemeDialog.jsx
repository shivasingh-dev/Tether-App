import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useThemeStore from '../Store/useThemeStore';

const { width } = Dimensions.get('window');

const ThemeDialog = ({ visible, onClose }) => {
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';

  const themeOptions = [
    {
      id: 'light',
      label: 'Light',
      icon: 'sun-o',
      iconColor: '#FCD34D',
      description: 'Classic bright interface',
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: 'moon-o',
      iconColor: '#60A5FA',
      description: 'Easy on the eyes',
    },
    {
      id: 'system',
      label: 'System',
      icon: 'mobile',
      iconColor: '#A78BFA',
      description: 'Match your device',
    },
  ];

  const handleThemeSelect = (themeId) => {
    setTheme(themeId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isDark ? styles.lightText : styles.darkText]}>
              Choose Theme
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="times" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Theme Options */}
          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => {
              const isSelected = theme === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.themeOption,
                    isDark ? styles.darkOption : styles.lightOption,
                    isSelected && styles.selectedOption,
                  ]}
                  onPress={() => handleThemeSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.iconContainer, { backgroundColor: `${option.iconColor}20` }]}>
                      <Icon name={option.icon} size={24} color={option.iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={[styles.optionLabel, isDark ? styles.lightText : styles.darkText]}>
                        {option.label}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Icon name="check-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Info Text */}
          <Text style={styles.infoText}>
            Theme changes will apply immediately across the app
          </Text>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  darkContainer: {
    backgroundColor: '#06234f',
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  darkOption: {
    backgroundColor: '#020818',
  },
  lightOption: {
    backgroundColor: '#F3F4F6',
  },
  selectedOption: {
    borderColor: '#10B981',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  checkmark: {
    marginLeft: 12,
  },
  infoText: {
    marginTop: 20,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ThemeDialog;