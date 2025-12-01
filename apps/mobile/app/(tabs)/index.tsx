import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuthStore();

  // Mock data
  const userData = {
    username: user?.username || '모험가',
    level: 12,
    title: '불굴의 전사',
    currentXP: 750,
    xpToNextLevel: 1000,
    streak: 7,
    todayCompleted: false,
  };

  const stats = {
    strength: 45,
    endurance: 38,
    flexibility: 22,
    balance: 30,
    mindfulness: 15,
  };

  const recommendedWorkouts = [
    {
      id: '1',
      title: '전신 파워 트레이닝',
      duration: 30,
      difficulty: 'intermediate',
      xp: 150,
      thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    },
    {
      id: '2',
      title: '코어 강화 루틴',
      duration: 20,
      difficulty: 'beginner',
      xp: 100,
      thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    },
  ];

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>안녕하세요,</Text>
              <Text style={styles.username}>{userData.username}님! 👋</Text>
            </View>
            <Pressable style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </Pressable>
          </View>

          {/* Level Card */}
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A855F7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.levelCard}
          >
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>Lv.{userData.level}</Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakIcon}>🔥</Text>
                <Text style={styles.streakText}>{userData.streak}일 연속</Text>
              </View>
            </View>
            <Text style={styles.levelTitle}>{userData.title}</Text>
            <View style={styles.xpContainer}>
              <View style={styles.xpBar}>
                <View
                  style={[
                    styles.xpFill,
                    { width: `${(userData.currentXP / userData.xpToNextLevel) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.xpText}>
                {userData.currentXP} / {userData.xpToNextLevel} XP
              </Text>
            </View>
          </LinearGradient>

          {/* Quick Stats */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 스탯</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <StatCard label="힘" value={stats.strength} color="#EF4444" icon="💪" />
            <StatCard label="지구력" value={stats.endurance} color="#F59E0B" icon="⚡" />
            <StatCard label="유연성" value={stats.flexibility} color="#22C55E" icon="🧘" />
            <StatCard label="균형" value={stats.balance} color="#3B82F6" icon="⚖️" />
            <StatCard label="명상" value={stats.mindfulness} color="#A855F7" icon="🧠" />
          </ScrollView>

          {/* Today's Quest */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 퀘스트</Text>
            <Pressable>
              <Text style={styles.seeAll}>전체보기</Text>
            </Pressable>
          </View>
          <View style={styles.questCard}>
            <View style={styles.questIcon}>
              <Text style={styles.questEmoji}>⚔️</Text>
            </View>
            <View style={styles.questContent}>
              <Text style={styles.questTitle}>오늘의 운동 완료하기</Text>
              <Text style={styles.questDescription}>아무 운동이나 1회 완료</Text>
              <View style={styles.questReward}>
                <Text style={styles.questRewardText}>+50 XP</Text>
              </View>
            </View>
            <View
              style={[
                styles.questStatus,
                userData.todayCompleted && styles.questCompleted,
              ]}
            >
              <Ionicons
                name={userData.todayCompleted ? 'checkmark' : 'ellipse-outline'}
                size={24}
                color={userData.todayCompleted ? '#22C55E' : '#64748B'}
              />
            </View>
          </View>

          {/* Recommended Workouts */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>추천 운동</Text>
            <Pressable onPress={() => router.push('/(tabs)/workouts')}>
              <Text style={styles.seeAll}>더보기</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.workoutsContainer}
          >
            {recommendedWorkouts.map((workout) => (
              <Pressable
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => router.push(`/workout/${workout.id}`)}
              >
                <View style={styles.workoutThumbnail}>
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.workoutGradient}
                  />
                  <View style={styles.workoutXP}>
                    <Text style={styles.workoutXPText}>+{workout.xp} XP</Text>
                  </View>
                </View>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutTitle} numberOfLines={1}>
                    {workout.title}
                  </Text>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutDuration}>{workout.duration}분</Text>
                    <View style={styles.workoutDot} />
                    <Text style={styles.workoutDifficulty}>
                      {workout.difficulty === 'beginner'
                        ? '초급'
                        : workout.difficulty === 'intermediate'
                          ? '중급'
                          : '고급'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          {/* AI Coach Prompt */}
          <Pressable style={styles.coachCard}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
              style={styles.coachGradient}
            >
              <View style={styles.coachIcon}>
                <Text style={styles.coachEmoji}>🤖</Text>
              </View>
              <View style={styles.coachContent}>
                <Text style={styles.coachTitle}>AI 코치에게 물어보세요</Text>
                <Text style={styles.coachDescription}>
                  운동 추천, 자세 교정, 식단 조언
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#6366F1" />
            </LinearGradient>
          </Pressable>

          {/* Spacer for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  levelCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelNumber: {
    fontSize: 14,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  levelTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  xpContainer: {
    gap: 8,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#6366F1',
  },
  statsContainer: {
    paddingRight: 20,
    marginBottom: 24,
  },
  statCard: {
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  questEmoji: {
    fontSize: 24,
  },
  questContent: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  questDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
    marginBottom: 4,
  },
  questReward: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  questRewardText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#22C55E',
  },
  questStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questCompleted: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  workoutsContainer: {
    paddingRight: 20,
    marginBottom: 24,
  },
  workoutCard: {
    width: width * 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workoutThumbnail: {
    height: 120,
    backgroundColor: '#374151',
    justifyContent: 'flex-end',
  },
  workoutGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  workoutXP: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  workoutXPText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  workoutInfo: {
    padding: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDuration: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  workoutDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
    marginHorizontal: 8,
  },
  workoutDifficulty: {
    fontSize: 13,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  coachCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  coachGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  coachIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  coachEmoji: {
    fontSize: 24,
  },
  coachContent: {
    flex: 1,
  },
  coachTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  coachDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
});
