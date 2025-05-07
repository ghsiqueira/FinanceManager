// src/screens/EditProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EditProfile = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { state, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  
  // Estados para formulário
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/user/profile');
      const userData = response.data;
      
      setName(userData.name || '');
      setEmail(userData.email || '');
      setPhotoUrl(userData.photoUrl || null);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus dados de perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu nome');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu email');
      return;
    }

    // Validação para mudança de senha
    if (changingPassword) {
      if (!currentPassword) {
        Alert.alert('Erro', 'Por favor, informe sua senha atual');
        return;
      }
      
      if (!newPassword) {
        Alert.alert('Erro', 'Por favor, informe a nova senha');
        return;
      }
      
      if (newPassword !== confirmNewPassword) {
        Alert.alert('Erro', 'As senhas não coincidem');
        return;
      }
      
      if (newPassword.length < 6) {
        Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    try {
      setSaving(true);
      
      const data: any = {
        name,
        email,
      };
      
      if (changingPassword) {
        data.currentPassword = currentPassword;
        data.newPassword = newPassword;
      }
      
      const response = await api.put('/api/user/profile', data);
      
      // Atualizar o contexto de autenticação com os novos dados
      if (updateUser) {
        updateUser({
          id: state.user?.id || '',
          name,
          email
        });
      }
      
      Alert.alert(
        'Sucesso',
        'Perfil atualizado com sucesso',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      
      // Verificar se é erro de senha incorreta
      if (error.response && error.response.status === 400) {
        Alert.alert('Erro', 'Senha atual incorreta');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar seu perfil');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePhoto = async () => {
    Alert.alert(
      'Foto de Perfil',
      'O que você gostaria de fazer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Tirar Foto', 
          onPress: () => handleTakePhoto() 
        },
        { 
          text: 'Escolher da Galeria', 
          onPress: () => handleSelectFromGallery() 
        },
        photoUrl ? { 
          text: 'Remover Foto', 
          style: 'destructive',
          onPress: () => handleRemovePhoto() 
        } : undefined,
      ].filter(Boolean) as any
    );
  };

  const handleTakePhoto = async () => {
    // Esta função seria implementada usando a câmera do dispositivo
    Alert.alert('Funcionalidade', 'A funcionalidade de tirar foto será implementada em uma versão futura');
  };

  const handleSelectFromGallery = async () => {
    // Esta função seria implementada usando a galeria do dispositivo
    Alert.alert('Funcionalidade', 'A funcionalidade de selecionar da galeria será implementada em uma versão futura');
  };

  const handleRemovePhoto = async () => {
    try {
      setPhotoLoading(true);
      await api.delete('/api/user/profile-photo');
      setPhotoUrl(null);
      Alert.alert('Sucesso', 'Foto de perfil removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover foto de perfil:', error);
      Alert.alert('Erro', 'Não foi possível remover a foto de perfil');
    } finally {
      setPhotoLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Foto de Perfil */}
        <View style={styles.photoContainer}>
          <TouchableOpacity 
            style={[styles.photoCircle, { backgroundColor: colors.primary + '20' }]}
            onPress={handleChangePhoto}
            disabled={photoLoading}
          >
            {photoLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : photoUrl ? (
              <Image 
                source={{ uri: photoUrl }} 
                style={styles.photo}
              />
            ) : (
              <Ionicons 
                name={"person" as any} 
                size={48} 
                color={colors.primary} 
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.changePhotoButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleChangePhoto}
            disabled={photoLoading}
          >
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Alterar Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Informações do Perfil */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações</Text>
          
          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={[styles.inputContainer, { borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Mudar Senha */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setChangingPassword(!changingPassword)}
            >
              <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
                {changingPassword ? 'Cancelar' : 'Alterar'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {changingPassword && (
            <>
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Senha Atual</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Sua senha atual"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>
              
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nova Senha</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nova senha"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>
              
              <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirmar Nova Senha</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  placeholder="Confirme a nova senha"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry
                />
              </View>
            </>
          )}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
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
  contentContainer: {
    padding: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  toggleButton: {
    padding: 4,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
  saveButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditProfile;