const { PLATFORM_FEE_PERCENTAGE, WAREHOUSE_FEES } = require('../config/constants');

/**
 * Calculate booking pricing breakdown
 * 2% platform fee, 20% downpayment, 80% remaining
 */
const calculateBookingPricing = (dailyRate, totalDays, paymentPlan = 'downpayment', installmentMonths = 0) => {
  const subtotal = parseFloat((dailyRate * totalDays).toFixed(2));
  
  // FIXED: Always use 2% platform fee
  const platformFee = parseFloat((subtotal * 0.02).toFixed(2));
  const totalAmount = parseFloat((subtotal + platformFee).toFixed(2));
  
  // Calculate downpayment (20%) and remaining (80%)
  const downpayment = parseFloat((totalAmount * 0.20).toFixed(2));
  const remainingBalance = parseFloat((totalAmount - downpayment).toFixed(2));
  
  let monthlyPayment = null;
  if (paymentPlan === 'installment' && installmentMonths > 0) {
    monthlyPayment = parseFloat((totalAmount / installmentMonths).toFixed(2));
  }

  return {
    subtotal,
    platformFee,
    totalAmount,
    downpayment,
    remainingBalance,
    monthlyPayment,
    paymentPlan
  };
};

/**
 * Calculate owner payout from a booking
 */
const calculateOwnerPayout = (bookingSubtotal, platformFee, warehouseFee = 0, lateFeeOwnerShare = 0, damageDeduction = 0) => {
  const netPayout = parseFloat((
    bookingSubtotal - 
    platformFee - 
    warehouseFee - 
    damageDeduction + 
    lateFeeOwnerShare
  ).toFixed(2));

  return {
    rentalAmount: bookingSubtotal,
    platformFee,
    warehouseFee,
    lateFeeOwnerShare,
    damageDeduction,
    netPayout: Math.max(0, netPayout)
  };
};

/**
 * Calculate refund amount based on cancellation timing
 */
const calculateRefundAmount = (totalAmount, hoursUntilPickup, cancellationWindowHours = 24) => {
  if (hoursUntilPickup >= cancellationWindowHours) {
    return parseFloat(totalAmount.toFixed(2));
  } else if (hoursUntilPickup > 0) {
    return parseFloat((totalAmount * 0.5).toFixed(2));
  } else {
    return 0;
  }
};

/**
 * Get warehouse fee by city/branch
 */
const getWarehouseFee = (cityName) => {
  return WAREHOUSE_FEES[cityName] || WAREHOUSE_FEES['Manila'];
};

/**
 * Calculate late fee shares
 */
const calculateLateFeeShares = (totalLateFee) => {
  const ownerShare = parseFloat((totalLateFee * 0.5).toFixed(2));
  const platformShare = parseFloat((totalLateFee * 0.5).toFixed(2));
  
  return {
    ownerShare,
    platformShare
  };
};

/**
 * Calculate installment payment amount
 */
const calculateInstallmentPayment = (totalAmount, installmentNumber, totalInstallments) => {
  const basePayment = parseFloat((totalAmount / totalInstallments).toFixed(2));
  
  if (installmentNumber === totalInstallments) {
    const previousPayments = basePayment * (totalInstallments - 1);
    return parseFloat((totalAmount - previousPayments).toFixed(2));
  }
  
  return basePayment;
};

module.exports = {
  calculateBookingPricing,
  calculateOwnerPayout,
  calculateRefundAmount,
  getWarehouseFee,
  calculateLateFeeShares,
  calculateInstallmentPayment
};