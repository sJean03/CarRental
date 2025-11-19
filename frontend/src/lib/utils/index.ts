// Barrel file to re-export utility functions so imports like '@/lib/utils' work
export * from './utils';
export * from './cloudinary';

// Explicitly export number formatting helpers (prefer the compact/full implementations)
export {
	formatNumberCompact,
	formatNumberFull,
	formatCurrency,
	formatCurrencyFull,
} from './formatNumber';

// Re-export date & other formatters but avoid re-exporting a conflicting `formatCurrency`.
export {
	formatDate,
	formatDateRange,
	formatRelativeTime,
	calculateDays,
	getInitials,
} from './formatters';

export * from './formatNumber';
export * from './constants';
