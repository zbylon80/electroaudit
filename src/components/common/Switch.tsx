import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Switch as PaperSwitch, Text } from 'react-native-paper';

interface SwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  value,
  onValueChange,
  disabled = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <PaperSwitch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingVertical: 4,
  },
  label: {
    flex: 1,
    marginRight: 16,
  },
});
