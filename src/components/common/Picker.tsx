import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
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

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const selectedItem = items.find((item) => item.value === value);
  const displayValue = selectedItem ? selectedItem.label : placeholder;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            disabled={disabled}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {displayValue}
          </Button>
        }
      >
        {items.map((item) => (
          <Menu.Item
            key={item.value}
            onPress={() => {
              onValueChange(item.value);
              closeMenu();
            }}
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
    justifyContent: 'flex-start',
  },
  buttonContent: {
    justifyContent: 'flex-start',
  },
});
