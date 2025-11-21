import React, { useState } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  label: string;
  value: string; // ISO date string
  onChangeDate: (date: string) => void;
  error?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChangeDate,
  error,
  required = false,
}) => {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const onChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setDate(selectedDate);
      // Format as YYYY-MM-DD
      const formatted = selectedDate.toISOString().split('T')[0];
      onChangeDate(formatted);
    }
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString();
  };

  if (Platform.OS === 'web') {
    // On web, use native HTML5 date input
    return (
      <View style={styles.container}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        <input
          type="date"
          value={value}
          onChange={(e) => onChangeDate(e.target.value)}
          style={{
            padding: 12,
            fontSize: 16,
            borderWidth: 1,
            borderColor: error ? '#d32f2f' : '#ccc',
            borderRadius: 4,
            width: '100%',
            fontFamily: 'inherit',
          }}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  // On mobile, use native date picker
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showDatepicker}>
        <TextInput
          label={label}
          value={formatDisplayDate(value)}
          editable={false}
          right={<TextInput.Icon icon="calendar" onPress={showDatepicker} />}
          error={!!error}
        />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
      
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
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
  required: {
    color: '#d32f2f',
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
});
