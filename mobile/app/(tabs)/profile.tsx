import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

const APP_VERSION = '1.0.0'

export default function ProfileScreen() {
  const { user, logout } = useAuth()

  async function handleLogout() {
    const confirmed =
      Platform.OS === 'web'
        ? (globalThis as unknown as { confirm: (m: string) => boolean }).confirm(
            'Are you sure you want to log out?'
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Logout', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ])
          })
    if (!confirmed) return
    await logout()
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + name */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <Text style={styles.displayName}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View
          style={[
            styles.roleBadge,
            user?.role === 'admin' ? styles.roleBadgeAdmin : styles.roleBadgeUser,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              user?.role === 'admin'
                ? styles.roleTextAdmin
                : styles.roleTextUser,
            ]}
          >
            {user?.role?.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Info section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.fullName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
              {user?.role}
            </Text>
          </View>
        </View>
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>Expo / React Native</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeAdmin: {
    backgroundColor: '#f3e8ff',
  },
  roleBadgeUser: {
    backgroundColor: '#eef2ff',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roleTextAdmin: {
    color: '#7c3aed',
  },
  roleTextUser: {
    color: '#4f46e5',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
  },
})
