import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { id: 'all', label: '전체', icon: '🏠' },
  { id: 'strength', label: '근력', icon: '💪' },
  { id: 'cardio', label: '유산소', icon: '🏃' },
  { id: 'yoga', label: '요가', icon: '🧘' },
  { id: 'hiit', label: 'HIIT', icon: '⚡' },
  { id: 'stretching', label: '스트레칭', icon: '🤸' },
];

const MOCK_WORKOUTS = [
  {
    id: '1',
    title: '전신 파워 트레이닝',
    trainer: '김트레이너',
    duration: 30,
    difficulty: 'intermediate',
    category: 'strength',
    xp: 150,
    rating: 4.8,
    completions: 12500,
    isPremium: false,
  },
  {
    id: '2',
    title: '코어 강화 루틴',
    trainer: '박코치',
    duration: 20,
    difficulty: 'beginner',
    category: 'strength',
    xp: 100,
    rating: 4.9,
    completions: 8700,
    isPremium: false,
  },
  {
    id: '3',
    title: '고강도 지방 연소',
    trainer: '이강사',
    duration: 45,
    difficulty: 'advanced',
    category: 'hiit',
    xp: 200,
    rating: 4.7,
    completions: 5600,
    isPremium: true,
  },
  {
    id: '4',
    title: '모닝 요가 플로우',
    trainer: '최요가',
    duration: 25,
    difficulty: 'beginner',
    category: 'yoga',
    xp: 80,
    rating: 4.9,
    completions: 15200,
    isPremium: false,
  },
  {
    id: '5',
    title: '심폐 강화 러닝',
    trainer: '정러너',
    duration: 35,
    difficulty: 'intermediate',
    category: 'cardio',
    xp: 120,
    rating: 4.6,
    completions: 3400,
    isPremium: false,
  },
];

export default function WorkoutsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkouts = MOCK_WORKOUTS.filter((workout) => {
    const matchesCategory =
      selectedCategory === 'all' || workout.category === selectedCategory;
    const matchesSearch = workout.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#22C55E';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#94A3B8';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '초급';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return difficulty;
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>운동 프로그램</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="운동 검색..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </Pressable>
            )}
          </View>
          <Pressable style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelSelected,
                ]}
              >
                {category.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Workout List */}
        <FlatList
          data={filteredWorkouts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.workoutList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.workoutCard}
              onPress={() => router.push(`/workout/${item.id}`)}
            >
              <View style={styles.workoutThumbnail}>
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                  </View>
                )}
                <View style={styles.workoutXP}>
                  <Text style={styles.workoutXPText}>+{item.xp} XP</Text>
                </View>
              </View>
              <View style={styles.workoutInfo}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.workoutTrainer}>{item.trainer}</Text>
                <View style={styles.workoutMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>{item.duration}분</Text>
                  </View>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: `${getDifficultyColor(item.difficulty)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(item.difficulty) },
                      ]}
                    >
                      {getDifficultyLabel(item.difficulty)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>
                      {item.completions >= 1000
                        ? `${(item.completions / 1000).toFixed(1)}k`
                        : item.completions}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          )}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
  },
  categoryLabelSelected: {
    color: '#FFFFFF',
  },
  workoutList: {
    paddingHorizontal: 20,
  },
  workoutCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutThumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#374151',
    justifyContent: 'space-between',
    padding: 8,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 4,
    borderRadius: 4,
  },
  workoutXP: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  workoutXPText: {
    fontSize: 10,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  workoutInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#F59E0B',
    marginLeft: 2,
  },
  workoutTrainer: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
  },
});
