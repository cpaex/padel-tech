import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { VideoStorageService, StoredVideo } from '../services/videoStorageService';

type VideoHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VideoHistory'>;

const { width } = Dimensions.get('window');

export default function VideoHistoryScreen() {
  const navigation = useNavigation<VideoHistoryScreenNavigationProp>();
  
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShotType, setSelectedShotType] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({
    totalVideos: 0,
    totalSize: 0,
  });

  const shotTypes = [
    { id: 'all', name: 'Todos', icon: '🎾' },
    { id: 'derecha', name: 'Derecha', icon: '🎾' },
    { id: 'reves', name: 'Revés', icon: '🏓' },
    { id: 'volea', name: 'Volea', icon: '⚡' },
    { id: 'saque', name: 'Saque', icon: '🚀' },
    { id: 'bandeja', name: 'Bandeja', icon: '🥄' },
    { id: 'vibora', name: 'Víbora', icon: '🐍' },
    { id: 'remate', name: 'Remate', icon: '💥' },
  ];

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, [])
  );

  const loadVideos = async () => {
    try {
      setLoading(true);
      const allVideos = await VideoStorageService.getAllVideos();
      setVideos(allVideos);

      const stats = await VideoStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'No se pudieron cargar los videos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadVideos();
    setRefreshing(false);
  };

  const handleDeleteVideo = (videoId: string) => {
    Alert.alert(
      'Eliminar Video',
      '¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await VideoStorageService.deleteVideo(videoId);
              loadVideos(); // Reload videos after deletion
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'No se pudo eliminar el video');
            }
          },
        },
      ]
    );
  };

  const handleVideoPress = (video: StoredVideo) => {
    // Navigate to analysis screen with the video
    navigation.navigate('Analysis', {
      videoUri: video.uri,
      shotType: video.shotType,
    });
  };

  const getFilteredVideos = () => {
    if (!selectedShotType || selectedShotType === 'all') {
      return videos;
    }
    return videos.filter(video => video.shotType === selectedShotType);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getShotTypeIcon = (shotType: string) => {
    const shot = shotTypes.find(s => s.id === shotType);
    return shot ? shot.icon : '🎾';
  };

  const getShotTypeName = (shotType: string) => {
    const shot = shotTypes.find(s => s.id === shotType);
    return shot ? shot.name : shotType;
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Cargando videos...</Text>
      </LinearGradient>
    );
  }

  const filteredVideos = getFilteredVideos();

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
        <Text style={styles.headerTitle}>Videos Guardados</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Storage Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {storageStats.totalVideos} videos • {VideoStorageService.formatBytes(storageStats.totalSize)}
        </Text>
      </View>

      {/* Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {shotTypes.map((shotType) => (
          <TouchableOpacity
            key={shotType.id}
            style={[
              styles.filterButton,
              selectedShotType === shotType.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedShotType(shotType.id)}
          >
            <Text style={styles.filterIcon}>{shotType.icon}</Text>
            <Text
              style={[
                styles.filterText,
                selectedShotType === shotType.id && styles.filterTextActive,
              ]}
            >
              {shotType.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Videos List */}
      <ScrollView
        style={styles.videosContainer}
        contentContainerStyle={styles.videosContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
          />
        }
      >
        {filteredVideos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="videocam-outline" size={80} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyTitle}>No hay videos</Text>
            <Text style={styles.emptyText}>
              {selectedShotType && selectedShotType !== 'all'
                ? `No tienes videos de ${getShotTypeName(selectedShotType)} guardados`
                : 'Graba tu primer video de técnica de pádel'}
            </Text>
          </View>
        ) : (
          filteredVideos.map((video) => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => handleVideoPress(video)}
              activeOpacity={0.8}
            >
              <View style={styles.videoPreview}>
                <Video
                  source={{ uri: video.uri }}
                  style={styles.videoThumbnail}
                  shouldPlay={false}
                  isLooping={false}
                  resizeMode={"cover" as any}
                  usePoster
                />
                <View style={styles.videoOverlay}>
                  <Ionicons name="play" size={24} color="white" />
                </View>
              </View>

              <View style={styles.videoInfo}>
                <View style={styles.videoHeader}>
                  <Text style={styles.shotTypeIcon}>
                    {getShotTypeIcon(video.shotType)}
                  </Text>
                  <Text style={styles.shotTypeName}>
                    {getShotTypeName(video.shotType)}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteVideo(video.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                </View>

                <View style={styles.videoMeta}>
                  <Text style={styles.videoDate}>
                    {formatDate(video.timestamp)}
                  </Text>
                  <Text style={styles.videoDuration}>
                    {VideoStorageService.formatDuration(video.duration)}
                  </Text>
                  <Text style={styles.videoSize}>
                    {VideoStorageService.formatBytes(video.size)}
                  </Text>
                </View>

                {video.analysisResult && (
                  <View style={styles.analysisIndicator}>
                    <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
                    <Text style={styles.analysisText}>Analizado</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
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
  headerSpacer: {
    width: 40,
  },
  statsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  filterContainer: {
    maxHeight: 60,
    marginBottom: 20,
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  videosContainer: {
    flex: 1,
  },
  videosContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  videoPreview: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shotTypeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  shotTypeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteButton: {
    padding: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  videoDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 12,
  },
  videoDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 12,
  },
  videoSize: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  analysisIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  analysisText: {
    fontSize: 12,
    color: '#2ecc71',
    marginLeft: 4,
    fontWeight: '600',
  },
});