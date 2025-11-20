import React from 'react';
import { Card as PaperCard } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 2,
}) => {
  return (
    <PaperCard
      style={[styles.card, style]}
      elevation={elevation}
      onPress={onPress}
    >
      <PaperCard.Content>{children}</PaperCard.Content>
    </PaperCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
