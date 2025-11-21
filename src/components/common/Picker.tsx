import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Platform, TouchableOpacity } from 'react-native';
import { Menu, Button, Text } from 'react-native-paper';

export interface PickerItem {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  value: string;
  items: PickerItem[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  style?: ViewStyle;
  placeholder?: string;
}

export const Picker: React.FC<PickerProps> = ({
  label,
  value,
  items,
  onValueChange,
  disabled = false,
  style,
  placeholder = 'Select an option',
}) => {
  const [visible, setVisible] = useState(false);

  const openMenu = () => {
    if (!disabled) {
      setVisible(true);
    }
  };
  
  const closeMenu = () => {
    setVisible(false);
  };

  const handleItemPress = (itemValue: string) => {
    // Close menu first
    setVisible(false);
    // Then update value after a small delay to ensure menu is fully closed
    setTimeout(() => {
      onValueChange(itemValue);
    }, 100);
  };

  const selectedItem = items.find((item) => item.value === value);
  const displayValue = selectedItem ? selectedItem.label : placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        contentStyle={styles.menuContent}
        anchor={
          <TouchableOpacity onPress={openMenu} disabled={disabled}>
            <View style={[styles.button, disabled && styles.buttonDisabled]}>
              <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
                {displayValue}
              </Text>
            </View>
          </TouchableOpacity>
        }
      >
        {items.map((item) => (
          <Menu.Item
            key={item.value}
            onPress={() => handleItemPress(item.value)}
            title={item.label}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    marginBottom: 4,
    fontSize: 12,
    opacity: 0.6,
  },
  button: {
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#fff',
    minHeight: 48,
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
  },
  buttonTextDisabled: {
    color: '#999',
  },
  menuContent: {
    maxHeight: 300,
  },
});
