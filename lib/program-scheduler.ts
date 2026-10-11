/**
 * GAMI Program Scheduler
 * Automatically generates programs/events based on recurring schedules
 */

import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, isFriday, isSunday, getDay, getDate, getMonth, getYear, setDate, setMonth, setYear } from 'date-fns';

/**
 * Calculate Easter Sunday for a given year (Western/Christian)
 * Using the Anonymous Gregorian algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

export interface ProgramEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  location?: string;
  category: 'weekly' | 'monthly' | 'yearly' | 'special';
  recurringRule?: string;
}

export interface ProgramConfig {
  weeklyServices: {
    sunday: { time: string; title: string; location?: string };
    tuesday: { time: string; title: string; location?: string };
    thursday: { time: string; title: string; location?: string };
  };
  monthlyEvents: {
    praiseNightFirstFriday: { title: string; time: string; location?: string };
    praiseNightLastFriday: { title: string; time: string; location?: string };
    sundayThanksgiving: { title: string; time: string; location?: string };
  };
  yearlyEvents: {
    shilohDay: { date: string; title: string; startTime: string; endTime: string; location?: string };
    easterWeekend: { title: string; startTime: string; endTime: string; location?: string };
    independenceDay: { date: string; title: string; startTime: string; endTime: string; location?: string };
  };
}

export const DEFAULT_CONFIG: ProgramConfig = {
  weeklyServices: {
    sunday: { time: '09:30', title: 'Sunday Celebration Service', location: 'Main Auditorium' },
    tuesday: { time: '17:30', title: 'Midweek Bible Study', location: 'Chapel Hall' },
    thursday: { time: '17:30', title: 'Prayer & Fellowship', location: 'Prayer Room' },
  },
  monthlyEvents: {
    praiseNightFirstFriday: { title: 'Praise Night', time: '19:00', location: 'Main Auditorium' },
    praiseNightLastFriday: { title: 'Praise Night', time: '19:00', location: 'Main Auditorium' },
    sundayThanksgiving: { title: 'Sunday Thanksgiving', time: '09:30', location: 'Main Auditorium' },
  },
  yearlyEvents: {
    shilohDay: { date: '05-25', title: 'SHILOH DAY - 12 Hours with God', startTime: '08:00', endTime: '20:00', location: 'Main Auditorium' },
    easterWeekend: { title: 'Prayer and Discipleship Training', startTime: '09:00', endTime: '17:00', location: 'Main Auditorium' },
    independenceDay: { date: '10-01', title: '7 Hours with God', startTime: '06:00', endTime: '13:00', location: 'Main Auditorium' },
  },
};

/**
 * Get Easter Sunday for a given year
 */
function getEasterDate(year: number): Date {
  return calculateEaster(year);
}

/**
 * Get Good Friday for a given year
 */
function getGoodFriday(year: number): Date {
  const easterDate = calculateEaster(year);
  return addDays(easterDate, -2);
}

/**
 * Get Easter Sunday
 */
function getEasterSunday(year: number): Date {
  return calculateEaster(year);
}

/**
 * Get Easter Monday
 */
function getEasterMonday(year: number): Date {
  return addDays(getEasterDate(year), 1);
}

/**
 * Get first Friday of a month
 */
function getFirstFriday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 5 = Friday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  return addDays(firstDay, daysUntilFriday);
}

/**
 * Get last Friday of a month
 */
function getLastFriday(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of month
  const dayOfWeek = lastDay.getDay();
  const daysSinceFriday = (dayOfWeek - 5 + 7) % 7;
  return addDays(lastDay, -daysSinceFriday);
}

/**
 * Get first Sunday of a month
 */
function getFirstSunday(year: number, month: number): Date {
  const firstDay = new Date(year, month, 1);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  return addDays(firstDay, daysUntilSunday);
}

/**
 * Generate all programs for a given date range
 */
export function generatePrograms(
  startDate: Date,
  endDate: Date,
  config: ProgramConfig = DEFAULT_CONFIG
): ProgramEvent[] {
  const events: ProgramEvent[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dayOfMonth = currentDate.getDate();
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday
    
    // Weekly services
    if (dayOfWeek === 0) { // Sunday
      events.push(createEvent(
        currentDate,
        config.weeklyServices.sunday.title,
        config.weeklyServices.sunday.time,
        '09:30', // Default end time 30 min after start
        config.weeklyServices.sunday.location,
        'weekly',
        'weekly-sunday'
      ));
    }
    
    if (dayOfWeek === 2) { // Tuesday
      events.push(createEvent(
        currentDate,
        config.weeklyServices.tuesday.title,
        config.weeklyServices.tuesday.time,
        '19:00', // Default end time 1.5 hours
        config.weeklyServices.tuesday.location,
        'weekly',
        'weekly-tuesday'
      ));
    }
    
    if (dayOfWeek === 4) { // Thursday
      events.push(createEvent(
        currentDate,
        config.weeklyServices.thursday.title,
        config.weeklyServices.thursday.time,
        '19:00',
        config.weeklyServices.thursday.location,
        'weekly',
        'weekly-thursday'
      ));
    }
    
    // Monthly: First Friday - Praise Night
    const firstFriday = getFirstFriday(currentDate.getFullYear(), currentDate.getMonth());
    if (isSameDay(currentDate, firstFriday)) {
      events.push(createEvent(
        currentDate,
        config.monthlyEvents.praiseNightFirstFriday.title,
        config.monthlyEvents.praiseNightFirstFriday.time,
        '21:00',
        config.monthlyEvents.praiseNightFirstFriday.location,
        'monthly',
        'praise-night-first-friday'
      ));
    }
    
    // Monthly: Last Friday - Praise Night
    const lastFriday = getLastFriday(currentDate.getFullYear(), currentDate.getMonth());
    if (isSameDay(currentDate, lastFriday)) {
      events.push(createEvent(
        currentDate,
        config.monthlyEvents.praiseNightLastFriday.title,
        config.monthlyEvents.praiseNightLastFriday.time,
        '21:00',
        config.monthlyEvents.praiseNightLastFriday.location,
        'monthly',
        'praise-night-last-friday'
      ));
    }
    
    // Monthly: First Sunday - Thanksgiving
    const firstSunday = getFirstSunday(currentDate.getFullYear(), currentDate.getMonth());
    if (isSameDay(currentDate, firstSunday)) {
      events.push(createEvent(
        currentDate,
        config.monthlyEvents.sundayThanksgiving.title,
        config.monthlyEvents.sundayThanksgiving.time,
        '11:00',
        config.monthlyEvents.sundayThanksgiving.location,
        'monthly',
        'sunday-thanksgiving'
      ));
    }
    
    // Yearly: SHILOH DAY - May 25
    if (month === 4 && dayOfMonth === 25) { // May is month 4 (0-indexed)
      events.push(createEvent(
        currentDate,
        config.yearlyEvents.shilohDay.title,
        config.yearlyEvents.shilohDay.startTime,
        config.yearlyEvents.shilohDay.endTime,
        config.yearlyEvents.shilohDay.location,
        'yearly',
        'shiloh-day'
      ));
    }
    
    // Yearly: Independence Day - October 1
    if (month === 9 && dayOfMonth === 1) { // October is month 9
      events.push(createEvent(
        currentDate,
        config.yearlyEvents.independenceDay.title,
        config.yearlyEvents.independenceDay.startTime,
        config.yearlyEvents.independenceDay.endTime,
        config.yearlyEvents.independenceDay.location,
        'yearly',
        'independence-day'
      ));
    }
    
    // Easter Weekend (Good Friday to Easter Monday)
    const goodFriday = getGoodFriday(year);
    const easterSunday = getEasterSunday(year);
    const easterMonday = getEasterMonday(year);
    
    if (isSameDay(currentDate, goodFriday) || 
        isSameDay(currentDate, easterSunday) || 
        isSameDay(currentDate, easterMonday)) {
      events.push(createEvent(
        currentDate,
        config.yearlyEvents.easterWeekend.title,
        config.yearlyEvents.easterWeekend.startTime,
        config.yearlyEvents.easterWeekend.endTime,
        config.yearlyEvents.easterWeekend.location,
        'special',
        `easter-weekend-${year}`
      ));
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return events;
}

function createEvent(
  date: Date,
  title: string,
  startTime: string,
  endTime: string,
  location?: string,
  category: 'weekly' | 'monthly' | 'yearly' | 'special' = 'weekly',
  recurringRule?: string
): ProgramEvent {
  const [startHour = 0, startMinute = 0] = startTime.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(':').map(Number);
  
  const startDate = new Date(date);
  startDate.setHours(startHour, startMinute, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(endHour, endMinute, 0, 0);
  
  return {
    id: `${title.toLowerCase().replace(/\s+/g, '-')}-${format(date, 'yyyy-MM-dd')}`,
    title,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    category,
    recurringRule,
  };
}

/**
 * Get all programs for a specific month
 */
export function getProgramsForMonth(
  year: number,
  month: number, // 0-indexed
  config: ProgramConfig = DEFAULT_CONFIG
): ProgramEvent[] {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // Last day of month
  return generatePrograms(startDate, endDate, config);
}

/**
 * Get all programs for a specific year
 */
export function getProgramsForYear(
  year: number,
  config: ProgramConfig = DEFAULT_CONFIG
): ProgramEvent[] {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  return generatePrograms(startDate, endDate, config);
}

/**
 * Get upcoming programs from today
 */
export function getUpcomingPrograms(
  days: number = 30,
  config: ProgramConfig = DEFAULT_CONFIG
): ProgramEvent[] {
  const startDate = new Date();
  const endDate = addDays(new Date(), days);
  return generatePrograms(startDate, endDate, config);
}

/**
 * Get programs for a specific date
 */
export function getProgramsForDate(
  date: Date,
  config: ProgramConfig = DEFAULT_CONFIG
): ProgramEvent[] {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  return generatePrograms(startDate, endDate, config);
}

export { addDays, format, isSameDay };