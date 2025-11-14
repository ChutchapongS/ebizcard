-- Add social media fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS youtube VARCHAR(255),
ADD COLUMN IF NOT EXISTS telegram VARCHAR(255),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(255),
ADD COLUMN IF NOT EXISTS wechat VARCHAR(255),
ADD COLUMN IF NOT EXISTS snapchat VARCHAR(255),
ADD COLUMN IF NOT EXISTS pinterest VARCHAR(255),
ADD COLUMN IF NOT EXISTS reddit VARCHAR(255),
ADD COLUMN IF NOT EXISTS discord VARCHAR(255),
ADD COLUMN IF NOT EXISTS slack VARCHAR(255),
ADD COLUMN IF NOT EXISTS viber VARCHAR(255),
ADD COLUMN IF NOT EXISTS skype VARCHAR(255),
ADD COLUMN IF NOT EXISTS zoom VARCHAR(255),
ADD COLUMN IF NOT EXISTS github VARCHAR(255),
ADD COLUMN IF NOT EXISTS twitch VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_youtube ON public.profiles(youtube);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON public.profiles(telegram);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat ON public.profiles(wechat);
CREATE INDEX IF NOT EXISTS idx_profiles_snapchat ON public.profiles(snapchat);
CREATE INDEX IF NOT EXISTS idx_profiles_pinterest ON public.profiles(pinterest);
CREATE INDEX IF NOT EXISTS idx_profiles_reddit ON public.profiles(reddit);
CREATE INDEX IF NOT EXISTS idx_profiles_discord ON public.profiles(discord);
CREATE INDEX IF NOT EXISTS idx_profiles_slack ON public.profiles(slack);
CREATE INDEX IF NOT EXISTS idx_profiles_viber ON public.profiles(viber);
CREATE INDEX IF NOT EXISTS idx_profiles_skype ON public.profiles(skype);
CREATE INDEX IF NOT EXISTS idx_profiles_zoom ON public.profiles(zoom);
CREATE INDEX IF NOT EXISTS idx_profiles_github ON public.profiles(github);
CREATE INDEX IF NOT EXISTS idx_profiles_twitch ON public.profiles(twitch);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.youtube IS 'YouTube channel URL or username';
COMMENT ON COLUMN public.profiles.telegram IS 'Telegram username or channel';
COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp number or username';
COMMENT ON COLUMN public.profiles.wechat IS 'WeChat ID or username';
COMMENT ON COLUMN public.profiles.snapchat IS 'Snapchat username';
COMMENT ON COLUMN public.profiles.pinterest IS 'Pinterest profile URL or username';
COMMENT ON COLUMN public.profiles.reddit IS 'Reddit username';
COMMENT ON COLUMN public.profiles.discord IS 'Discord username or server';
COMMENT ON COLUMN public.profiles.slack IS 'Slack workspace or username';
COMMENT ON COLUMN public.profiles.viber IS 'Viber username or number';
COMMENT ON COLUMN public.profiles.skype IS 'Skype username';
COMMENT ON COLUMN public.profiles.zoom IS 'Zoom profile or meeting room';
COMMENT ON COLUMN public.profiles.github IS 'GitHub username or profile URL';
COMMENT ON COLUMN public.profiles.twitch IS 'Twitch channel or username';
