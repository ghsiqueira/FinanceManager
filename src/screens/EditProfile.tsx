// src/screens/EditProfile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EditProfile = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { state, updateUser } = useAuth();
  
  const [name, setName] = useState(state.user?.name || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [tempPhotoUri, setTempPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestPermissions();
    fetchUserProfile();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos. Você pode conceder esta permissão nas configurações do seu dispositivo.',
          [{ text: 'OK' }]
        );
      }
      
      // Também solicitar permissão para câmera
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar sua câmera. Você pode conceder esta permissão nas configurações do seu dispositivo.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/user/profile');
      
      if (res.data.photoUrl) {
        setPhotoUri(res.data.photoUrl);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      setLoading(false);
    }
  };

  const selectImageFromGallery = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setTempPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem da galeria:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setTempPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const selectImageSource = () => {
    Alert.alert(
      'Escolha uma opção',
      'Como você deseja adicionar uma foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tirar Foto', onPress: takePhoto },
        { text: 'Escolher da Galeria', onPress: selectImageFromGallery },
        { 
          text: 'Remover Foto', 
          style: 'destructive',
          onPress: () => {
            if (photoUri) {
              Alert.alert(
                'Remover Foto',
                'Tem certeza que deseja remover sua foto de perfil?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { 
                    text: 'Remover', 
                    style: 'destructive',
                    onPress: () => {
                      setPhotoUri(null);
                      setTempPhotoUri(null);
                      // Remover foto no servidor
                      api.delete('/api/user/profile-photo')
                        .then(() => Alert.alert('Sucesso', 'Foto removida com sucesso!'))
                        .catch(err => console.error('Erro ao remover foto:', err));
                    }
                  }
                ]
              );
            } else {
              Alert.alert('Aviso', 'Você não possui uma foto de perfil para remover.');
            }
          }
        }
      ]
    );
  };

  const uploadPhoto = async () => {
    if (!tempPhotoUri) return null;
    
    const formData = new FormData();
    const uri = tempPhotoUri;
    const filename = uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // @ts-ignore - TypeScript não reconhece esta sintaxe de FormData
    formData.append('profilePhoto', {
      uri,
      name: filename,
      type
    });
    
    try {
      setUploading(true);
      
      const res = await api.post('/api/user/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      setUploading(false);
      setPhotoUri(res.data.photoUrl);
      return res.data.photoUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setUploading(false);
      Alert.alert('Erro', 'Não foi possível fazer o upload da foto de perfil. Tente novamente.');
      return null;
    }
  };

  const validateForm = () => {
    // Validação de nome
    if (!name.trim()) {
      setError('O nome é obrigatório');
      return false;
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Insira um e-mail válido');
      return false;
    }
    
    // Validação de senha
    if (newPassword) {
      if (!currentPassword) {
        setError('A senha atual é necessária para definir uma nova senha');
        return false;
      }
      
      if (newPassword.length < 6) {
        setError('A nova senha deve ter pelo menos 6 caracteres');
        return false;
      }
      
      if (newPassword !== confirmPassword) {
        setError('As senhas não correspondem');
        return false;
      }
    }
    
    return true;
  };

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      
      if (!validateForm()) {
        return;
      }
      
      setSavingProfile(true);
      
      // Upload da foto de perfil, se for alterada
      let photoUrl = photoUri;
      if (tempPhotoUri) {
        photoUrl = await uploadPhoto();
      }
      
      // Construir objeto para atualização
      const updateData: any = { name, email };
      
      if (photoUrl) {
        updateData.photoUrl = photoUrl;
      }
      
      if (newPassword && currentPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }
      
      // Atualizar perfil
      const res = await api.put('/api/user/profile', updateData);
      
      // Atualizar contexto do usuário
      if (res.data && res.data.user) {
        updateUser(res.data.user);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      
      // Exibir mensagem de erro adequada
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Erro ao atualizar perfil');
      } else {
        setError('Não foi possível atualizar o perfil. Verifique sua conexão.');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Perfil</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name={"arrow-back" as any} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '20' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}
        
        <View style={styles.photoContainer}>
          {tempPhotoUri ? (
            <Image source={{ uri: tempPhotoUri }} style={styles.profilePhoto} />
          ) : photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name={"person" as any} size={50} color={colors.primary} />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
            onPress={selectImageSource}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changePhotoText}>Alterar Foto</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                color: colors.text, 
                borderColor: colors.border 
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="seu-email@exemplo.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.passwordSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Alterar Senha</Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Senha Atual</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: colors.border 
                }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Sua senha atual"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Nova Senha</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: colors.border 
                }]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nova senha"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirmar Nova Senha</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  color: colors.text, 
                  borderColor: colors.border 
                }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirme sua nova senha"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleUpdateProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  passwordSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;