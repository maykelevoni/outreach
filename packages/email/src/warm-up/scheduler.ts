/**
 * Email Warm-up Schedule System
 *
 * Progressively increases daily email sending limits over 30 days
 * to build sender reputation and avoid spam filters
 */

export interface WarmUpSchedule {
  day: number
  dailyLimit: number
  hourlyLimit: number
  minDelayMinutes: number
  maxDelayMinutes: number
}

// 30-day warm-up schedule
export const WARMUP_SCHEDULE: WarmUpSchedule[] = [
  // Week 1 (Days 1-7): Very conservative
  { day: 1, dailyLimit: 5, hourlyLimit: 1, minDelayMinutes: 30, maxDelayMinutes: 60 },
  { day: 2, dailyLimit: 5, hourlyLimit: 1, minDelayMinutes: 30, maxDelayMinutes: 60 },
  { day: 3, dailyLimit: 5, hourlyLimit: 1, minDelayMinutes: 30, maxDelayMinutes: 60 },
  { day: 4, dailyLimit: 5, hourlyLimit: 1, minDelayMinutes: 30, maxDelayMinutes: 60 },
  { day: 5, dailyLimit: 5, hourlyLimit: 1, minDelayMinutes: 30, maxDelayMinutes: 60 },
  { day: 6, dailyLimit: 10, hourlyLimit: 2, minDelayMinutes: 20, maxDelayMinutes: 40 },
  { day: 7, dailyLimit: 10, hourlyLimit: 2, minDelayMinutes: 20, maxDelayMinutes: 40 },

  // Week 2 (Days 8-14): Gradual increase
  { day: 8, dailyLimit: 10, hourlyLimit: 2, minDelayMinutes: 20, maxDelayMinutes: 40 },
  { day: 9, dailyLimit: 10, hourlyLimit: 2, minDelayMinutes: 20, maxDelayMinutes: 40 },
  { day: 10, dailyLimit: 10, hourlyLimit: 2, minDelayMinutes: 20, maxDelayMinutes: 40 },
  { day: 11, dailyLimit: 20, hourlyLimit: 3, minDelayMinutes: 15, maxDelayMinutes: 30 },
  { day: 12, dailyLimit: 20, hourlyLimit: 3, minDelayMinutes: 15, maxDelayMinutes: 30 },
  { day: 13, dailyLimit: 20, hourlyLimit: 3, minDelayMinutes: 15, maxDelayMinutes: 30 },
  { day: 14, dailyLimit: 20, hourlyLimit: 3, minDelayMinutes: 15, maxDelayMinutes: 30 },

  // Week 3 (Days 15-21): Moderate increase
  { day: 15, dailyLimit: 20, hourlyLimit: 3, minDelayMinutes: 15, maxDelayMinutes: 30 },
  { day: 16, dailyLimit: 40, hourlyLimit: 5, minDelayMinutes: 10, maxDelayMinutes: 20 },
  { day: 17, dailyLimit: 40, hourlyLimit: 5, minDelayMinutes: 10, maxDelayMinutes: 20 },
  { day: 18, dailyLimit: 40, hourlyLimit: 5, minDelayMinutes: 10, maxDelayMinutes: 20 },
  { day: 19, dailyLimit: 40, hourlyLimit: 5, minDelayMinutes: 10, maxDelayMinutes: 20 },
  { day: 20, dailyLimit: 40, hourlyLimit: 5, minDelayMinutes: 10, maxDelayMinutes: 20 },
  { day: 21, dailyLimit: 60, hourlyLimit: 7, minDelayMinutes: 8, maxDelayMinutes: 15 },

  // Week 4 (Days 22-28): Higher volume
  { day: 22, dailyLimit: 60, hourlyLimit: 7, minDelayMinutes: 8, maxDelayMinutes: 15 },
  { day: 23, dailyLimit: 60, hourlyLimit: 7, minDelayMinutes: 8, maxDelayMinutes: 15 },
  { day: 24, dailyLimit: 60, hourlyLimit: 7, minDelayMinutes: 8, maxDelayMinutes: 15 },
  { day: 25, dailyLimit: 60, hourlyLimit: 7, minDelayMinutes: 8, maxDelayMinutes: 15 },
  { day: 26, dailyLimit: 80, hourlyLimit: 10, minDelayMinutes: 5, maxDelayMinutes: 10 },
  { day: 27, dailyLimit: 80, hourlyLimit: 10, minDelayMinutes: 5, maxDelayMinutes: 10 },
  { day: 28, dailyLimit: 80, hourlyLimit: 10, minDelayMinutes: 5, maxDelayMinutes: 10 },

  // Days 29-30: Final ramp-up
  { day: 29, dailyLimit: 100, hourlyLimit: 12, minDelayMinutes: 5, maxDelayMinutes: 10 },
  { day: 30, dailyLimit: 100, hourlyLimit: 12, minDelayMinutes: 5, maxDelayMinutes: 10 },
]

// Post warm-up (Day 31+): Full capacity
export const POST_WARMUP_SCHEDULE: WarmUpSchedule = {
  day: 31,
  dailyLimit: 100,
  hourlyLimit: 12,
  minDelayMinutes: 2,
  maxDelayMinutes: 5,
}

export class WarmUpScheduler {
  private startDate: Date

  constructor(startDate?: Date) {
    this.startDate = startDate || new Date()
  }

  /**
   * Get current day number in warm-up schedule (1-30+)
   */
  getCurrentDay(): number {
    const now = new Date()
    const diffTime = now.getTime() - this.startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays)
  }

  /**
   * Get schedule for current day
   */
  getCurrentSchedule(): WarmUpSchedule {
    const currentDay = this.getCurrentDay()

    if (currentDay > 30) {
      return POST_WARMUP_SCHEDULE
    }

    return WARMUP_SCHEDULE[currentDay - 1] || WARMUP_SCHEDULE[0]
  }

  /**
   * Get schedule for specific day
   */
  getScheduleForDay(day: number): WarmUpSchedule {
    if (day > 30) {
      return POST_WARMUP_SCHEDULE
    }

    return WARMUP_SCHEDULE[day - 1] || WARMUP_SCHEDULE[0]
  }

  /**
   * Check if can send email based on current limits
   */
  canSendEmail(sentToday: number, sentThisHour: number): boolean {
    const schedule = this.getCurrentSchedule()
    return sentToday < schedule.dailyLimit && sentThisHour < schedule.hourlyLimit
  }

  /**
   * Get random delay in milliseconds
   */
  getRandomDelay(): number {
    const schedule = this.getCurrentSchedule()
    const min = schedule.minDelayMinutes * 60 * 1000
    const max = schedule.maxDelayMinutes * 60 * 1000
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Get next available send time
   */
  getNextAvailableTime(sentToday: number, sentThisHour: number): Date | null {
    const schedule = this.getCurrentSchedule()

    // Daily limit reached, wait until tomorrow
    if (sentToday >= schedule.dailyLimit) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0) // Start at 9 AM next day
      return tomorrow
    }

    // Hourly limit reached, wait until next hour
    if (sentThisHour >= schedule.hourlyLimit) {
      const nextHour = new Date()
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
      return nextHour
    }

    // Can send now with delay
    const delay = this.getRandomDelay()
    const nextTime = new Date(Date.now() + delay)
    return nextTime
  }

  /**
   * Check if warm-up is complete
   */
  isWarmUpComplete(): boolean {
    return this.getCurrentDay() > 30
  }

  /**
   * Get warm-up progress percentage
   */
  getProgress(): number {
    const currentDay = this.getCurrentDay()
    return Math.min(100, (currentDay / 30) * 100)
  }

  /**
   * Get stats for current day
   */
  getStats() {
    const currentDay = this.getCurrentDay()
    const schedule = this.getCurrentSchedule()
    const progress = this.getProgress()
    const isComplete = this.isWarmUpComplete()

    return {
      currentDay,
      dailyLimit: schedule.dailyLimit,
      hourlyLimit: schedule.hourlyLimit,
      progress,
      isComplete,
      startDate: this.startDate,
    }
  }
}

// Helper function to create scheduler
export function createWarmUpScheduler(startDate?: Date): WarmUpScheduler {
  return new WarmUpScheduler(startDate)
}
