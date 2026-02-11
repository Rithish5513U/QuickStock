import { ScrollView, StyleSheet } from 'react-native';
import ChipButton from './ChipButton';
import { Spacing } from '../constants/spacing';

interface ChipGroupProps {
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
  horizontal?: boolean;
}

export default function ChipGroup({ options, selectedValue, onSelect, horizontal = true }: ChipGroupProps) {
  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
        {options.map(option => (
          <ChipButton
            key={option.value}
            label={option.label}
            active={selectedValue === option.value}
            onPress={() => onSelect(option.value)}
            style={styles.item}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <>
      {options.map(option => (
        <ChipButton
          key={option.value}
          label={option.label}
          active={selectedValue === option.value}
          onPress={() => onSelect(option.value)}
          style={styles.verticalItem}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  horizontal: {
    flexDirection: 'row',
  },
  item: {
    marginRight: Spacing.sm,
  },
  verticalItem: {
    marginBottom: Spacing.sm,
  },
});
