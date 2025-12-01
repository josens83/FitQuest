import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

const GOALS = [
  { id: 'weight_loss', icon: '🔥', label: '체중 감량', description: '칼로리 소모 중심' },
  { id: 'muscle_gain', icon: '💪', label: '근력 강화', description: '근육량 증가' },
  { id: 'flexibility', icon: '🧘', label: '유연성', description: '스트레칭 & 요가' },
  { id: 'endurance', icon: '🏃', label: '체력 향상', description: '지구력 강화' },
  { id: 'health', icon: '❤️', label: '건강 유지', description: '균형잡힌 운동' },
];

const LEVELS = [
  { id: 'beginner', icon: '🌱', label: '입문자', description: '운동을 처음 시작해요' },
  { id: 'intermediate', icon: '🌿', label: '중급자', description: '기본기는 있어요' },
  { id: 'advanced', icon: '🌳', label: '고급자', description: '꾸준히 운동해왔어요' },
];

const DAYS = [
  { id: 1, label: '1-2일' },
  { id: 2, label: '3-4일' },
  { id: 3, label: '5일 이상' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(0);

  const toggleGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : prev.length < 3
          ? [...prev, goalId]
          : prev
    );
  };

  const handleComplete = async () => {
    // TODO: Save onboarding data to server
    router.replace('/(tabs)');
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedGoals.length > 0;
      case 2:
        return selectedLevel !== '';
      case 3:
        return selectedDays > 0;
      default:
        return false;
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.progressBar, s <= step && styles.progressBarActive]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.stepContent}
            >
              <Text style={styles.title}>운동 목표를{'\n'}선택해주세요</Text>
              <Text style={styles.subtitle}>최대 3개까지 선택할 수 있어요</Text>

              <View style={styles.optionGrid}>
                {GOALS.map((goal) => (
                  <Pressable
                    key={goal.id}
                    style={[
                      styles.optionCard,
                      selectedGoals.includes(goal.id) && styles.optionCardSelected,
                    ]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    <Text style={styles.optionIcon}>{goal.icon}</Text>
                    <Text style={styles.optionLabel}>{goal.label}</Text>
                    <Text style={styles.optionDescription}>{goal.description}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.stepContent}
            >
              <Text style={styles.title}>현재 운동 수준을{'\n'}알려주세요</Text>
              <Text style={styles.subtitle}>맞춤 운동을 추천해드릴게요</Text>

              <View style={styles.levelList}>
                {LEVELS.map((level) => (
                  <Pressable
                    key={level.id}
                    style={[
                      styles.levelCard,
                      selectedLevel === level.id && styles.levelCardSelected,
                    ]}
                    onPress={() => setSelectedLevel(level.id)}
                  >
                    <Text style={styles.levelIcon}>{level.icon}</Text>
                    <View style={styles.levelText}>
                      <Text style={styles.levelLabel}>{level.label}</Text>
                      <Text style={styles.levelDescription}>{level.description}</Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        selectedLevel === level.id && styles.radioSelected,
                      ]}
                    >
                      {selectedLevel === level.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {step === 3 && (
            <Animated.View
              entering={FadeInRight}
              exiting={FadeOutLeft}
              style={styles.stepContent}
            >
              <Text style={styles.title}>일주일에 몇 번{'\n'}운동하실 건가요?</Text>
              <Text style={styles.subtitle}>목표에 맞는 플랜을 추천해드릴게요</Text>

              <View style={styles.daysContainer}>
                {DAYS.map((day) => (
                  <Pressable
                    key={day.id}
                    style={[
                      styles.dayCard,
                      selectedDays === day.id && styles.dayCardSelected,
                    ]}
                    onPress={() => setSelectedDays(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        selectedDays === day.id && styles.dayLabelSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>🎯 나의 프로필</Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>목표</Text>
                  <Text style={styles.summaryValue}>
                    {GOALS.filter((g) => selectedGoals.includes(g.id))
                      .map((g) => g.label)
                      .join(', ')}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>레벨</Text>
                  <Text style={styles.summaryValue}>
                    {LEVELS.find((l) => l.id === selectedLevel)?.label || '-'}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>주간 운동</Text>
                  <Text style={styles.summaryValue}>
                    {DAYS.find((d) => d.id === selectedDays)?.label || '-'}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Button */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
            onPress={() => (step < 3 ? setStep(step + 1) : handleComplete())}
            disabled={!canProceed()}
          >
            <LinearGradient
              colors={canProceed() ? ['#6366F1', '#8B5CF6'] : ['#374151', '#374151']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {step < 3 ? '다음' : '시작하기'}
              </Text>
            </LinearGradient>
          </Pressable>

          {step > 1 && (
            <Pressable style={styles.backLink} onPress={() => setStep(step - 1)}>
              <Text style={styles.backLinkText}>이전으로</Text>
            </Pressable>
          )}
        </View>
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
    paddingHorizontal: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressBarActive: {
    backgroundColor: '#6366F1',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stepContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
    marginBottom: 32,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  optionCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  levelList: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
  },
  levelCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  levelIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  levelText: {
    flex: 1,
  },
  levelLabel: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#6366F1',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366F1',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dayCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 20,
    alignItems: 'center',
  },
  dayCardSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  dayLabel: {
    fontSize: 16,
    fontFamily: 'Pretendard-SemiBold',
    color: '#94A3B8',
  },
  dayLabelSelected: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#FFFFFF',
  },
  buttonContainer: {
    paddingVertical: 24,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Pretendard-SemiBold',
    color: '#FFFFFF',
  },
  backLink: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backLinkText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#64748B',
  },
});
