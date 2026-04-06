const REFERRAL_PUBLIC_BASE_URL = "https://nestai.care";

export const buildReferralPath = (referralCode: string) => `/join/${encodeURIComponent(referralCode)}`;

export const buildReferralUrl = (referralCode: string) => `${REFERRAL_PUBLIC_BASE_URL}${buildReferralPath(referralCode)}`;

export const buildAuthReferralPath = (referralCode: string) => `/app/auth?ref=${encodeURIComponent(referralCode)}`;
