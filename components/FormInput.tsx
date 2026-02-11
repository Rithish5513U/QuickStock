import { View, TextInput, StyleSheet, Text, TextInputProps } from 'react-native';
import Typography from './Typography';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface FormInputProps extends TextInputProps {
  label: string;
  required?: boolean;
  error?: string;
}

export default function FormInput({ 
  label, 
  required = false, 
  error,
  style,
  ...inputProps 
}: FormInputProps) {
  return (
    <View style={styles.container}>
      <Typography variant="body" style={styles.label}>
        {label}{required && ' *'}
      </Typography>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style
        ]}
        placeholderTextColor={Colors.textLight}
        {...inputProps}
      />
      {error && (
        <Typography variant="caption" color={Colors.danger} style={styles.error}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    marginTop: Spacing.xs,
  },
});
