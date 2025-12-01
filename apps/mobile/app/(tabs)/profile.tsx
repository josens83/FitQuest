import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';

const MOCK_USER = {
  username: '모험가123',
  email: 'user@example.com',
  level: 12,
  title: '불굴의 전사',
  totalXP: 5750,
  currentStreak: 7,
  longestStreak: 23,
  totalWorkouts: 145,
  totalMinutes: 4350,
  totalCalories: 42500,
  achievements: 12,
  medals: 5,
  subscriptionTier: 'premium',
  stats: {
    strength: 45,
    endurance: 38,
    flexibility: 22,
    balance: 30,
    mindfulness: 15,
  },
};

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>프로필</Text>
            <Pressable style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {MOCK_USER.username.charAt(0)}
                </Text>
              </LinearGradient>
              <View style={styles.levelBadgeContainer}>
                <LinearGradient
                  colors={['#F59E0B', '#EF4444']}
                  style={styles.levelBadge}
                >
                  <Text style={styles.levelBadgeText}>Lv.{MOCK_USER.level}</Text>
                </LinearGradient>
              </View>
            </View>
            <Text style={styles.username}>{MOCK_USER.username}</Text>
            <Text style={styles.userTitle}>{MOCK_USER.title}</Text>

            {MOCK_USER.subscriptionTier !== 'free' && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.premiumText}>
                  {MOCK_USER.subscriptionTier === 'premium' ? 'Premium' : 'Premium+'}
                </Text>
              </View>
            )}
          </View>

          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_USER.totalXP.toLocaleString()}</Text>
              <Text style={styles.statLabel}>총 XP</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statRow}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>{MOCK_USER.currentStreak}</Text>
              </View>
              <Text style={styles.statLabel}>현재 연속</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{MOCK_USER.totalWorkouts}</Text>
              <Text style={styles.statLabel}>총 운동</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(MOCK_USER.totalMinutes / 60)}h
              </Text>
              <Text style={styles.statLabel}>운동 시간</Text>
            </View>
          </View>

          {/* Character Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>캐릭터 스탯</Text>
            <View style={styles.characterStatsCard}>
              {Object.entries(MOCK_USER.stats).map(([key, value]) => (
                <View key={key} style={styles.characterStatRow}>
                  <View style={styles.characterStatInfo}>
                    <Text style={styles.characterStatIcon}>
                      {key === 'strength'
                        ? '💪'
                        : key === 'endurance'
                          ? '⚡'
                          : key === 'flexibility'
                            ? '🧘'
                            : key === 'balance'
                              ? '⚖️'
                              : '🧠'}
                    </Text>
                    <Text style={styles.characterStatName}>
                      {key === 'strength'
                        ? '힘'
                        : key === 'endurance'
                          ? '지구력'
                          : key === 'flexibility'
                            ? '유연성'
                            : key === 'balance'
                              ? '균형'
                              : '명상'}
                    </Text>
                  </View>
                  <View style={styles.characterStatBarContainer}>
                    <View
                      style={[styles.characterStatBar, { width: `${value}%` }]}
                    />
                  </View>
                  <Text style={styles.characterStatValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Achievements & Medals */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>업적 & 메달</Text>
            <View style={styles.achievementRow}>
              <Pressable style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>🏆</Text>
                <Text style={styles.achievementValue}>{MOCK_USER.achievements}</Text>
                <Text style={styles.achievementLabel}>업적</Text>
              </Pressable>
              <Pressable style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>🎖️</Text>
                <Text style={styles.achievementValue}>{MOCK_USER.medals}</Text>
                <Text style={styles.achievementLabel}>메달</Text>
              </Pressable>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <MenuItem
              icon="card-outline"
              title="구독 관리"
              subtitle={
                MOCK_USER.subscriptionTier === 'free'
                  ? '무료 플랜'
                  : MOCK_USER.subscriptionTier === 'premium'
                    ? '₩9,900/월'
                    : '₩19,900/월'
              }
            />
            <MenuItem icon="notifications-outline" title="알림 설정" />
            <MenuItem icon="lock-closed-outline" title="개인정보 및 보안" />
            <MenuItem icon="help-circle-outline" title="고객 지원" />
            <MenuItem icon="document-text-outline" title="이용약관" />
          </View>

          {/* Logout */}
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>

          <View style={{ height: 120 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <Pressable style={styles.menuItem}>
      <Ionicons name={icon} size={22} color="#94A3B8" />
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  levelBadgeContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  levelBadgeText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  username: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#6366F1',
    marginBottom: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontFamily: 'Pretendard-SemiBold',
    color: '#F59E0B',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 24,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  characterStatsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  characterStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  characterStatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  characterStatIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  characterStatName: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#94A3B8',
  },
  characterStatBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  characterStatBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  characterStatValue: {
    width: 30,
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  achievementRow: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementValue: {
    fontSize: 24,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  achievementLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  menuSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#EF4444',
  },
});
