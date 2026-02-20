import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../src/constants/theme';
import { Card, Badge } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { useSubscription } from '../../src/hooks/useSubscription';
import { connectNotionOAuth, isNotionConnected, disconnectNotion } from '../../src/services/notion';
import { hapticLight, hapticSuccess, formatRelative } from '../../src/utils/helpers';
import { Connection } from '../../src/types';

const connectionIcons: Record<string, string> = {
  notion: '📓',
  gmail: '📧',
  apple_notes: '📒',
  obsidian: '💎',
};

const connectionDescriptions: Record<string, string> = {
  notion: 'Sync your Notion pages and databases for deeper AI insights.',
  gmail: 'Connect Gmail to analyze communication patterns and commitments.',
  apple_notes: 'Sync Apple Notes to include quick thoughts and ideas.',
  obsidian: 'Connect your Obsidian vault for comprehensive knowledge analysis.',
};

export default function ConnectionsScreen() {
  const { state, dispatch } = useApp();
  const { isPro } = useSubscription();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const notionStatus = await isNotionConnected();
      if (notionStatus) {
        dispatch({
          type: 'UPDATE_CONNECTION',
          payload: {
            ...state.connections.find((c) => c.id === 'notion')!,
            isConnected: true,
            status: 'connected',
          },
        });
      }
    } catch {
      // Notion not connected
    }
  };

  const handleConnect = async (connection: Connection) => {
    if (connection.status === 'coming_soon') {
      Alert.alert(
        'Coming Soon',
        `${connection.name} integration is coming soon. We'll notify you when it's ready!`
      );
      return;
    }

    if (connection.isConnected) {
      Alert.alert(
        `Disconnect ${connection.name}`,
        `Are you sure you want to disconnect ${connection.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              hapticLight();
              if (connection.type === 'notion') {
                await disconnectNotion();
              }
              dispatch({
                type: 'UPDATE_CONNECTION',
                payload: {
                  ...connection,
                  isConnected: false,
                  status: 'disconnected',
                },
              });
            },
          },
        ]
      );
      return;
    }

    hapticLight();
    setLoading(connection.id);

    try {
      if (connection.type === 'notion') {
        const success = await connectNotionOAuth();
        if (success) {
          hapticSuccess();
          dispatch({
            type: 'UPDATE_CONNECTION',
            payload: {
              ...connection,
              isConnected: true,
              status: 'connected',
              lastSynced: new Date().toISOString(),
            },
          });
        }
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
        <Text style={styles.headerSub}>
          Connect your tools so North can understand your life deeply.
        </Text>
      </View>

      {/* Info Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.infoEmoji}>🔒</Text>
        <Text style={styles.infoTitle}>Your data stays private</Text>
        <Text style={styles.infoDescription}>
          All data is processed locally and sent only to Claude AI for analysis. We never store your data on external servers.
        </Text>
      </Card>

      {/* Connections */}
      <View style={styles.connectionsList}>
        {state.connections.map((connection) => (
          <Card key={connection.id} style={styles.connectionCard}>
            <View style={styles.connectionTop}>
              <View style={styles.connectionInfo}>
                <Text style={styles.connectionIcon}>
                  {connectionIcons[connection.type]}
                </Text>
                <View style={styles.connectionDetails}>
                  <Text style={styles.connectionName}>{connection.name}</Text>
                  <Text style={styles.connectionDesc}>
                    {connectionDescriptions[connection.type]}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.connectionBottom}>
              <View style={styles.connectionStatus}>
                {connection.status === 'connected' && (
                  <>
                    <View style={styles.statusDotConnected} />
                    <Text style={styles.statusText}>Connected</Text>
                  </>
                )}
                {connection.status === 'disconnected' && (
                  <>
                    <View style={styles.statusDotDisconnected} />
                    <Text style={styles.statusText}>Not connected</Text>
                  </>
                )}
                {connection.status === 'coming_soon' && (
                  <Badge label="Coming soon" color={Colors.tertiary} />
                )}
                {connection.status === 'syncing' && (
                  <>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.statusText}>Syncing...</Text>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.connectButton,
                  connection.isConnected && styles.disconnectButton,
                  connection.status === 'coming_soon' && styles.comingSoonButton,
                ]}
                onPress={() => handleConnect(connection)}
                disabled={loading === connection.id}
              >
                {loading === connection.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.connectButtonText,
                      connection.isConnected && styles.disconnectButtonText,
                      connection.status === 'coming_soon' && styles.comingSoonButtonText,
                    ]}
                  >
                    {connection.isConnected
                      ? 'Disconnect'
                      : connection.status === 'coming_soon'
                      ? 'Notify me'
                      : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {connection.lastSynced && (
              <Text style={styles.lastSynced}>
                Last synced {formatRelative(connection.lastSynced)}
              </Text>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 140,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    fontFamily: 'Inter_700Bold',
  },
  headerSub: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  infoCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
    backgroundColor: Colors.primaryMuted,
    borderColor: 'rgba(107, 143, 113, 0.15)',
  },
  infoEmoji: {
    fontSize: 32,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: 'Inter_600SemiBold',
  },
  infoDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  connectionsList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  connectionCard: {
    padding: Spacing.lg,
  },
  connectionTop: {
    marginBottom: Spacing.md,
  },
  connectionInfo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  connectionIcon: {
    fontSize: 32,
    marginTop: Spacing.xs,
  },
  connectionDetails: {
    flex: 1,
  },
  connectionName: {
    ...Typography.headlineSmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold',
  },
  connectionDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  connectionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDotConnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  statusDotDisconnected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
  statusText: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
  },
  connectButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comingSoonButton: {
    backgroundColor: Colors.backgroundTertiary,
  },
  connectButtonText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  disconnectButtonText: {
    color: Colors.textSecondary,
  },
  comingSoonButtonText: {
    color: Colors.textTertiary,
  },
  lastSynced: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    fontFamily: 'Inter_400Regular',
  },
});
