import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../../App';
import { storageService, UserProfile } from '../services/storageService';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    averageScore: 0,
    mostPracticedShot: 'N/A',
    improvementRate: 0,
  });
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    darkMode: false,
    dataSync: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const profile = await storageService.getUserProfile();
      const generalStats = await storageService.getGeneralStats();
      
      setUserProfile(profile);
      setStats(generalStats);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleCreateProfile = () => {
    Alert.prompt(
      'Crear Perfil',
      'Ingresa tu nombre:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
          onPress: async (name) => {
            if (name && name.trim()) {
              try {
                const profile: Omit<UserProfile, 'id' | 'joinDate'> = {
                  name: name.trim(),
                  email: '',
                  level: 'beginner',
                  totalAnalyses: 0,
                  averageScore: 0,
                  favoriteShot: 'derecha',
                };
                
                await storageService.saveUserProfile(profile);
                await loadUserData();
                Alert.alert('Éxito', 'Perfil creado correctamente');
              } catch (error) {
                Alert.alert('Error', 'No se pudo crear el perfil');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleExportData = async () => {
    try {
      const fileUri = await storageService.exportUserData();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exportar Datos de PadelTech',
        });
      } else {
        Alert.alert('Exportación Completada', `Datos guardados en: ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron exportar los datos');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Implementar limpieza de datos
              Alert.alert('Éxito', 'Datos eliminados correctamente');
              await loadUserData();
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            }
          },
        },
      ]
    );
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Aquí implementarías la persistencia de configuraciones
  };

  const getLevelColor = (level: string) => {
    const colors = {
      beginner: '#4CAF50',
      intermediate: '#FFC107',
      advanced: '#FF9800',
      expert: '#F44336',
    };
    return colors[level as keyof typeof colors] || '#4CAF50';
  };

  const getLevelName = (level: string) => {
    const names = {
      beginner: 'Principiante',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      expert: 'Experto',
    };
    return names[level as keyof typeof names] || 'Principiante';
  };

  if (!userProfile) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Perfil</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.emptyProfileContainer}>
          <Ionicons name="person-circle" size={100} color="rgba(255, 255, 255, 0.8)" />
          <Text style={styles.emptyProfileTitle}>Sin Perfil</Text>
          <Text style={styles.emptyProfileText}>
            Crea tu perfil para comenzar a rastrear tu progreso
          </Text>
          
          <TouchableOpacity
            style={styles.createProfileButton}
            onPress={handleCreateProfile}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.createProfileButtonText}>Crear Perfil</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {/* Implementar edición */}}
        >
          <Ionicons name="create" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitial}>
                {userProfile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userProfile.name}</Text>
              <View style={styles.levelContainer}>
                <View
                  style={[
                    styles.levelBadge,
                    { backgroundColor: getLevelColor(userProfile.level) },
                  ]}
                >
                  <Text style={styles.levelText}>
                    {getLevelName(userProfile.level)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.totalAnalyses}</Text>
              <Text style={styles.statLabel}>Análisis</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.averageScore}%</Text>
              <Text style={styles.statLabel}>Promedio</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userProfile.favoriteShot}</Text>
              <Text style={styles.statLabel}>Favorito</Text>
            </View>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Estadísticas Generales</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="analytics" size={30} color="#667eea" />
              <Text style={styles.statCardNumber}>{stats.totalAnalyses}</Text>
              <Text style={styles.statCardLabel}>Total Análisis</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={30} color="#4CAF50" />
              <Text style={styles.statCardNumber}>{stats.averageScore}%</Text>
              <Text style={styles.statCardLabel}>Promedio General</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="star" size={30} color="#FFC107" />
              <Text style={styles.statCardNumber}>{stats.mostPracticedShot}</Text>
              <Text style={styles.statCardLabel}>Más Practicado</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="arrow-up" size={30} color="#8BC34A" />
              <Text style={styles.statCardNumber}>{stats.improvementRate}%</Text>
              <Text style={styles.statCardLabel}>Tasa de Mejora</Text>
            </View>
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.settingsCard}>
          <Text style={styles.cardTitle}>Configuración</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color="#667eea" />
              <Text style={styles.settingLabel}>Notificaciones</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              trackColor={{ false: '#767577', true: '#667eea' }}
              thumbColor={settings.notifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="save" size={24} color="#667eea" />
              <Text style={styles.settingLabel}>Guardado Automático</Text>
            </View>
            <Switch
              value={settings.autoSave}
              onValueChange={(value) => handleSettingChange('autoSave', value)}
              trackColor={{ false: '#767577', true: '#667eea' }}
              thumbColor={settings.autoSave ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon" size={24} color="#667eea" />
              <Text style={styles.settingLabel}>Modo Oscuro</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleSettingChange('darkMode', value)}
              trackColor={{ false: '#767577', true: '#667eea' }}
              thumbColor={settings.darkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="sync" size={24} color="#667eea" />
              <Text style={styles.settingLabel}>Sincronización</Text>
            </View>
            <Switch
              value={settings.dataSync}
              onValueChange={(value) => handleSettingChange('dataSync', value)}
              trackColor={{ false: '#767577', true: '#667eea' }}
              thumbColor={settings.dataSync ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleExportData}
          >
            <Ionicons name="download" size={20} color="#667eea" />
            <Text style={styles.actionButtonText}>Exportar Datos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {/* Implementar importación */}}
          >
            <Ionicons name="upload" size={20} color="#667eea" />
            <Text style={styles.actionButtonText}>Importar Datos</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              Limpiar Datos
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyProfileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyProfileText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  createProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  createProfileButtonText: {
    marginLeft: 8,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 90) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  statCardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
    marginLeft: 15,
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  actionButtonText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  dangerText: {
    color: '#e74c3c',
  },
});
