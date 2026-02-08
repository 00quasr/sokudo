'use client';

import { useActionState, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { Suspense } from 'react';
import { ProfileBadges, type ProfileBadge } from '@/components/achievements/ProfileBadges';
import { PushNotificationToggle } from '@/components/notifications/PushNotificationToggle';
import { KeyboardLayoutSelector } from '@/components/settings/KeyboardLayoutSelector';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

type AccountFormProps = {
  state: ActionState;
  nameValue?: string;
  emailValue?: string;
  usernameValue?: string;
};

function AccountForm({
  state,
  nameValue = '',
  emailValue = '',
  usernameValue = '',
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="text-sm text-white/70 mb-2 block">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={state.name || nameValue}
          required
          className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30"
        />
      </div>
      <div>
        <Label htmlFor="email" className="text-sm text-white/70 mb-2 block">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          required
          className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30"
        />
      </div>
      <div>
        <Label htmlFor="username" className="text-sm text-white/70 mb-2 block">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          placeholder="your-username"
          defaultValue={usernameValue}
          maxLength={39}
          pattern="^[a-zA-Z0-9](?:[a-zA-Z0-9_-]*[a-zA-Z0-9])?$"
          className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30"
        />
        <p className="text-xs text-white/40 mt-1">
          Your public profile will be available at /u/your-username
        </p>
      </div>
    </>
  );
}

function AccountFormWithData({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  return (
    <AccountForm
      state={state}
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
      usernameValue={user?.username ?? ''}
    />
  );
}

interface ProfileData {
  avatarUrl: string | null;
  bio: string | null;
  preferredCategoryIds: number[];
}

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

function ProfileCustomization() {
  const { data: profile } = useSWR<ProfileData>('/api/user/profile', fetcher);
  const { data: categoriesData } = useSWR<{ categories: CategoryData[] }>(
    '/api/categories?includeProgress=false',
    fetcher
  );
  const { data: user } = useSWR<User>('/api/user', fetcher);

  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Sync state when profile data loads
  if (profile && !initialized) {
    setAvatarUrl(profile.avatarUrl ?? '');
    setBio(profile.bio ?? '');
    setSelectedCategories(profile.preferredCategoryIds ?? []);
    setInitialized(true);
  }

  const toggleCategory = useCallback((categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarUrl: avatarUrl || null,
          bio: bio || null,
          preferredCategoryIds: selectedCategories,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save profile' });
        return;
      }
      await mutate('/api/user/profile');
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setIsSaving(false);
    }
  }, [avatarUrl, bio, selectedCategories]);

  const categories = categoriesData?.categories ?? [];
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border border-white/10">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Profile avatar" />
          ) : null}
          <AvatarFallback className="bg-white/5 text-white/70 text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Label htmlFor="avatarUrl" className="text-sm text-white/70 mb-2 block">
            Avatar URL
          </Label>
          <Input
            id="avatarUrl"
            placeholder="https://example.com/avatar.png"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            maxLength={500}
            className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30"
          />
          <p className="text-xs text-white/40 mt-1">
            Enter a URL to an image for your profile avatar.
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="text-sm text-white/70 mb-2 block">
          Bio
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell others about yourself..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          className="rounded-xl bg-white/5 border-white/[0.08] text-white placeholder:text-white/30"
        />
        <p className="text-xs text-white/40 mt-1">
          {bio.length}/500 characters
        </p>
      </div>

      <div>
        <Label className="text-sm text-white/70 mb-2 block">Preferred categories</Label>
        <p className="text-xs text-white/40 mb-3">
          Select the categories you want to focus on during practice.
        </p>
        {categories.length === 0 ? (
          <p className="text-sm text-white/40">Loading categories...</p>
        ) : (
          <div className="flex flex-wrap gap-2" data-testid="category-chips">
            {categories.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {message.text}
        </p>
      )}

      <Button
        type="button"
        className="rounded-full bg-white text-black hover:bg-white/90"
        disabled={isSaving}
        onClick={handleSave}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save profile'
        )}
      </Button>
    </div>
  );
}

interface AchievementData {
  id: number;
  slug: string;
  name: string;
  icon: string;
  earnedAt: string | null;
}

function BadgesSection() {
  const { data: achievements } = useSWR<AchievementData[]>(
    '/api/achievements',
    fetcher
  );

  if (!achievements) {
    return null;
  }

  const badges: ProfileBadge[] = achievements.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    icon: a.icon,
    earnedAt: a.earnedAt ? new Date(a.earnedAt) : null,
  }));

  return (
    <ProfileBadges badges={badges} totalAchievements={achievements.length} />
  );
}

export default function GeneralPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <div>
      <h1 className="text-xl font-medium text-white mb-6">
        General settings
      </h1>

      <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Account information</h2>
        <form className="space-y-4" action={formAction}>
          <Suspense fallback={<AccountForm state={state} />}>
            <AccountFormWithData state={state} />
          </Suspense>
          {state.error && (
            <p className="text-red-400 text-sm">{state.error}</p>
          )}
          {state.success && (
            <p className="text-green-400 text-sm">{state.success}</p>
          )}
          <Button
            type="submit"
            className="rounded-full bg-white text-black hover:bg-white/90"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </form>
      </div>

      <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Profile</h2>
        <Suspense fallback={null}>
          <ProfileCustomization />
        </Suspense>
      </div>

      <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Keyboard layout</h2>
        <Suspense fallback={null}>
          <KeyboardLayoutSelector />
        </Suspense>
      </div>

      <div className="rounded-2xl bg-white/[0.02] p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-4">Notifications</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-white mb-1">Streak reminders</p>
            <p className="text-xs text-white/40 mb-3">
              Get notified in your browser when your practice streak is at
              risk of being lost.
            </p>
            <PushNotificationToggle />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.02] p-6">
        <h2 className="text-lg font-medium text-white mb-4">Your badges</h2>
        <Suspense fallback={null}>
          <BadgesSection />
        </Suspense>
      </div>
    </div>
  );
}
