import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/auth';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const register = useAuthStore((state) => state.register);

  const handleNext = () => {
    if (step === 1) {
      if (!username || username.length < 2) {
        Alert.alert('오류', '닉네임은 2자 이상이어야 합니다.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email || !email.includes('@')) {
        Alert.alert('오류', '올바른 이메일을 입력해주세요.');
        return;
      }
      setStep(3);
    }
  };

  const handleSignup = async () => {
    if (!password || password.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, username);
      router.replace('/(auth)/onboarding');
    } catch (error: any) {
      Alert.alert('회원가입 실패', error.message || '다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0F172A', '#1E293B']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Pressable
              style={styles.backButton}
              onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>

            {/* Progress */}
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((s) => (
                <View
                  key={s}
                  style={[
                    styles.progressDot,
                    s <= step && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>

            {/* Step Content */}
            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>모험가 이름을{'\n'}알려주세요</Text>
                  <Text style={styles.subtitle}>
                    다른 플레이어들에게 보여질 이름이에요
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="닉네임 (2-20자)"
                      placeholderTextColor="#64748B"
                      value={username}
                      onChangeText={setUsername}
                      maxLength={20}
                      autoFocus
                    />
                  </View>
                </View>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>이메일을{'\n'}입력해주세요</Text>
                  <Text style={styles.subtitle}>
                    로그인 및 중요 알림에 사용됩니다
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="example@email.com"
                      placeholderTextColor="#64748B"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <View style={styles.header}>
                  <Text style={styles.title}>비밀번호를{'\n'}설정해주세요</Text>
                  <Text style={styles.subtitle}>8자 이상의 비밀번호를 입력해주세요</Text>
                </View>

                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#64748B"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoFocus
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.passwordRequirements}>
                  <PasswordRequirement
                    met={password.length >= 8}
                    text="8자 이상"
                  />
                  <PasswordRequirement
                    met={/[A-Za-z]/.test(password)}
                    text="영문 포함"
                  />
                  <PasswordRequirement
                    met={/[0-9]/.test(password)}
                    text="숫자 포함"
                  />
                </View>
              </View>
            )}

            {/* Button */}
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.nextButton, isLoading && styles.buttonDisabled]}
                onPress={step < 3 ? handleNext : handleSignup}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>
                    {isLoading
                      ? '처리 중...'
                      : step < 3
                        ? '다음'
                        : '모험 시작하기'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirement}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={16}
        color={met ? '#22C55E' : '#64748B'}
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 40,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  stepContent: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Pretendard-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#94A3B8',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Pretendard-Regular',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  passwordRequirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requirementText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Regular',
    color: '#64748B',
  },
  requirementMet: {
    color: '#22C55E',
  },
  buttonContainer: {
    paddingVertical: 24,
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
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
});
