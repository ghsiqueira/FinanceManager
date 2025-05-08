// src/components/OfflineAlert.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

interface OfflineAlertProps {
  onRetry: () => void;
}

const OfflineAlert: React.FC<OfflineAlertProps> = ({ onRetry }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Verificar estado inicial
    NetInfo.fetch().then(state => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.alertContainer}>
        <Ionicons name="wifi-outline" size={24} color="#fff" />
        <Text style={styles.alertText}>Você está offline</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 40,
    zIndex: 999,
  },
  alertContainer: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  alertText: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});

export default OfflineAlert;