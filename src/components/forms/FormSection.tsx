import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Divider } from 'react-native-paper';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Divider style={styles.divider} />
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  content: {
    paddingHorizontal: 4,
  },
});
