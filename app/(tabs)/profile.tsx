import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const { state, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Profile
        </ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>
              {state.user?.name?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
          
          <ThemedText type="subtitle" style={styles.userName}>
            {state.user?.name || 'User'}
          </ThemedText>
          
          <ThemedText style={styles.userEmail}>
            {state.user?.email}
          </ThemedText>
        </View>

        <View style={styles.settings}>
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <ThemedText style={styles.settingText}>Logout</ThemedText>
            <ThemedText style={styles.settingArrow}>→</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    marginBottom: 8,
  },
  userEmail: {
    color: '#666',
    fontSize: 16,
  },
  settings: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    fontSize: 16,
    color: '#ff4757',
    fontWeight: '500',
  },
  settingArrow: {
    fontSize: 16,
    color: '#ccc',
  },
});
