import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { adminService } from '../../src/services/supabase/admin';
import { colors } from '../../src/theme/colors';

export default function AdminLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      const admin = await adminService.isAdmin(user.id);
      setIsAdmin(admin);

      if (!admin) {
        router.replace('/(tabs)/discover');
      }
    };

    checkAdmin();
  }, [user]);

  if (isAdmin === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Vérification des droits...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const defaultHeaderOptions = {
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: '600' as const },
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Admin Dashboard', headerShown: false }}
      />
      <Stack.Screen
        name="users"
        options={{ title: 'Gestion Utilisateurs', ...defaultHeaderOptions }}
      />
      <Stack.Screen
        name="reports"
        options={{ title: 'Signalements', ...defaultHeaderOptions }}
      />
      <Stack.Screen
        name="stats"
        options={{ title: 'Statistiques', ...defaultHeaderOptions }}
      />
      <Stack.Screen
        name="user-detail"
        options={{ title: 'Détail Utilisateur', ...defaultHeaderOptions }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
