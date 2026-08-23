import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { LocalizedText as Text } from '../localization/AppLocalization';
import { useAppTheme } from '../theme/AppTheme';

type AlertAction = {
  onPress?: () => void;
  style?: 'cancel' | 'destructive' | 'default';
  text: string;
};

type AlertState = {
  actions: AlertAction[];
  message: string;
  title: string;
};

type CustomAlertContextValue = {
  showAlert: (title: string, message: string, actions?: AlertAction[]) => void;
};

const CustomAlertContext = createContext<CustomAlertContextValue | null>(null);

export function CustomAlertProvider({ children }: PropsWithChildren) {
  const { colors, isDark } = useAppTheme();
  const [alert, setAlert] = useState<AlertState | null>(null);

  const value = useMemo<CustomAlertContextValue>(() => ({
    showAlert: (title, message, actions = [{ text: 'OK' }]) => {
      setAlert({ actions, message, title });
    },
  }), []);

  const closeAlert = (action?: AlertAction) => {
    setAlert(null);
    action?.onPress?.();
  };

  return (
    <CustomAlertContext.Provider value={value}>
      {children}
      <Modal
        animationType="fade"
        onRequestClose={() => closeAlert()}
        transparent
        visible={alert !== null}
      >
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.title, { color: colors.text }]}>{alert?.title}</Text>
            <Text style={[styles.message, { color: colors.textMuted }]}>{alert?.message}</Text>
            <View style={styles.actions}>
              {alert?.actions.map(action => (
                <Pressable
                  key={action.text}
                  accessibilityRole="button"
                  onPress={() => closeAlert(action)}
                  style={[
                    styles.action,
                    action.style === 'cancel' && [styles.secondaryAction, { borderColor: isDark ? '#334155' : '#E2E8F0' }],
                    action.style !== 'cancel' && { backgroundColor: action.style === 'destructive' ? '#E5484D' : colors.primary },
                  ]}
                >
                  <Text style={[styles.actionText, { color: action.style === 'cancel' ? colors.text : '#FFFFFF' }]}>
                    {action.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </CustomAlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);

  if (!context) {
    throw new Error('useCustomAlert must be used inside CustomAlertProvider.');
  }

  return context;
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: 11, flex: 1, justifyContent: 'center', minHeight: 46, paddingHorizontal: 12 },
  actionText: { fontSize: 14, fontWeight: '800' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  card: { borderRadius: 20, elevation: 12, maxWidth: 360, padding: 22, shadowColor: '#0F172A', shadowOffset: { height: 7, width: 0 }, shadowOpacity: 0.2, shadowRadius: 16, width: '88%' },
  message: { fontSize: 14, lineHeight: 20, marginTop: 9 },
  overlay: { alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.48)', flex: 1, justifyContent: 'center', padding: 24 },
  secondaryAction: { backgroundColor: 'transparent', borderWidth: 1 },
  title: { fontSize: 19, fontWeight: '800' },
});
