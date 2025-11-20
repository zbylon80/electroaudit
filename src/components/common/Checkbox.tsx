import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Checkbox as PaperCheckbox, Text } from 'react-native-paper';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onPress,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <PaperCheckbox.Android
        status={checked ? 'checked' : 'unchecked'}
        onPress={onPress}
        disabled={disabled}
      />
      <Text style={styles.label} onPress={disabled ? undefined : onPress}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  label: {
    marginLeft: 8,
    flex: 1,
  },
});
