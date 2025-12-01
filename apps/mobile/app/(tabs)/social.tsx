import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const MOCK_FEED = [
  {
    id: '1',
    user: {
      id: 'u1',
      username: '운동왕김철수',
      avatar: null,
      level: 25,
    },
    type: 'workout',
    title: '운동 완료',
    description: '30분 전신 운동으로 150 XP 획득!',
    timestamp: '10분 전',
    likes: 24,
    comments: 5,
    isLiked: false,
  },
  {
    id: '2',
    user: {
      id: 'u2',
      username: '헬스걸',
      avatar: null,
      level: 18,
    },
    type: 'achievement',
    title: '업적 달성: 100일 연속 운동',
    description: '+500 XP',
    timestamp: '1시간 전',
    likes: 156,
    comments: 23,
    isLiked: true,
  },
  {
    id: '3',
    user: {
      id: 'u3',
      username: '요가마스터',
      avatar: null,
      level: 32,
    },
    type: 'level_up',
    title: '레벨 32 달성!',
    description: '새로운 칭호: 불멸의 수호자',
    timestamp: '3시간 전',
    likes: 89,
    comments: 12,
    isLiked: false,
  },
  {
    id: '4',
    user: {
      id: 'u4',
      username: '초보러너',
      avatar: null,
      level: 5,
    },
    type: 'challenge',
    title: '챌린지 완료',
    description: '11월 홈트 챌린지를 완료하고 500 XP를 획득했습니다!',
    timestamp: '5시간 전',
    likes: 45,
    comments: 8,
    isLiked: true,
  },
];

const MOCK_FRIENDS = [
  { id: 'f1', username: '운동왕김철수', avatar: null, level: 25, streak: 45, isOnline: true },
  { id: 'f2', username: '헬스걸', avatar: null, level: 18, streak: 12, isOnline: true },
  { id: 'f3', username: '요가마스터', avatar: null, level: 32, streak: 100, isOnline: false },
  { id: 'f4', username: '초보러너', avatar: null, level: 5, streak: 3, isOnline: false },
];

export default function SocialScreen() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>소셜</Text>
          <Pressable style={styles.addButton}>
            <Ionicons name="person-add-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
              피드
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
              친구
            </Text>
          </Pressable>
        </View>

        {activeTab === 'feed' ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.feedContainer}
          >
            {MOCK_FEED.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.friendsContainer}
          >
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                placeholder="친구 검색..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Online Friends */}
            <Text style={styles.sectionTitle}>온라인 친구</Text>
            {MOCK_FRIENDS.filter((f) => f.isOnline).map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}

            {/* All Friends */}
            <Text style={styles.sectionTitle}>모든 친구</Text>
            {MOCK_FRIENDS.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeedCard({ item }: { item: any }) {
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item.likes);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return '💪';
      case 'achievement':
        return '🏆';
      case 'level_up':
        return '⬆️';
      case 'challenge':
        return '🎯';
      default:
        return '📝';
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <View style={styles.feedCard}>
      <View style={styles.feedHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.user.username.charAt(0)}
            </Text>
          </View>
          <View>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{item.user.username}</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{item.user.level}</Text>
              </View>
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        <Pressable>
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748B" />
        </Pressable>
      </View>

      <View style={styles.feedContent}>
        <View style={styles.feedTypeContainer}>
          <Text style={styles.feedTypeIcon}>{getTypeIcon(item.type)}</Text>
          <Text style={styles.feedTitle}>{item.title}</Text>
        </View>
        <Text style={styles.feedDescription}>{item.description}</Text>
      </View>

      <View style={styles.feedActions}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#EF4444' : '#64748B'}
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {likeCount}
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </Pressable>
        <Pressable style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#64748B" />
        </Pressable>
      </View>
    </View>
  );
}

function FriendCard({ friend }: { friend: any }) {
  return (
    <Pressable style={styles.friendCard}>
      <View style={styles.friendAvatarContainer}>
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {friend.username.charAt(0)}
          </Text>
        </View>
        {friend.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <View style={styles.friendLevelBadge}>
            <Text style={styles.friendLevelText}>Lv.{friend.level}</Text>
          </View>
        </View>
        <View style={styles.friendStats}>
          <Text style={styles.friendStreak}>🔥 {friend.streak}일 연속</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  feedContainer: {
    paddingHorizontal: 20,
  },
  feedCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Medium',
    color: '#6366F1',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  feedContent: {
    marginBottom: 12,
  },
  feedTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedTypeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  feedTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  feedDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  feedActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#64748B',
  },
  actionTextActive: {
    color: '#EF4444',
  },
  friendsContainer: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
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
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-SemiBold',
    color: '#64748B',
    marginBottom: 12,
    marginTop: 8,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  friendLevelBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  friendLevelText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Medium',
    color: '#6366F1',
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendStreak: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
});
