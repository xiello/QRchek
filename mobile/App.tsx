import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AdminScreen from './src/screens/AdminScreen';
import MissingDepartureScreen from './src/screens/MissingDepartureScreen';
import Logo from './src/components/Logo';
import { isAuthenticated, clearAuth, getEmployee } from './src/services/auth';
import { attendanceAPI } from './src/services/api';
import { Employee, AttendanceRecord } from './src/types/attendance';
import { theme, sk } from './src/config/theme';

const Stack = createNativeStackNavigator();

type AuthScreen = 'login' | 'register' | 'forgotPassword';
type AppScreen = 'scanner' | 'history';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('scanner');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingDeparture, setPendingDeparture] = useState<AttendanceRecord | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Check for pending departures when user is authenticated
  useEffect(() => {
    if (authenticated && !isAdmin) {
      checkPendingDeparture();
    }
  }, [authenticated, isAdmin]);

  const checkPendingDeparture = async () => {
    try {
      const result = await attendanceAPI.getPendingDeparture();
      if (result.pending && result.record) {
        setPendingDeparture(result.record);
        setShowPendingModal(true);
      }
    } catch (error) {
      console.log('Error checking pending departure:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const auth = await Promise.race([
        isAuthenticated(),
        new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 3000)
        )
      ]);
      
      if (auth) {
        const employee = await getEmployee();
        const adminStatus = employee?.isAdmin || false;
        setIsAdmin(adminStatus);
      }
      
      setAuthenticated(auth);
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLoginSuccess = async () => {
    const employee = await getEmployee();
    const adminStatus = employee?.isAdmin || false;
    setIsAdmin(adminStatus);
    setAuthenticated(true);
  };

  const handleRegisterSuccess = (email: string) => {
    setAuthScreen('login');
  };

  const handleLogout = async () => {
    await clearAuth();
    setAuthenticated(false);
    setIsAdmin(false);
    setCurrentScreen('scanner');
  };

  const handleScanSuccess = () => {
    // Optionally switch to history tab after successful scan
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <Logo size="medium" showTagline={true} />
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 32 }} />
        <Text style={styles.loadingText}>{sk.loading}</Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <>
        <StatusBar style="light" />
        {authScreen === 'login' && (
          <LoginScreen 
            onLoginSuccess={handleLoginSuccess} 
            onNavigateToRegister={() => setAuthScreen('register')}
            onNavigateToForgotPassword={() => setAuthScreen('forgotPassword')}
          />
        )}
        {authScreen === 'register' && (
          <RegisterScreen 
            onRegisterSuccess={handleRegisterSuccess}
            onBackToLogin={() => setAuthScreen('login')}
          />
        )}
        {authScreen === 'forgotPassword' && (
          <ForgotPasswordScreen 
            onBackToLogin={() => setAuthScreen('login')}
          />
        )}
      </>
    );
  }

  // Admin users see admin-only UI
  if (isAdmin) {
    return (
      <>
        <StatusBar style="light" />
        <View style={styles.container}>
          <View style={styles.adminHeader}>
            <View style={styles.adminHeaderLeft}>
              <Logo size="small" showTagline={false} inline={true} />
              <Text style={styles.adminHeaderTitle}>Admin Dashboard</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>{sk.logout}</Text>
            </TouchableOpacity>
          </View>
          <AdminScreen />
        </View>
      </>
    );
  }

  // Regular employee UI
  return (
    <>
      <StatusBar style="light" />
      {/* Pending Departure Modal */}
      {showPendingModal && pendingDeparture && (
        <MissingDepartureScreen
          record={pendingDeparture}
          onConfirmed={() => {
            setShowPendingModal(false);
            setPendingDeparture(null);
          }}
          onDismiss={() => setShowPendingModal(false)}
        />
      )}
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.surface,
            },
            headerTintColor: theme.colors.textPrimary,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen
            name="Main"
            options={{
              headerTitle: () => <Logo size="small" showTagline={false} />,
              headerRight: () => (
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                  <Text style={styles.logoutText}>{sk.logout}</Text>
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
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        currentScreen === 'scanner' && styles.activeTabText,
                      ]}
                    >
                      {sk.scanner}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tab, currentScreen === 'history' && styles.activeTab]}
                    onPress={() => setCurrentScreen('history')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        currentScreen === 'history' && styles.activeTabText,
                      ]}
                    >
                      {sk.history}
                    </Text>
                  </TouchableOpacity>
                </View>

                {currentScreen === 'scanner' && (
                  <ScannerScreen onScanSuccess={handleScanSuccess} />
                )}
                {currentScreen === 'history' && (
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  adminHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  adminHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adminHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  logoutText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
