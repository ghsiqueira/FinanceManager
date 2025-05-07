import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { RootStackParamList } from '../types/navigation';

// Defina o tipo para a navegação
type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const Settings = () => {
  // Use o tipo correto para a navegação
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { theme, isDark, setTheme, colors } = useTheme();
  const { state, logout } = useAuth();
  const [userProfile, setUserProfile] = useState({
    name: state.user?.name || '',
    email: state.user?.email || '',
    photoUrl: null
  });

  // Buscar dados do perfil ao carregar a tela
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/profile');
      setUserProfile({
        name: response.data.name,
        email: response.data.email,
        photoUrl: response.data.photoUrl
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
    }
  };

  const handleEditProfile = () => {
    // Agora a navegação funcionará corretamente
    navigation.navigate('EditProfile');
  };

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
        {/* Perfil do Usuário */}
        <TouchableOpacity 
          style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleEditProfile}
        >
          <View style={styles.profileInfo}>
            <View style={[styles.profileImage, { backgroundColor: colors.primary + '20' }]}>
              {userProfile.photoUrl ? (
                <Image 
                  source={{ uri: userProfile.photoUrl }} 
                  style={styles.profilePhoto} 
                />
              ) : (
                <Ionicons 
                  name={"person" as any} 
                  size={36} 
                  color={colors.primary} 
                />
              )}
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {userProfile.name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {userProfile.email}
              </Text>
            </View>
          </View>
          <View style={styles.profileEditButton}>
            <Ionicons 
              name={"create-outline" as any} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={[styles.profileEditText, { color: colors.primary }]}>
              Editar
            </Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Conta</Text>
          
          <TouchableOpacity 
            style={[
              styles.option, 
              { borderBottomColor: colors.border }
            ]}
            onPress={handleEditProfile}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"person" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Editar Perfil</Text>
            </View>
            <Ionicons name={"chevron-forward" as any} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.option}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={"notifications" as any} size={20} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Notificações</Text>
            </View>
            <Ionicons name={"chevron-forward" as any} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

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
  profileCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileText: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
  },
  profileEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileEditText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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