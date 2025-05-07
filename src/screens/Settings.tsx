// src/screens/Settings.tsx
import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const navigation = useNavigation();
  const { theme, isDark, setTheme, colors } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: () => logout()
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name={"arrow-back" as any} 
            size={24} 
            color={colors.text} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tema</Text>
          
          <TouchableOpacity 
            style={[
              styles.option, 
              { borderBottomColor: colors.border }
            ]}
            onPress={() => setTheme('light')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"sunny" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Claro</Text>
            </View>
            {theme === 'light' && (
              <Ionicons name={"checkmark" as any} size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.option, 
              { borderBottomColor: colors.border }
            ]}
            onPress={() => setTheme('dark')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"moon" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Escuro</Text>
            </View>
            {theme === 'dark' && (
              <Ionicons name={"checkmark" as any} size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option}
            onPress={() => setTheme('system')}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"phone-portrait" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Sistema</Text>
            </View>
            {theme === 'system' && (
              <Ionicons name={"checkmark" as any} size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sobre o App</Text>
          
          <View 
            style={[
              styles.option, 
              { borderBottomColor: colors.border }
            ]}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"information-circle" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Versão</Text>
            </View>
            <Text style={[styles.optionValue, { color: colors.textSecondary }]}>1.0.0</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.option, 
              { borderBottomColor: colors.border }
            ]}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"star" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Avaliar o App</Text>
            </View>
            <Ionicons name={"chevron-forward" as any} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option}>
            <View style={styles.optionLeft}>
              <Ionicons name={"help-circle" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Ajuda e Suporte</Text>
            </View>
            <Ionicons name={"chevron-forward" as any} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.danger + '20' }]}
          onPress={handleLogout}
        >
          <Ionicons name={"log-out-outline" as any} size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  optionValue: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 30,
    marginBottom: 50,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default Settings;