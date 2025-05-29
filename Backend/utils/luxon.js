import { DateTime } from 'luxon';

// Updated timezone options with proper IANA timezone identifiers
const TIMEZONE_OPTIONS = [
  { value: 'Pacific/Midway', label: 'UTC-11 (Midway)', offset: 'UTC-11' },
  { value: 'Pacific/Honolulu', label: 'UTC-10 (Hawaii)', offset: 'UTC-10' },
  { value: 'America/Anchorage', label: 'UTC-9 (Alaska)', offset: 'UTC-9' },
  { value: 'America/Los_Angeles', label: 'UTC-8 (Pacific Time)', offset: 'UTC-8' },
  { value: 'America/Denver', label: 'UTC-7 (Mountain Time)', offset: 'UTC-7' },
  { value: 'America/Chicago', label: 'UTC-6 (Central Time)', offset: 'UTC-6' },
  { value: 'America/New_York', label: 'UTC-5 (Eastern Time)', offset: 'UTC-5' },
  { value: 'America/Halifax', label: 'UTC-4 (Atlantic Time)', offset: 'UTC-4' },
  { value: 'America/St_Johns', label: 'UTC-3:30 (Newfoundland)', offset: 'UTC-3' },
  { value: 'America/Sao_Paulo', label: 'UTC-3 (Brazil)', offset: 'UTC-3' },
  { value: 'Atlantic/South_Georgia', label: 'UTC-2', offset: 'UTC-2' },
  { value: 'Atlantic/Azores', label: 'UTC-1', offset: 'UTC-1' },
  { value: 'UTC', label: 'UTC+0 (GMT)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'UTC+0/+1 (London)', offset: 'UTC+0' },
  { value: 'Europe/Paris', label: 'UTC+1/+2 (Paris)', offset: 'UTC+1' },
  { value: 'Europe/Helsinki', label: 'UTC+2/+3 (Helsinki)', offset: 'UTC+2' },
  { value: 'Europe/Moscow', label: 'UTC+3 (Moscow)', offset: 'UTC+3' },
  { value: 'Asia/Dubai', label: 'UTC+4 (Dubai)', offset: 'UTC+4' },
  { value: 'Asia/Karachi', label: 'UTC+5 (Pakistan)', offset: 'UTC+5' },
  { value: 'Asia/Kolkata', label: 'UTC+5:30 (India)', offset: 'UTC+5' },
  { value: 'Asia/Dhaka', label: 'UTC+6 (Bangladesh)', offset: 'UTC+6' },
  { value: 'Asia/Bangkok', label: 'UTC+7 (Bangkok)', offset: 'UTC+7' },
  { value: 'Asia/Shanghai', label: 'UTC+8 (China)', offset: 'UTC+8' },
  { value: 'Asia/Tokyo', label: 'UTC+9 (Japan)', offset: 'UTC+9' },
  { value: 'Australia/Sydney', label: 'UTC+10/+11 (Sydney)', offset: 'UTC+10' },
  { value: 'Pacific/Auckland', label: 'UTC+12/+13 (New Zealand)', offset: 'UTC+12' }
];

export class LuxonTimezoneManager {
  constructor() {
    this.timezoneMap = new Map();
    TIMEZONE_OPTIONS.forEach(tz => {
      this.timezoneMap.set(tz.offset, tz.value);
    });
  }

  // Convert old UTC offset format to proper timezone
  getTimezoneFromOffset(utcOffset) {
    return this.timezoneMap.get(utcOffset) || 'UTC';
  }

  // Get current time in school's timezone
  getSchoolCurrentTime(schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    return DateTime.now().setZone(properTimezone);
  }

  // Convert any date to school's timezone
  convertToSchoolTime(date, schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    return DateTime.fromJSDate(date).setZone(properTimezone);
  }

  // Convert school time to UTC for database storage
  convertSchoolTimeToUTC(schoolTime, schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    
    // If schoolTime is a string, parse it in the school's timezone
    if (typeof schoolTime === 'string') {
      return DateTime.fromISO(schoolTime, { zone: properTimezone }).toUTC();
    }
    
    // If it's already a DateTime object
    if (schoolTime instanceof DateTime) {
      return schoolTime.setZone(properTimezone).toUTC();
    }
    
    // If it's a JS Date
    return DateTime.fromJSDate(schoolTime).setZone(properTimezone).toUTC();
  }

  // Format date for display in school's timezone
  formatForSchool(date, schoolTimezone, format = 'yyyy-MM-dd HH:mm:ss') {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    
    let dateTime;
    
    // Handle different input types
    if (typeof date === 'string') {
      dateTime = DateTime.fromISO(date);
    } else if (date instanceof DateTime) {
      dateTime = date;
    } else if (date instanceof Date) {
      dateTime = DateTime.fromJSDate(date);
    } else {
      // Try to create from the input as-is
      dateTime = DateTime.fromJSDate(new Date(date));
    }
    
    // Check if the DateTime is valid
    if (!dateTime.isValid) {
      console.warn('Invalid date provided to formatForSchool:', date, dateTime.invalidReason);
      return 'Invalid DateTime';
    }
    
    // Convert to school timezone and format
    const schoolTime = dateTime.setZone(properTimezone);
    
    if (!schoolTime.isValid) {
      console.warn('Invalid timezone conversion:', properTimezone, schoolTime.invalidReason);
      return 'Invalid DateTime';
    }
    
    return schoolTime.toFormat(format);
  }

  // Human-readable format
  formatForSchoolHuman(date, schoolTimezone) {
    const schoolTime = this.convertToSchoolTime(date, schoolTimezone);
    return schoolTime.toLocaleString(DateTime.DATETIME_FULL);
  }

  // Check if date is within school's business hours
  isWithinSchoolHours(date, schoolTimezone, startHour = 8, endHour = 17) {
    const schoolTime = this.convertToSchoolTime(date, schoolTimezone);
    const hour = schoolTime.hour;
    return hour >= startHour && hour < endHour;
  }

  // Get start and end of school day in UTC
  getSchoolDayBounds(date, schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    const schoolDate = DateTime.fromJSDate(date).setZone(properTimezone);
    
    const dayStart = schoolDate.startOf('day');
    const dayEnd = schoolDate.endOf('day');
    
    return {
      start: dayStart.toUTC().toJSDate(),
      end: dayEnd.toUTC().toJSDate()
    };
  }

  // Calculate time difference between school timezone and UTC
  getSchoolTimezoneOffset(schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    const now = DateTime.now().setZone(properTimezone);
    return now.offset; // Returns offset in minutes
  }

  // Check if school is currently in daylight saving time
  isSchoolInDST(schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    const now = DateTime.now().setZone(properTimezone);
    return now.isInDST;
  }

  // Get relative time (e.g., "2 hours ago", "in 3 days")
  getRelativeTime(date, schoolTimezone) {
    const schoolTime = this.convertToSchoolTime(date, schoolTimezone);
    const now = this.getSchoolCurrentTime(schoolTimezone);
    return schoolTime.toRelative({ base: now });
  }

  // Parse date string in school's timezone
  parseInSchoolTimezone(dateString, schoolTimezone, format = 'yyyy-MM-dd') {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    return DateTime.fromFormat(dateString, format, { zone: properTimezone });
  }

  // Create a new date in school timezone
  createSchoolDateTime(year, month, day, hour = 0, minute = 0, schoolTimezone) {
    const properTimezone = this.getTimezoneFromOffset(schoolTimezone);
    return DateTime.fromObject({ year, month, day, hour, minute }, { zone: properTimezone });
  }

  // Format date for form inputs (YYYY-MM-DD)
  formatForInput(date, schoolTimezone) {
    return this.formatForSchool(date, schoolTimezone, 'yyyy-MM-dd');
  }

  // Format time for form inputs (HH:mm)
  formatTimeForInput(date, schoolTimezone) {
    return this.formatForSchool(date, schoolTimezone, 'HH:mm');
  }

  // Format datetime for form inputs (YYYY-MM-DDTHH:mm)
  formatDateTimeForInput(date, schoolTimezone) {
    return this.formatForSchool(date, schoolTimezone, "yyyy-MM-dd'T'HH:mm");
  }

  // Get the difference between two dates in various units
  getDifference(startDate, endDate, unit = 'days') {
    const start = typeof startDate === 'string' ? DateTime.fromISO(startDate) : 
                  startDate instanceof DateTime ? startDate : DateTime.fromJSDate(startDate);
    const end = typeof endDate === 'string' ? DateTime.fromISO(endDate) : 
                endDate instanceof DateTime ? endDate : DateTime.fromJSDate(endDate);
    
    return end.diff(start, unit).as(unit);
  }

  // Get all available timezone options
  static getTimezoneOptions() {
    return TIMEZONE_OPTIONS;
  }

  // Validate if timezone is supported
  isValidTimezone(timezone) {
    try {
      DateTime.now().setZone(timezone);
      return true;
    } catch {
      return false;
    }
  }
}

// Create a singleton instance for use throughout the app
export const timezoneManager = new LuxonTimezoneManager();
