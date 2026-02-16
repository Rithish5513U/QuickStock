import { Modal, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Typography from './Typography';
import Icon from './Icon';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { mediumScale } from '../constants/size';

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxHeight?: number | `${number}%`;
}

export default function BottomSheetModal({ 
  visible, 
  onClose, 
  title, 
  children,
  maxHeight = '80%'
}: BottomSheetModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.content, { maxHeight }]}>
          <View style={styles.header}>
            <Typography variant="h3">{title}</Typography>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={mediumScale(24)} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: mediumScale(20),
    borderTopRightRadius: mediumScale(20),
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: mediumScale(1),
    borderBottomColor: Colors.background,
  },
  body: {
    padding: Spacing.lg,
  },
});
