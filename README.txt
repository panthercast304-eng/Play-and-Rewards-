PLAY & REWARDS — GitHub-ready starter

This package is ready for GitHub Pages and has the requested bright off-white/light-neon-blue design.

Included:
- Responsive Home, Ads, Games and Profile screens
- Login/signup UI ready for Supabase Auth
- Real Ludo-vs-computer mini-game (non-wagering)
- Real Snake mini-game (non-wagering)
- Withdrawal remains DEMO ONLY
- Referral-code interface
- No fake ad-completion simulator

IMPORTANT:
GitHub Pages is only the frontend. Real accounts, secure coin balances, verified referrals and real rewarded-ad rewards require a backend/database such as Supabase plus an approved ad provider.

For Supabase:
Create a profiles table with:
id uuid primary key references auth.users(id)
coins bigint default 0
ads_count integer default 0
eligible_referrals integer default 0
referral_code text unique
games_played integer default 0

Enable Row Level Security. Users may read their own profile, but the browser must NOT be allowed to directly update coins, ads_count or eligible_referrals. Use a secure server-side function/Edge Function for verified rewards and referral qualification.

Put only the Supabase project URL and public ANON/PUBLISHABLE key in config.js. Never put a service-role/secret key in a public GitHub repository.

Real ads:
Connect startRewardedAd() to an approved rewarded-ad provider. Only legitimate completed ad events should credit rewards. Never click your own ads, create fake users, or generate invalid traffic.

Withdrawal:
DEMO ONLY. No real money is sent.
