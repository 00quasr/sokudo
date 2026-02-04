import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { db } from '@/lib/db/drizzle';
import { accounts, users, teams, teamMembers, type NewUser, type NewAccount } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { type NewTeamMember, type NewTeam } from '@/lib/db/schema';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        // Check if user already exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        let userId: number;

        if (!existingUser) {
          // Create new user
          const newUser: NewUser = {
            email: user.email,
            name: user.name || null,
            image: user.image || null,
            emailVerified: new Date(),
            passwordHash: null, // OAuth users don't have passwords
            role: 'owner',
          };

          const [createdUser] = await db.insert(users).values(newUser).returning();
          userId = createdUser.id;

          // Create team for new user
          const newTeam: NewTeam = {
            name: `${user.email}'s Team`,
          };

          const [createdTeam] = await db.insert(teams).values(newTeam).returning();

          if (createdTeam) {
            const newTeamMember: NewTeamMember = {
              userId: userId,
              teamId: createdTeam.id,
              role: 'owner',
            };

            await db.insert(teamMembers).values(newTeamMember);
          }
        } else {
          userId = existingUser.id;
        }

        // Check if account is already linked
        if (account) {
          const [existingAccount] = await db
            .select()
            .from(accounts)
            .where(
              and(
                eq(accounts.provider, account.provider),
                eq(accounts.providerAccountId, account.providerAccountId)
              )
            )
            .limit(1);

          if (!existingAccount) {
            // Link the account
            const newAccount: NewAccount = {
              userId: userId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token ? String(account.refresh_token) : null,
              access_token: account.access_token ? String(account.access_token) : null,
              expires_at: account.expires_at ? Number(account.expires_at) : null,
              token_type: account.token_type ? String(account.token_type) : null,
              scope: account.scope ? String(account.scope) : null,
              id_token: account.id_token ? String(account.id_token) : null,
              session_state: account.session_state ? String(account.session_state) : null,
            };

            await db.insert(accounts).values(newAccount);
          }
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // On initial sign in, attach user ID
      if (user && user.email) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  session: {
    strategy: 'jwt',
  },
});
