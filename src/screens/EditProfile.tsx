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
  const { colors } = useTheme();
  const { state, updateUser } = useAuth();
  
  const [name, setName] = useState(state.user?.name || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permissão negada', 'Desculpe, precisamos da permissão da galeria para isto funcionar!');
        }
      }
    })();
    
    // Buscar URL da foto de perfil atual
    fetchProfilePhoto();
  }, []);

  const fetchProfilePhoto = async () => {
    try {
      const res = await api.get('/api/user/profile-photo');
      if (res.data && res.data.photoUrl) {
        setPhotoUri(res.data.photoUrl);
      }
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    
    const filename = uri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    
    // @ts-ignore
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
      
      if (res.data && res.data.photoUrl) {
        setPhotoUri(res.data.photoUrl);
        Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    // Validação de senha
    if (newPassword && newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não correspondem.');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        name,
        email,
        ...(newPassword && currentPassword ? {
          currentPassword,
          newPassword
        } : {})
      };
      
      const res = await api.put('/api/user/profile', userData);
      
      if (res.data && res.data.user) {
        // Atualizar informações do usuário no contexto
        updateUser(res.data.user);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      let errorMessage = 'Não foi possível atualizar o perfil.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.photoContainer}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.primary + '30' }]}>
              <Ionicons name={"person" as any} size={50} color={colors.primary} />
            </View>
          )}
          
          <TouchableOpacity 
            style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.changePhotoText}>Mudar Foto</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Nome</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
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
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
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
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
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
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
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
            disabled={loading}
          >
            {loading ? (
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
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditProfile;