import React from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  style?: ViewStyle;
  mode?: 'flat' | 'outlined';
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  disabled = false,
  error = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
  mode = 'outlined',
}) => {
  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      mode={mode}
      style={[styles.input, style]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginVertical: 8,
  },
});
