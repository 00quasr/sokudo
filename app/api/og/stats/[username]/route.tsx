import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import {
  getUserByUsername,
  getPublicProfileStats,
  getPublicCategoryPerformance,
} from '@/lib/db/queries';

export const runtime = 'nodejs';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await getUserByUsername(username);
  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const [stats, categoryPerformance] = await Promise.all([
    getPublicProfileStats(user.id),
    getPublicCategoryPerformance(user.id),
  ]);

  const displayName = user.name || user.username || 'User';
  const topCategories = categoryPerformance.slice(0, 3);

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200',
          height: '630',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0b',
          color: '#ffffff',
          fontFamily: 'monospace',
          padding: '48px 56px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Avatar circle */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '28px',
                backgroundColor: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 700 }}>
                {displayName}
              </span>
              <span style={{ fontSize: '16px', color: '#a1a1aa' }}>
                @{user.username}
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '20px',
              fontWeight: 700,
              color: '#f97316',
            }}
          >
            <span style={{ fontSize: '24px' }}>SOKUDO</span>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginBottom: '36px',
          }}
        >
          {/* Avg WPM */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #27272a',
            }}
          >
            <span style={{ fontSize: '14px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg WPM
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: '#f97316', marginTop: '4px' }}>
              {stats.avgWpm}
            </span>
          </div>

          {/* Best WPM */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #27272a',
            }}
          >
            <span style={{ fontSize: '14px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Best WPM
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>
              {stats.bestWpm}
            </span>
          </div>

          {/* Accuracy */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #27272a',
            }}
          >
            <span style={{ fontSize: '14px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Accuracy
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
              {stats.avgAccuracy}%
            </span>
          </div>

          {/* Streak */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #27272a',
            }}
          >
            <span style={{ fontSize: '14px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Streak
            </span>
            <span style={{ fontSize: '48px', fontWeight: 700, color: '#a855f7', marginTop: '4px' }}>
              {stats.currentStreak}d
            </span>
          </div>
        </div>

        {/* Bottom row: secondary stats + top categories */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flex: 1,
          }}
        >
          {/* Secondary stats */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#18181b',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #27272a',
              justifyContent: 'center',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', color: '#a1a1aa' }}>Sessions</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{stats.totalSessions}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', color: '#a1a1aa' }}>Practice Time</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{formatTime(stats.totalPracticeTimeMs)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', color: '#a1a1aa' }}>Longest Streak</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{stats.longestStreak} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '15px', color: '#a1a1aa' }}>Best Accuracy</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{stats.bestAccuracy}%</span>
            </div>
          </div>

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#18181b',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #27272a',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '14px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                Top Categories
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topCategories.map((cat, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '15px', color: '#e4e4e7' }}>
                      {cat.categoryName}
                    </span>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '14px', color: '#f97316' }}>
                        {cat.avgWpm} wpm
                      </span>
                      <span style={{ fontSize: '14px', color: '#3b82f6' }}>
                        {cat.avgAccuracy}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #27272a',
          }}
        >
          <span style={{ fontSize: '14px', color: '#52525b' }}>
            sokudo.dev/u/{user.username}
          </span>
          <span style={{ fontSize: '14px', color: '#52525b' }}>
            Developer Typing Trainer
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
