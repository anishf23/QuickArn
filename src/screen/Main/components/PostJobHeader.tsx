import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../../theme/AppTheme';
import { rf } from '../../../utils/responsive';

type PostJobHeaderProps = {
  onBack: () => void;
};

function PostJobHeader({ onBack }: PostJobHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={styles.backButton}
      >
        <Image
          source={require('../../../../images/back.png')}
          style={[styles.backIcon]}
          resizeMode="contain"
        />
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>Post a Job</Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  backIcon: { height: 20, width: 20 },
  header: { alignItems: 'center', borderBottomColor: '#E5E7EB', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 48, justifyContent: 'space-between', paddingHorizontal: 3 },
  spacer: { width: 36 },
  title: { fontSize: rf(14), fontWeight: '800' },
});

export default PostJobHeader;
