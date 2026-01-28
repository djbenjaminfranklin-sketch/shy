export * from './intentions';
export * from './availability';
export * from './interests';
export * from './hairColors';
export * from './languages';
export * from './genders';
export * from './moderation';
export * from './subscriptions';

// Search radius options (max 100km)
export const SEARCH_RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;
export const MAX_SEARCH_RADIUS = 100;
export const DEFAULT_SEARCH_RADIUS = 25;
export const MIN_SEARCH_RADIUS = 5;
export type SearchRadius = typeof SEARCH_RADIUS_OPTIONS[number];

// Age limits
export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const DEFAULT_MIN_AGE_FILTER = 18;
export const DEFAULT_MAX_AGE_FILTER = 99;

// App constants
export const APP_NAME = 'SHY';
export const APP_VERSION = '1.0.0';

// Legal disclaimer
export const LEGAL_DISCLAIMER =
  'Cette application est une plateforme sociale de mise en relation entre adultes consentants. ' +
  'Elle ne propose ni ne facilite aucun service sexuel rémunéré.';
