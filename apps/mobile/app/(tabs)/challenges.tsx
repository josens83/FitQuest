import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MOCK_CHALLENGES = {
  active: [
    {
      id: '1',
      title: '11월 홈트 챌린지',
      description: '한 달 동안 매일 운동하기',
      startDate: '2024-11-01',
      endDate: '2024-11-30',
      targetValue: 30,
      currentProgress: 18,
      participants: 5420,
      xpReward: 500,
      type: 'global',
    },
    {
      id: '2',
      title: '만보 걷기 도전',
      description: '일주일간 매일 10,000보 달성',
      startDate: '2024-11-11',
      endDate: '2024-11-17',
      targetValue: 7,
      currentProgress: 4,
      participants: 2310,
      xpReward: 200,
      type: 'individual',
    },
  ],
  upcoming: [
    {
      id: '3',
      title: '새해 다이어트 챌린지',
      description: '체중 감량 목표 달성',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      targetValue: 31,
      participants: 890,
      xpReward: 1000,
      type: 'global',
    },
  ],
};

export default function ChallengesScreen() {
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'completed'>('active');

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>챌린지</Text>
        </View>

        {/* My Progress Card */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <View style={styles.progressIcon}>
                <Text style={styles.progressEmoji}>🏆</Text>
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>이번 달 챌린지</Text>
                <Text style={styles.progressSubtitle}>2개 진행 중</Text>
              </View>
              <View style={styles.progressStats}>
                <Text style={styles.progressXP}>+700 XP</Text>
                <Text style={styles.progressEarned}>획득 가능</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['active', 'upcoming', 'completed'] as const).map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[styles.tabText, activeTab === tab && styles.tabTextActive]}
              >
                {tab === 'active' ? '진행 중' : tab === 'upcoming' ? '예정' : '완료'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Challenge List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        >
          {activeTab === 'active' &&
            MOCK_CHALLENGES.active.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} isActive />
            ))}

          {activeTab === 'upcoming' &&
            MOCK_CHALLENGES.upcoming.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}

          {activeTab === 'completed' && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>완료한 챌린지가 없어요</Text>
              <Text style={styles.emptyDescription}>
                진행 중인 챌린지를 완료해보세요!
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function ChallengeCard({
  challenge,
  isActive = false,
}: {
  challenge: any;
  isActive?: boolean;
}) {
  const progress = isActive
    ? (challenge.currentProgress / challenge.targetValue) * 100
    : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'global':
        return '🌍';
      case 'group':
        return '👥';
      case 'individual':
        return '👤';
      default:
        return '🎯';
    }
  };

  return (
    <Pressable style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <View style={styles.challengeTypeContainer}>
          <Text style={styles.challengeTypeIcon}>{getTypeIcon(challenge.type)}</Text>
          <Text style={styles.challengeType}>
            {challenge.type === 'global'
              ? '글로벌'
              : challenge.type === 'group'
                ? '그룹'
                : '개인'}
          </Text>
        </View>
        <View style={styles.challengeReward}>
          <Text style={styles.challengeRewardText}>+{challenge.xpReward} XP</Text>
        </View>
      </View>

      <Text style={styles.challengeTitle}>{challenge.title}</Text>
      <Text style={styles.challengeDescription}>{challenge.description}</Text>

      {isActive && (
        <View style={styles.challengeProgress}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {challenge.currentProgress} / {challenge.targetValue}
          </Text>
        </View>
      )}

      <View style={styles.challengeFooter}>
        <View style={styles.participantsContainer}>
          <Ionicons name="people" size={16} color="#64748B" />
          <Text style={styles.participantsText}>
            {challenge.participants.toLocaleString()}명 참여 중
          </Text>
        </View>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#64748B" />
          <Text style={styles.dateText}>
            {new Date(challenge.endDate).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
            까지
          </Text>
        </View>
      </View>
    </Pressable>
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
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  progressEmoji: {
    fontSize: 24,
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  progressSubtitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  progressStats: {
    alignItems: 'flex-end',
  },
  progressXP: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#6366F1',
  },
  progressEarned: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  challengeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeTypeIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  challengeType: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
  },
  challengeReward: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  challengeRewardText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#6366F1',
  },
  challengeTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
    marginBottom: 12,
  },
  challengeProgress: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
});
