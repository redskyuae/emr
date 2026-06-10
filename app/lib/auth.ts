import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, organization } from 'better-auth/plugins';

import { db } from '@/app/db';
import * as authSchema from '@/app/db/schema/auth';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema: authSchema }),
  plugins: [
    admin(),
    organization({
      async sendInvitationEmail() {
        // TODO: wire up email provider.
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      phone: { type: 'string', nullable: true, input: true },
    },
  },
  session: {
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
