import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  date,
  uniqueIndex,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  username: varchar('username', { length: 39 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  referralCode: varchar('referral_code', { length: 12 }).unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  provider: varchar('provider', { length: 50 }),
  providerId: varchar('provider_id', { length: 255 }),
  providerData: jsonb('provider_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => [
  uniqueIndex('accounts_provider_account_id_idx').on(table.provider, table.providerAccountId)
]);

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => [
  uniqueIndex('verification_tokens_identifier_token_idx').on(table.identifier, table.token)
]);

export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  bio: varchar('bio', { length: 500 }),
  preferredCategoryIds: jsonb('preferred_category_ids').default([]),
  subscriptionTier: varchar('subscription_tier', { length: 20 })
    .notNull()
    .default('free'),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  totalPracticeTimeMs: integer('total_practice_time_ms').notNull().default(0),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('beginner'),
  isPremium: boolean('is_premium').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  content: text('content').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('beginner'),
  syntaxType: varchar('syntax_type', { length: 50 }).notNull().default('plain'),
  hint: text('hint'),
  avgWpm: integer('avg_wpm').notNull().default(0),
  timesCompleted: integer('times_completed').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ one, many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  teamChallenges: many(teamChallenges),
  teamCustomChallenges: many(teamCustomChallenges),
  earnedTeamAchievements: many(earnedTeamAchievements),
  onboardingCourses: many(teamOnboardingCourses),
  samlConfiguration: one(samlConfigurations),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  typingSessions: many(typingSessions),
  dailyPractice: many(dailyPractice),
  keyAccuracy: many(keyAccuracy),
  charErrorPatterns: many(charErrorPatterns),
  sequenceErrorPatterns: many(sequenceErrorPatterns),
  profile: one(userProfiles),
  userAchievements: many(userAchievements),
  customChallenges: many(customChallenges),
  challengeVotes: many(challengeVotes),
  challengeCollections: many(challengeCollections),
  pushSubscriptions: many(pushSubscriptions),
  friendChallengesSent: many(friendChallenges, { relationName: 'challengesSent' }),
  friendChallengesReceived: many(friendChallenges, { relationName: 'challengesReceived' }),
  accounts: many(accounts),
  sessions: many(sessions),
  connectedRepos: many(connectedRepos),
  repoGeneratedChallenges: many(repoGeneratedChallenges),
  repoCategories: many(repoCategories),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  challenges: many(challenges),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  category: one(categories, {
    fields: [challenges.categoryId],
    references: [categories.id],
  }),
  typingSessions: many(typingSessions),
  races: many(races),
}));

export const typingSessions = pgTable('typing_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  wpm: integer('wpm').notNull(),
  rawWpm: integer('raw_wpm').notNull(),
  accuracy: integer('accuracy').notNull(),
  keystrokes: integer('keystrokes').notNull(),
  errors: integer('errors').notNull(),
  durationMs: integer('duration_ms').notNull(),
  completedAt: timestamp('completed_at').notNull().defaultNow(),
});

export const typingSessionsRelations = relations(
  typingSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [typingSessions.userId],
      references: [users.id],
    }),
    challenge: one(challenges, {
      fields: [typingSessions.challengeId],
      references: [challenges.id],
    }),
    keystrokeLogs: many(keystrokeLogs),
  })
);

export const keystrokeLogs = pgTable('keystroke_logs', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => typingSessions.id),
  timestamp: integer('timestamp').notNull(),
  expected: varchar('expected', { length: 10 }).notNull(),
  actual: varchar('actual', { length: 10 }).notNull(),
  isCorrect: boolean('is_correct').notNull(),
  latencyMs: integer('latency_ms').notNull(),
});

export const keystrokeLogsRelations = relations(keystrokeLogs, ({ one }) => ({
  session: one(typingSessions, {
    fields: [keystrokeLogs.sessionId],
    references: [typingSessions.id],
  }),
}));

export const keyAccuracy = pgTable(
  'key_accuracy',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    key: varchar('key', { length: 10 }).notNull(),
    totalPresses: integer('total_presses').notNull().default(0),
    correctPresses: integer('correct_presses').notNull().default(0),
    avgLatencyMs: integer('avg_latency_ms').notNull().default(0),
  },
  (table) => [uniqueIndex('key_accuracy_user_key_idx').on(table.userId, table.key)]
);

export const keyAccuracyRelations = relations(keyAccuracy, ({ one }) => ({
  user: one(users, {
    fields: [keyAccuracy.userId],
    references: [users.id],
  }),
}));

export const charErrorPatterns = pgTable(
  'char_error_patterns',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    expectedChar: varchar('expected_char', { length: 10 }).notNull(),
    actualChar: varchar('actual_char', { length: 10 }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (table) => [
    uniqueIndex('char_error_patterns_user_expected_actual_idx').on(
      table.userId,
      table.expectedChar,
      table.actualChar
    ),
  ]
);

export const charErrorPatternsRelations = relations(charErrorPatterns, ({ one }) => ({
  user: one(users, {
    fields: [charErrorPatterns.userId],
    references: [users.id],
  }),
}));

export const sequenceErrorPatterns = pgTable(
  'sequence_error_patterns',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    sequence: varchar('sequence', { length: 20 }).notNull(),
    totalAttempts: integer('total_attempts').notNull().default(0),
    errorCount: integer('error_count').notNull().default(0),
    avgLatencyMs: integer('avg_latency_ms').notNull().default(0),
  },
  (table) => [
    uniqueIndex('sequence_error_patterns_user_sequence_idx').on(
      table.userId,
      table.sequence
    ),
  ]
);

export const sequenceErrorPatternsRelations = relations(sequenceErrorPatterns, ({ one }) => ({
  user: one(users, {
    fields: [sequenceErrorPatterns.userId],
    references: [users.id],
  }),
}));

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  criteria: jsonb('criteria').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    achievementId: integer('achievement_id')
      .notNull()
      .references(() => achievements.id),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_achievements_user_achievement_idx').on(
      table.userId,
      table.achievementId
    ),
  ]
);

export const customChallenges = pgTable('custom_challenges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isPublic: boolean('is_public').notNull().default(false),
  forkedFromId: integer('forked_from_id'),
  timesCompleted: integer('times_completed').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const challengeVotes = pgTable(
  'challenge_votes',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    challengeId: integer('challenge_id')
      .notNull()
      .references(() => customChallenges.id),
    value: integer('value').notNull(), // 1 = upvote, -1 = downvote
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('challenge_votes_user_challenge_idx').on(
      table.userId,
      table.challengeId
    ),
  ]
);

export const customChallengesRelations = relations(customChallenges, ({ one, many }) => ({
  user: one(users, {
    fields: [customChallenges.userId],
    references: [users.id],
  }),
  votes: many(challengeVotes),
  collectionChallenges: many(collectionChallenges),
}));

export const challengeVotesRelations = relations(challengeVotes, ({ one }) => ({
  user: one(users, {
    fields: [challengeVotes.userId],
    references: [users.id],
  }),
  challenge: one(customChallenges, {
    fields: [challengeVotes.challengeId],
    references: [customChallenges.id],
  }),
}));

export const challengeCollections = pgTable('challenge_collections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isPublic: boolean('is_public').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const collectionChallenges = pgTable(
  'collection_challenges',
  {
    id: serial('id').primaryKey(),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => challengeCollections.id, { onDelete: 'cascade' }),
    challengeId: integer('challenge_id')
      .notNull()
      .references(() => customChallenges.id, { onDelete: 'cascade' }),
    displayOrder: integer('display_order').notNull().default(0),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('collection_challenges_collection_challenge_idx').on(
      table.collectionId,
      table.challengeId
    ),
  ]
);

export const challengeCollectionsRelations = relations(challengeCollections, ({ one, many }) => ({
  user: one(users, {
    fields: [challengeCollections.userId],
    references: [users.id],
  }),
  collectionChallenges: many(collectionChallenges),
}));

export const collectionChallengesRelations = relations(collectionChallenges, ({ one }) => ({
  collection: one(challengeCollections, {
    fields: [collectionChallenges.collectionId],
    references: [challengeCollections.id],
  }),
  challenge: one(customChallenges, {
    fields: [collectionChallenges.challengeId],
    references: [customChallenges.id],
  }),
}));

export const teamChallenges = pgTable('team_challenges', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamChallengesRelations = relations(teamChallenges, ({ one }) => ({
  team: one(teams, {
    fields: [teamChallenges.teamId],
    references: [teams.id],
  }),
  challenge: one(challenges, {
    fields: [teamChallenges.challengeId],
    references: [challenges.id],
  }),
  creator: one(users, {
    fields: [teamChallenges.createdBy],
    references: [users.id],
  }),
}));

export const teamCustomChallenges = pgTable('team_custom_challenges', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('beginner'),
  syntaxType: varchar('syntax_type', { length: 50 }).notNull().default('plain'),
  hint: text('hint'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamCustomChallengesRelations = relations(teamCustomChallenges, ({ one }) => ({
  team: one(teams, {
    fields: [teamCustomChallenges.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [teamCustomChallenges.createdBy],
    references: [users.id],
  }),
}));

// ---- Team Onboarding Courses (admin-defined challenge sequences) ----

export const teamOnboardingCourses = pgTable('team_onboarding_courses', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const teamOnboardingCourseSteps = pgTable('team_onboarding_course_steps', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => teamOnboardingCourses.id, { onDelete: 'cascade' }),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  stepOrder: integer('step_order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const teamOnboardingCourseProgress = pgTable(
  'team_onboarding_course_progress',
  {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => teamOnboardingCourses.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    stepId: integer('step_id')
      .notNull()
      .references(() => teamOnboardingCourseSteps.id, { onDelete: 'cascade' }),
    sessionId: integer('session_id')
      .references(() => typingSessions.id),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('course_progress_user_step_idx').on(
      table.userId,
      table.stepId
    ),
  ]
);

export const teamOnboardingCoursesRelations = relations(teamOnboardingCourses, ({ one, many }) => ({
  team: one(teams, {
    fields: [teamOnboardingCourses.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [teamOnboardingCourses.createdBy],
    references: [users.id],
  }),
  steps: many(teamOnboardingCourseSteps),
}));

export const teamOnboardingCourseStepsRelations = relations(teamOnboardingCourseSteps, ({ one }) => ({
  course: one(teamOnboardingCourses, {
    fields: [teamOnboardingCourseSteps.courseId],
    references: [teamOnboardingCourses.id],
  }),
  challenge: one(challenges, {
    fields: [teamOnboardingCourseSteps.challengeId],
    references: [challenges.id],
  }),
}));

export const teamOnboardingCourseProgressRelations = relations(teamOnboardingCourseProgress, ({ one }) => ({
  course: one(teamOnboardingCourses, {
    fields: [teamOnboardingCourseProgress.courseId],
    references: [teamOnboardingCourses.id],
  }),
  user: one(users, {
    fields: [teamOnboardingCourseProgress.userId],
    references: [users.id],
  }),
  step: one(teamOnboardingCourseSteps, {
    fields: [teamOnboardingCourseProgress.stepId],
    references: [teamOnboardingCourseSteps.id],
  }),
  session: one(typingSessions, {
    fields: [teamOnboardingCourseProgress.sessionId],
    references: [typingSessions.id],
  }),
}));

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [uniqueIndex('push_subscriptions_user_endpoint_idx').on(table.userId, table.endpoint)]
);

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const referrals = pgTable(
  'referrals',
  {
    id: serial('id').primaryKey(),
    referrerId: integer('referrer_id')
      .notNull()
      .references(() => users.id),
    referredId: integer('referred_id')
      .notNull()
      .references(() => users.id),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    rewardGiven: boolean('reward_given').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('referrals_referrer_referred_idx').on(
      table.referrerId,
      table.referredId
    ),
  ]
);

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: 'referred',
  }),
}));

export const dailyPractice = pgTable(
  'daily_practice',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    date: date('date').notNull(),
    practiceTimeMs: integer('practice_time_ms').notNull().default(0),
    sessionsCompleted: integer('sessions_completed').notNull().default(0),
  },
  (table) => [uniqueIndex('daily_practice_user_date_idx').on(table.userId, table.date)]
);

export const dailyPracticeRelations = relations(dailyPractice, ({ one }) => ({
  user: one(users, {
    fields: [dailyPractice.userId],
    references: [users.id],
  }),
}));

export const teamAchievements = pgTable('team_achievements', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  criteria: jsonb('criteria').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const earnedTeamAchievements = pgTable(
  'earned_team_achievements',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    achievementId: integer('achievement_id')
      .notNull()
      .references(() => teamAchievements.id),
    earnedAt: timestamp('earned_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('earned_team_achievements_team_achievement_idx').on(
      table.teamId,
      table.achievementId
    ),
  ]
);

export const teamAchievementsRelations = relations(teamAchievements, ({ many }) => ({
  earnedTeamAchievements: many(earnedTeamAchievements),
}));

export const earnedTeamAchievementsRelations = relations(earnedTeamAchievements, ({ one }) => ({
  team: one(teams, {
    fields: [earnedTeamAchievements.teamId],
    references: [teams.id],
  }),
  achievement: one(teamAchievements, {
    fields: [earnedTeamAchievements.achievementId],
    references: [teamAchievements.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const races = pgTable('races', {
  id: serial('id').primaryKey(),
  status: varchar('status', { length: 20 }).notNull().default('waiting'),
  categoryId: integer('category_id')
    .notNull()
    .references(() => categories.id),
  startedAt: timestamp('started_at'),
  maxPlayers: integer('max_players').notNull().default(4),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const raceParticipants = pgTable(
  'race_participants',
  {
    id: serial('id').primaryKey(),
    raceId: integer('race_id')
      .notNull()
      .references(() => races.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    currentChallengeIndex: integer('current_challenge_index').notNull().default(0),
    wpm: integer('wpm'),
    accuracy: integer('accuracy'),
    finishedAt: timestamp('finished_at'),
    rank: integer('rank'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('race_participants_race_user_idx').on(
      table.raceId,
      table.userId
    ),
  ]
);

export const racesRelations = relations(races, ({ one, many }) => ({
  category: one(categories, {
    fields: [races.categoryId],
    references: [categories.id],
  }),
  participants: many(raceParticipants),
}));

export const raceParticipantsRelations = relations(
  raceParticipants,
  ({ one }) => ({
    race: one(races, {
      fields: [raceParticipants.raceId],
      references: [races.id],
    }),
    user: one(users, {
      fields: [raceParticipants.userId],
      references: [users.id],
    }),
  })
);

export const friendChallenges = pgTable('friend_challenges', {
  id: serial('id').primaryKey(),
  challengerId: integer('challenger_id')
    .notNull()
    .references(() => users.id),
  challengedId: integer('challenged_id')
    .notNull()
    .references(() => users.id),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  raceId: integer('race_id').references(() => races.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  message: varchar('message', { length: 255 }),
  expiresAt: timestamp('expires_at').notNull(),
  respondedAt: timestamp('responded_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const friendChallengesRelations = relations(friendChallenges, ({ one }) => ({
  challenger: one(users, {
    fields: [friendChallenges.challengerId],
    references: [users.id],
    relationName: 'challengesSent',
  }),
  challenged: one(users, {
    fields: [friendChallenges.challengedId],
    references: [users.id],
    relationName: 'challengesReceived',
  }),
  challenge: one(challenges, {
    fields: [friendChallenges.challengeId],
    references: [challenges.id],
  }),
  race: one(races, {
    fields: [friendChallenges.raceId],
    references: [races.id],
  }),
}));

// ---- Weekly Tournaments (scheduled competitions) ----

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  challengeId: integer('challenge_id')
    .notNull()
    .references(() => challenges.id),
  status: varchar('status', { length: 20 }).notNull().default('upcoming'),
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    id: serial('id').primaryKey(),
    tournamentId: integer('tournament_id')
      .notNull()
      .references(() => tournaments.id),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    wpm: integer('wpm'),
    rawWpm: integer('raw_wpm'),
    accuracy: integer('accuracy'),
    completedAt: timestamp('completed_at'),
    rank: integer('rank'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tournament_participants_tournament_user_idx').on(
      table.tournamentId,
      table.userId
    ),
  ]
);

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  challenge: one(challenges, {
    fields: [tournaments.challengeId],
    references: [challenges.id],
  }),
  creator: one(users, {
    fields: [tournaments.createdBy],
    references: [users.id],
  }),
  participants: many(tournamentParticipants),
}));

export const tournamentParticipantsRelations = relations(
  tournamentParticipants,
  ({ one }) => ({
    tournament: one(tournaments, {
      fields: [tournamentParticipants.tournamentId],
      references: [tournaments.id],
    }),
    user: one(users, {
      fields: [tournamentParticipants.userId],
      references: [users.id],
    }),
  })
);

// ---- API Keys (external app authentication) ----

export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(),
  scopes: jsonb('scopes').notNull().default(['read']),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// ---- Webhooks (event notification endpoints) ----

export const webhooks = pgTable('webhooks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  url: text('url').notNull(),
  secret: text('secret').notNull(),
  events: jsonb('events').notNull().default(['session.completed', 'achievement.earned']),
  active: boolean('active').notNull().default(true),
  description: varchar('description', { length: 255 }),
  lastDeliveredAt: timestamp('last_delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id')
    .notNull()
    .references(() => webhooks.id, { onDelete: 'cascade' }),
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  statusCode: integer('status_code'),
  responseBody: text('response_body'),
  success: boolean('success').notNull().default(false),
  attemptNumber: integer('attempt_number').notNull().default(1),
  deliveredAt: timestamp('delivered_at').notNull().defaultNow(),
});

export const webhooksRelations = relations(webhooks, ({ one, many }) => ({
  user: one(users, {
    fields: [webhooks.userId],
    references: [users.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  webhook: one(webhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [webhooks.id],
  }),
}));

// ---- Spaced Repetition Items (SM-2 algorithm scheduling) ----

export const spacedRepetitionItems = pgTable(
  'spaced_repetition_items',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    challengeId: integer('challenge_id')
      .notNull()
      .references(() => challenges.id),
    easeFactor: real('ease_factor').notNull().default(2.5),
    interval: integer('interval').notNull().default(0), // days
    repetitions: integer('repetitions').notNull().default(0),
    nextReviewAt: timestamp('next_review_at').notNull().defaultNow(),
    lastReviewedAt: timestamp('last_reviewed_at'),
    lastQuality: integer('last_quality'), // 0-5 SM-2 quality rating
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('spaced_repetition_user_challenge_idx').on(
      table.userId,
      table.challengeId
    ),
  ]
);

export const spacedRepetitionItemsRelations = relations(
  spacedRepetitionItems,
  ({ one }) => ({
    user: one(users, {
      fields: [spacedRepetitionItems.userId],
      references: [users.id],
    }),
    challenge: one(challenges, {
      fields: [spacedRepetitionItems.challengeId],
      references: [challenges.id],
    }),
  })
);

// ---- SAML SSO Configurations (enterprise team SSO) ----

export const samlConfigurations = pgTable('saml_configurations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .unique()
    .references(() => teams.id, { onDelete: 'cascade' }),
  entityId: varchar('entity_id', { length: 500 }).notNull(),
  ssoUrl: text('sso_url').notNull(),
  certificate: text('certificate').notNull(),
  sloUrl: text('slo_url'),
  nameIdFormat: varchar('name_id_format', { length: 255 })
    .notNull()
    .default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'),
  signRequests: boolean('sign_requests').notNull().default(false),
  enabled: boolean('enabled').notNull().default(false),
  allowIdpInitiated: boolean('allow_idp_initiated').notNull().default(false),
  defaultRole: varchar('default_role', { length: 50 }).notNull().default('member'),
  autoProvision: boolean('auto_provision').notNull().default(true),
  createdBy: integer('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const samlConfigurationsRelations = relations(samlConfigurations, ({ one }) => ({
  team: one(teams, {
    fields: [samlConfigurations.teamId],
    references: [teams.id],
  }),
  creator: one(users, {
    fields: [samlConfigurations.createdBy],
    references: [users.id],
  }),
}));

// ---- OAuth Provider (third-party app authorization) ----

export const oauthClients = pgTable('oauth_clients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  clientId: varchar('client_id', { length: 64 }).notNull().unique(),
  clientSecretHash: text('client_secret_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  redirectUris: jsonb('redirect_uris').notNull().default([]),
  scopes: jsonb('scopes').notNull().default(['read']),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const oauthAuthorizationCodes = pgTable('oauth_authorization_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 128 }).notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => oauthClients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  redirectUri: text('redirect_uri').notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  codeChallenge: varchar('code_challenge', { length: 128 }),
  codeChallengeMethod: varchar('code_challenge_method', { length: 10 }),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const oauthAccessTokens = pgTable('oauth_access_tokens', {
  id: serial('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => oauthClients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const oauthClientsRelations = relations(oauthClients, ({ one, many }) => ({
  user: one(users, {
    fields: [oauthClients.userId],
    references: [users.id],
  }),
  authorizationCodes: many(oauthAuthorizationCodes),
  accessTokens: many(oauthAccessTokens),
}));

export const oauthAuthorizationCodesRelations = relations(oauthAuthorizationCodes, ({ one }) => ({
  client: one(oauthClients, {
    fields: [oauthAuthorizationCodes.clientId],
    references: [oauthClients.id],
  }),
  user: one(users, {
    fields: [oauthAuthorizationCodes.userId],
    references: [users.id],
  }),
}));

export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one }) => ({
  client: one(oauthClients, {
    fields: [oauthAccessTokens.clientId],
    references: [oauthClients.id],
  }),
  user: one(users, {
    fields: [oauthAccessTokens.userId],
    references: [users.id],
  }),
}));

export type SpacedRepetitionItem = typeof spacedRepetitionItems.$inferSelect;
export type NewSpacedRepetitionItem = typeof spacedRepetitionItems.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type NewChallenge = typeof challenges.$inferInsert;
export type TypingSession = typeof typingSessions.$inferSelect;
export type NewTypingSession = typeof typingSessions.$inferInsert;
export type KeystrokeLog = typeof keystrokeLogs.$inferSelect;
export type NewKeystrokeLog = typeof keystrokeLogs.$inferInsert;
export type DailyPractice = typeof dailyPractice.$inferSelect;
export type NewDailyPractice = typeof dailyPractice.$inferInsert;
export type KeyAccuracy = typeof keyAccuracy.$inferSelect;
export type NewKeyAccuracy = typeof keyAccuracy.$inferInsert;
export type CharErrorPattern = typeof charErrorPatterns.$inferSelect;
export type NewCharErrorPattern = typeof charErrorPatterns.$inferInsert;
export type SequenceErrorPattern = typeof sequenceErrorPatterns.$inferSelect;
export type NewSequenceErrorPattern = typeof sequenceErrorPatterns.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
export type CustomChallenge = typeof customChallenges.$inferSelect;
export type NewCustomChallenge = typeof customChallenges.$inferInsert;
export type ChallengeVote = typeof challengeVotes.$inferSelect;
export type NewChallengeVote = typeof challengeVotes.$inferInsert;
export type ChallengeCollection = typeof challengeCollections.$inferSelect;
export type NewChallengeCollection = typeof challengeCollections.$inferInsert;
export type CollectionChallenge = typeof collectionChallenges.$inferSelect;
export type NewCollectionChallenge = typeof collectionChallenges.$inferInsert;
export type TeamChallenge = typeof teamChallenges.$inferSelect;
export type NewTeamChallenge = typeof teamChallenges.$inferInsert;
export type TeamAchievement = typeof teamAchievements.$inferSelect;
export type NewTeamAchievement = typeof teamAchievements.$inferInsert;
export type EarnedTeamAchievement = typeof earnedTeamAchievements.$inferSelect;
export type NewEarnedTeamAchievement = typeof earnedTeamAchievements.$inferInsert;
export type TeamCustomChallenge = typeof teamCustomChallenges.$inferSelect;
export type NewTeamCustomChallenge = typeof teamCustomChallenges.$inferInsert;
export type TeamOnboardingCourse = typeof teamOnboardingCourses.$inferSelect;
export type NewTeamOnboardingCourse = typeof teamOnboardingCourses.$inferInsert;
export type TeamOnboardingCourseStep = typeof teamOnboardingCourseSteps.$inferSelect;
export type NewTeamOnboardingCourseStep = typeof teamOnboardingCourseSteps.$inferInsert;
export type TeamOnboardingCourseProgress = typeof teamOnboardingCourseProgress.$inferSelect;
export type NewTeamOnboardingCourseProgress = typeof teamOnboardingCourseProgress.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;
export type Race = typeof races.$inferSelect;
export type NewRace = typeof races.$inferInsert;
export type RaceParticipant = typeof raceParticipants.$inferSelect;
export type NewRaceParticipant = typeof raceParticipants.$inferInsert;
export type FriendChallenge = typeof friendChallenges.$inferSelect;
export type NewFriendChallenge = typeof friendChallenges.$inferInsert;
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type NewTournamentParticipant = typeof tournamentParticipants.$inferInsert;
export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;
export type OAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferSelect;
export type NewOAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferInsert;
export type OAuthAccessToken = typeof oauthAccessTokens.$inferSelect;
export type NewOAuthAccessToken = typeof oauthAccessTokens.$inferInsert;
export type SamlConfiguration = typeof samlConfigurations.$inferSelect;
export type NewSamlConfiguration = typeof samlConfigurations.$inferInsert;

// ---- OIDC Provider Configuration ----

export const oidcClients = pgTable('oidc_clients', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  clientId: varchar('client_id', { length: 64 }).notNull().unique(),
  clientSecretHash: text('client_secret_hash').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  redirectUris: jsonb('redirect_uris').notNull().default([]),
  postLogoutRedirectUris: jsonb('post_logout_redirect_uris').notNull().default([]),
  scopes: jsonb('scopes').notNull().default(['openid', 'profile', 'email']),
  responseTypes: jsonb('response_types').notNull().default(['code']),
  grantTypes: jsonb('grant_types').notNull().default(['authorization_code']),
  tokenEndpointAuthMethod: varchar('token_endpoint_auth_method', { length: 50 })
    .notNull()
    .default('client_secret_post'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const oidcAuthorizationCodes = pgTable('oidc_authorization_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 128 }).notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => oidcClients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  redirectUri: text('redirect_uri').notNull(),
  scopes: jsonb('scopes').notNull().default([]),
  nonce: varchar('nonce', { length: 256 }),
  codeChallenge: varchar('code_challenge', { length: 128 }),
  codeChallengeMethod: varchar('code_challenge_method', { length: 10 }),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const oidcRefreshTokens = pgTable('oidc_refresh_tokens', {
  id: serial('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => oidcClients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const oidcAccessTokens = pgTable('oidc_access_tokens', {
  id: serial('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  clientId: integer('client_id')
    .notNull()
    .references(() => oidcClients.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  scopes: jsonb('scopes').notNull().default([]),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const oidcClientsRelations = relations(oidcClients, ({ one, many }) => ({
  user: one(users, {
    fields: [oidcClients.userId],
    references: [users.id],
  }),
  authorizationCodes: many(oidcAuthorizationCodes),
  accessTokens: many(oidcAccessTokens),
  refreshTokens: many(oidcRefreshTokens),
}));

export const oidcAuthorizationCodesRelations = relations(oidcAuthorizationCodes, ({ one }) => ({
  client: one(oidcClients, {
    fields: [oidcAuthorizationCodes.clientId],
    references: [oidcClients.id],
  }),
  user: one(users, {
    fields: [oidcAuthorizationCodes.userId],
    references: [users.id],
  }),
}));

export const oidcAccessTokensRelations = relations(oidcAccessTokens, ({ one }) => ({
  client: one(oidcClients, {
    fields: [oidcAccessTokens.clientId],
    references: [oidcClients.id],
  }),
  user: one(users, {
    fields: [oidcAccessTokens.userId],
    references: [users.id],
  }),
}));

export const oidcRefreshTokensRelations = relations(oidcRefreshTokens, ({ one }) => ({
  client: one(oidcClients, {
    fields: [oidcRefreshTokens.clientId],
    references: [oidcClients.id],
  }),
  user: one(users, {
    fields: [oidcRefreshTokens.userId],
    references: [users.id],
  }),
}));

export type OidcClient = typeof oidcClients.$inferSelect;
export type NewOidcClient = typeof oidcClients.$inferInsert;
export type OidcAuthorizationCode = typeof oidcAuthorizationCodes.$inferSelect;
export type NewOidcAuthorizationCode = typeof oidcAuthorizationCodes.$inferInsert;
export type OidcAccessToken = typeof oidcAccessTokens.$inferSelect;
export type NewOidcAccessToken = typeof oidcAccessTokens.$inferInsert;
export type OidcRefreshToken = typeof oidcRefreshTokens.$inferSelect;
export type NewOidcRefreshToken = typeof oidcRefreshTokens.$inferInsert;

// ---- Developer Onboarding Guide ----

export const developerOnboardingSteps = pgTable('developer_onboarding_steps', {
  id: serial('id').primaryKey(),
  stepKey: varchar('step_key', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  stepOrder: integer('step_order').notNull(),
  isOptional: boolean('is_optional').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userOnboardingProgress = pgTable(
  'user_onboarding_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    stepId: integer('step_id')
      .notNull()
      .references(() => developerOnboardingSteps.id),
    completed: boolean('completed').notNull().default(false),
    skipped: boolean('skipped').notNull().default(false),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_onboarding_progress_user_step_idx').on(
      table.userId,
      table.stepId
    ),
  ]
);

export const developerOnboardingStepsRelations = relations(developerOnboardingSteps, ({ many }) => ({
  userProgress: many(userOnboardingProgress),
}));

export const userOnboardingProgressRelations = relations(userOnboardingProgress, ({ one }) => ({
  user: one(users, {
    fields: [userOnboardingProgress.userId],
    references: [users.id],
  }),
  step: one(developerOnboardingSteps, {
    fields: [userOnboardingProgress.stepId],
    references: [developerOnboardingSteps.id],
  }),
}));

export type DeveloperOnboardingStep = typeof developerOnboardingSteps.$inferSelect;
export type NewDeveloperOnboardingStep = typeof developerOnboardingSteps.$inferInsert;
export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;
export type NewUserOnboardingProgress = typeof userOnboardingProgress.$inferInsert;

// ---- GitHub Repo Scanner (AI-powered command extraction) ----

export const connectedRepos = pgTable('connected_repos', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  repoUrl: text('repo_url').notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  defaultBranch: varchar('default_branch', { length: 255 }).notNull().default('main'),
  isPrivate: boolean('is_private').notNull().default(false),
  lastScannedAt: timestamp('last_scanned_at'),
  scanStatus: varchar('scan_status', { length: 20 }).notNull().default('pending'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const scannedCommands = pgTable('scanned_commands', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id')
    .notNull()
    .references(() => connectedRepos.id, { onDelete: 'cascade' }),
  sourceFile: varchar('source_file', { length: 500 }).notNull(),
  rawContent: text('raw_content').notNull(),
  extractedCommand: text('extracted_command').notNull(),
  commandType: varchar('command_type', { length: 50 }).notNull().default('shell'),
  frequency: integer('frequency').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const repoGeneratedChallenges = pgTable('repo_generated_challenges', {
  id: serial('id').primaryKey(),
  repoId: integer('repo_id')
    .notNull()
    .references(() => connectedRepos.id, { onDelete: 'cascade' }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  scannedCommandId: integer('scanned_command_id')
    .references(() => scannedCommands.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('beginner'),
  syntaxType: varchar('syntax_type', { length: 50 }).notNull().default('shell'),
  hint: text('hint'),
  importance: integer('importance').notNull().default(5),
  isSelected: boolean('is_selected').notNull().default(true),
  timesCompleted: integer('times_completed').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const repoCategories = pgTable('repo_categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  repoId: integer('repo_id')
    .notNull()
    .references(() => connectedRepos.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }).default('code'),
  challengeCount: integer('challenge_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const connectedReposRelations = relations(connectedRepos, ({ one, many }) => ({
  user: one(users, {
    fields: [connectedRepos.userId],
    references: [users.id],
  }),
  scannedCommands: many(scannedCommands),
  generatedChallenges: many(repoGeneratedChallenges),
  repoCategories: many(repoCategories),
}));

export const scannedCommandsRelations = relations(scannedCommands, ({ one, many }) => ({
  repo: one(connectedRepos, {
    fields: [scannedCommands.repoId],
    references: [connectedRepos.id],
  }),
  generatedChallenges: many(repoGeneratedChallenges),
}));

export const repoGeneratedChallengesRelations = relations(repoGeneratedChallenges, ({ one }) => ({
  repo: one(connectedRepos, {
    fields: [repoGeneratedChallenges.repoId],
    references: [connectedRepos.id],
  }),
  user: one(users, {
    fields: [repoGeneratedChallenges.userId],
    references: [users.id],
  }),
  scannedCommand: one(scannedCommands, {
    fields: [repoGeneratedChallenges.scannedCommandId],
    references: [scannedCommands.id],
  }),
}));

export const repoCategoriesRelations = relations(repoCategories, ({ one }) => ({
  user: one(users, {
    fields: [repoCategories.userId],
    references: [users.id],
  }),
  repo: one(connectedRepos, {
    fields: [repoCategories.repoId],
    references: [connectedRepos.id],
  }),
}));

export type ConnectedRepo = typeof connectedRepos.$inferSelect;
export type NewConnectedRepo = typeof connectedRepos.$inferInsert;
export type ScannedCommand = typeof scannedCommands.$inferSelect;
export type NewScannedCommand = typeof scannedCommands.$inferInsert;
export type RepoGeneratedChallenge = typeof repoGeneratedChallenges.$inferSelect;
export type NewRepoGeneratedChallenge = typeof repoGeneratedChallenges.$inferInsert;
export type RepoCategory = typeof repoCategories.$inferSelect;
export type NewRepoCategory = typeof repoCategories.$inferInsert;

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  UPDATE_MEMBER_ROLE = 'UPDATE_MEMBER_ROLE',
  SSO_LOGIN = 'SSO_LOGIN',
  SSO_CONFIG_UPDATED = 'SSO_CONFIG_UPDATED',
}
