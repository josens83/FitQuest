import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * Format duration in seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human readable (e.g., "20분", "1시간 30분")
 */
export function formatDurationReadable(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  }
  return `${mins}분`;
}

/**
 * Format minutes to human readable
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

/**
 * Format calories with unit
 */
export function formatCalories(calories: number): string {
  return `${calories.toLocaleString()} kcal`;
}

/**
 * Format large numbers (e.g., 1500 -> 1.5K)
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  if (num < 10000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000) return `${Math.floor(num / 1000)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Format XP with unit
 */
export function formatXP(xp: number): string {
  return `${xp.toLocaleString()} XP`;
}

/**
 * Format weight in kg
 */
export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

/**
 * Format height in cm
 */
export function formatHeight(cm: number): string {
  return `${cm} cm`;
}

/**
 * Format distance in km
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date to Korean locale
 */
export function formatDate(date: Date | string, formatStr = 'yyyy년 M월 d일'): string {
  return format(new Date(date), formatStr, { locale: ko });
}

/**
 * Format date to relative time (e.g., "3분 전")
 */
export function formatRelativeTime(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
}

/**
 * Format time only (e.g., "오후 3:30")
 */
export function formatTime(date: Date | string): string {
  return format(new Date(date), 'a h:mm', { locale: ko });
}

/**
 * Format date range
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'd일', { locale: ko })}`;
    }
    return `${format(start, 'M월 d일', { locale: ko })} - ${format(end, 'M월 d일', { locale: ko })}`;
  }
  return `${format(start, 'yyyy.M.d', { locale: ko })} - ${format(end, 'yyyy.M.d', { locale: ko })}`;
}

/**
 * Get days remaining until a date
 */
export function getDaysRemaining(endDate: Date | string): number {
  return Math.max(0, differenceInDays(new Date(endDate), new Date()));
}

/**
 * Format streak display
 */
export function formatStreak(days: number): string {
  if (days === 0) return '오늘 시작하세요!';
  return `${days}일 연속`;
}

/**
 * Format price in KRW
 */
export function formatPrice(amount: number): string {
  return `₩${amount.toLocaleString()}`;
}

/**
 * Format rank with suffix
 */
export function formatRank(rank: number): string {
  return `${rank.toLocaleString()}위`;
}

/**
 * Format rating with star
 */
export function formatRating(rating: number): string {
  return `⭐ ${rating.toFixed(1)}`;
}

/**
 * Get workout category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    strength: '근력',
    cardio: '유산소',
    hiit: 'HIIT',
    yoga: '요가',
    pilates: '필라테스',
    stretching: '스트레칭',
    dance: '댄스',
    boxing: '복싱',
    meditation: '명상',
    posture: '자세교정',
    running: '러닝',
  };
  return names[category] || category;
}

/**
 * Get difficulty display name
 */
export function getDifficultyDisplayName(difficulty: string): string {
  const names: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
  };
  return names[difficulty] || difficulty;
}

/**
 * Get body part display name
 */
export function getBodyPartDisplayName(bodyPart: string): string {
  const names: Record<string, string> = {
    full_body: '전신',
    upper_body: '상체',
    lower_body: '하체',
    core: '코어',
    arms: '팔',
    chest: '가슴',
    back: '등',
    shoulders: '어깨',
    legs: '다리',
    glutes: '엉덩이',
  };
  return names[bodyPart] || bodyPart;
}

/**
 * Get equipment display name
 */
export function getEquipmentDisplayName(equipment: string): string {
  const names: Record<string, string> = {
    none: '맨몸',
    mat: '매트',
    dumbbell: '덤벨',
    kettlebell: '케틀벨',
    resistance_band: '밴드',
    pull_up_bar: '철봉',
    foam_roller: '폼롤러',
    jump_rope: '줄넘기',
    yoga_block: '요가 블록',
    barbell: '바벨',
    bench: '벤치',
  };
  return names[equipment] || equipment;
}
