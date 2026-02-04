import { db } from './drizzle';
import { teamAchievements } from './schema';
import type { NewTeamAchievement } from './schema';

export const teamAchievementDefinitions: NewTeamAchievement[] = [
  // === COLLECTIVE SESSIONS ===
  {
    slug: 'team-sessions-50',
    name: 'First Fifty',
    description: 'Complete 50 sessions as a team',
    icon: 'users',
    criteria: { type: 'team_sessions', threshold: 50 },
  },
  {
    slug: 'team-sessions-250',
    name: 'Squad Goals',
    description: 'Complete 250 sessions as a team',
    icon: 'users',
    criteria: { type: 'team_sessions', threshold: 250 },
  },
  {
    slug: 'team-sessions-1000',
    name: 'Typing Army',
    description: 'Complete 1,000 sessions as a team',
    icon: 'users',
    criteria: { type: 'team_sessions', threshold: 1000 },
  },

  // === TEAM AVG WPM ===
  {
    slug: 'team-avg-wpm-40',
    name: 'Warming Up Together',
    description: 'Reach a team average of 40 WPM',
    icon: 'gauge',
    criteria: { type: 'team_avg_wpm', threshold: 40 },
  },
  {
    slug: 'team-avg-wpm-60',
    name: 'Team Velocity',
    description: 'Reach a team average of 60 WPM',
    icon: 'gauge',
    criteria: { type: 'team_avg_wpm', threshold: 60 },
  },
  {
    slug: 'team-avg-wpm-80',
    name: 'Speed Squad',
    description: 'Reach a team average of 80 WPM',
    icon: 'zap',
    criteria: { type: 'team_avg_wpm', threshold: 80 },
  },

  // === ALL MEMBERS ACTIVE ===
  {
    slug: 'team-all-active',
    name: 'Full House',
    description: 'Every team member completes at least one session',
    icon: 'check-circle',
    criteria: { type: 'team_all_active' },
  },

  // === COLLECTIVE PRACTICE TIME ===
  {
    slug: 'team-practice-1h',
    name: 'Hour of Power',
    description: 'Accumulate 1 hour of team practice time',
    icon: 'clock',
    criteria: { type: 'team_practice_time', thresholdMs: 3600000 },
  },
  {
    slug: 'team-practice-10h',
    name: 'Dedicated Squad',
    description: 'Accumulate 10 hours of team practice time',
    icon: 'clock',
    criteria: { type: 'team_practice_time', thresholdMs: 36000000 },
  },
  {
    slug: 'team-practice-100h',
    name: 'Century Club',
    description: 'Accumulate 100 hours of team practice time',
    icon: 'clock',
    criteria: { type: 'team_practice_time', thresholdMs: 360000000 },
  },

  // === TEAM ACCURACY ===
  {
    slug: 'team-avg-accuracy-90',
    name: 'Precision Team',
    description: 'Reach a team average accuracy of 90%',
    icon: 'target',
    criteria: { type: 'team_avg_accuracy', threshold: 90 },
  },
  {
    slug: 'team-avg-accuracy-95',
    name: 'Sharp Shooters',
    description: 'Reach a team average accuracy of 95%',
    icon: 'target',
    criteria: { type: 'team_avg_accuracy', threshold: 95 },
  },

  // === TEAM STREAK ===
  {
    slug: 'team-streak-3',
    name: 'Team Rhythm',
    description: 'Have every member maintain a 3-day streak simultaneously',
    icon: 'flame',
    criteria: { type: 'team_min_streak', threshold: 3 },
  },
  {
    slug: 'team-streak-7',
    name: 'Week Warriors',
    description: 'Have every member maintain a 7-day streak simultaneously',
    icon: 'flame',
    criteria: { type: 'team_min_streak', threshold: 7 },
  },

  // === TEAM CHALLENGES ===
  {
    slug: 'team-challenges-5',
    name: 'Challenge Accepted',
    description: 'Complete 5 team challenges',
    icon: 'swords',
    criteria: { type: 'team_challenges_completed', threshold: 5 },
  },
  {
    slug: 'team-challenges-25',
    name: 'Challenge Champions',
    description: 'Complete 25 team challenges',
    icon: 'swords',
    criteria: { type: 'team_challenges_completed', threshold: 25 },
  },
];

export async function seedTeamAchievements() {
  console.log('Seeding team achievement definitions...');

  await db.insert(teamAchievements).values(teamAchievementDefinitions).onConflictDoNothing();

  console.log(`Seeded ${teamAchievementDefinitions.length} team achievement definitions.`);
}

if (require.main === module) {
  seedTeamAchievements()
    .catch((error) => {
      console.error('Seed team achievements failed:', error);
      process.exit(1);
    })
    .finally(() => {
      console.log('Seed team achievements finished. Exiting...');
      process.exit(0);
    });
}
