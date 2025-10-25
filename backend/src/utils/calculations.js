const { PLATFORM_FEE_PERCENTAGE, WAREHOUSE_FEES } = require('../config/constants');

/**
 * Calculate booking pricing breakdown
 */
const calculateBookingPricing = (dailyRate, totalDays, paymentPlan = 'full', installmentMonths = 0) => {
  const subtotal = parseFloat((dailyRate * totalDays).toFixed(2));
  const platformFee = parseFloat((subtotal * PLATFORM_FEE_PERCENTAGE).toFixed(2));
  const totalAmount = parseFloat((subtotal + platformFee).toFixed(2));
  
  let monthlyPayment = null;
  if (paymentPlan === 'installment' && installmentMonths > 0) {
    monthlyPayment = parseFloat((totalAmount / installmentMonths).toFixed(2));
  }

  return {
    subtotal,
    platformFee,
    totalAmount,
    monthlyPayment
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
    netPayout: Math.max(0, netPayout) // Ensure never negative
  };
};

/**
 * Calculate refund amount based on cancellation timing
 */
const calculateRefundAmount = (totalAmount, hoursUntilPickup, cancellationWindowHours = 24) => {
  if (hoursUntilPickup >= cancellationWindowHours) {
    // Full refund if cancelled with enough notice
    return parseFloat(totalAmount.toFixed(2));
  } else if (hoursUntilPickup > 0) {
    // Partial refund (50%) if cancelled within window but before pickup
    return parseFloat((totalAmount * 0.5).toFixed(2));
  } else {
    // No refund if cancelled after pickup time
    return 0;
  }
};

/**
 * Get warehouse fee by city/branch
 */
const getWarehouseFee = (cityName) => {
  return WAREHOUSE_FEES[cityName] || WAREHOUSE_FEES['Manila']; // Default to Manila
};

/**
 * Calculate late fee (owner gets 50%, platform gets 50%)
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
  
  // For the last installment, account for rounding differences
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