import React from 'react';
import { List } from 'react-native-paper';
import { StyleSheet, ViewStyle } from 'react-native';

interface ListItemProps {
  title: string;
  description?: string;
  left?: (props: any) => React.ReactNode;
  right?: (props: any) => React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  description,
  left,
  right,
  onPress,
  style,
}) => {
  return (
    <List.Item
      title={title}
      description={description}
      left={left}
      right={right}
      onPress={onPress}
      style={[styles.item, style]}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
  },
});
