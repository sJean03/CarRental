const { differenceInDays, addDays, format, parseISO, isAfter, isBefore } = require('date-fns');

/**
 * Calculate number of days between two dates (inclusive)
 */
const calculateDaysBetween = (startDate, endDate) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start) + 1; // +1 to include both start and end day
};

/**
 * Check if a date range overlaps with another date range
 */
const checkDateOverlap = (range1Start, range1End, range2Start, range2End) => {
  const r1Start = typeof range1Start === 'string' ? parseISO(range1Start) : range1Start;
  const r1End = typeof range1End === 'string' ? parseISO(range1End) : range1End;
  const r2Start = typeof range2Start === 'string' ? parseISO(range2Start) : range2Start;
  const r2End = typeof range2End === 'string' ? parseISO(range2End) : range2End;

  return (isBefore(r1Start, r2End) || r1Start.getTime() === r2End.getTime()) && 
         (isAfter(r1End, r2Start) || r1End.getTime() === r2Start.getTime());
};

/**
 * Format date to SQL date format (YYYY-MM-DD)
 */
const formatToSQLDate = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

/**
 * Add days to a date
 */
const addDaysToDate = (date, days) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addDays(d, days);
};

/**
 * Check if date is in the past
 */
const isDateInPast = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
};

/**
 * Check if date is in the future
 */
const isDateInFuture = (date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
};

/**
 * Calculate late fee based on days late and daily rate
 */
const calculateLateFee = (daysLate, dailyRate, multiplier = 1.0) => {
  if (daysLate <= 0) return 0;
  return daysLate * dailyRate * multiplier;
};

module.exports = {
  calculateDaysBetween,
  checkDateOverlap,
  formatToSQLDate,
  addDaysToDate,
  isDateInPast,
  isDateInFuture,
  calculateLateFee
};