import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { isAuthenticated, clearAuth } from './src/services/auth';
import { AttendanceRecord } from './src/types/attendance';

const Stack = createNativeStackNavigator();

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'scanner' | 'history'>('scanner');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Add a timeout so it doesn't hang forever
      const auth = await Promise.race([
        isAuthenticated(),
        new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 3000)
        )
      ]);
      setAuthenticated(auth);
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    await clearAuth();
    setAuthenticated(false);
  };

  const handleScanSuccess = () => {
    // Optionally switch to history tab after successful scan
    // setCurrentScreen('history');
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <>
        <StatusBar style="auto" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="Main"
            options={{
              headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              ),
            }}
          >
            {() => (
              <View style={styles.container}>
                <View style={styles.tabBar}>
                  <TouchableOpacity
                    style={[styles.tab, currentScreen === 'scanner' && styles.activeTab]}
                    onPress={() => setCurrentScreen('scanner')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        currentScreen === 'scanner' && styles.activeTabText,
                      ]}
                    >
                      Scanner
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, currentScreen === 'history' && styles.activeTab]}
                    onPress={() => setCurrentScreen('history')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        currentScreen === 'history' && styles.activeTabText,
                      ]}
                    >
                      History
                    </Text>
                  </TouchableOpacity>
                </View>

                {currentScreen === 'scanner' ? (
                  <ScannerScreen onScanSuccess={handleScanSuccess} />
                ) : (
                  <HistoryScreen />
                )}
              </View>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    marginRight: 10,
    padding: 5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
  },
});

