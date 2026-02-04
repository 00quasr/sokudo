import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  samlConfigurations,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';
import { requireTeamOwner } from '@/lib/auth/permissions';
import { getSamlConfigByTeamId } from '@/lib/auth/saml';

const samlConfigSchema = z.object({
  entityId: z.string().min(1).max(500),
  ssoUrl: z.string().url(),
  certificate: z.string().min(1),
  sloUrl: z.string().url().optional().or(z.literal('')),
  nameIdFormat: z
    .string()
    .optional()
    .default('urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'),
  signRequests: z.boolean().optional().default(false),
  enabled: z.boolean().optional().default(false),
  allowIdpInitiated: z.boolean().optional().default(false),
  defaultRole: z.enum(['member', 'admin']).optional().default('member'),
  autoProvision: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await requireTeamOwner(user.id);
    const config = await getSamlConfigByTeamId(membership.teamId);

    if (!config) {
      return NextResponse.json({ config: null });
    }

    // Don't send back the full certificate - just indicate it's set
    return NextResponse.json({
      config: {
        id: config.id,
        teamId: config.teamId,
        entityId: config.entityId,
        ssoUrl: config.ssoUrl,
        hasCertificate: !!config.certificate,
        sloUrl: config.sloUrl,
        nameIdFormat: config.nameIdFormat,
        signRequests: config.signRequests,
        enabled: config.enabled,
        allowIdpInitiated: config.allowIdpInitiated,
        defaultRole: config.defaultRole,
        autoProvision: config.autoProvision,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Forbidden';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await requireTeamOwner(user.id);
    const body = await request.json();
    const result = samlConfigSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid configuration', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;
    const existingConfig = await getSamlConfigByTeamId(membership.teamId);

    if (existingConfig) {
      // Allow keeping existing certificate by passing sentinel value
      const certificateValue =
        data.certificate === '___KEEP_EXISTING___'
          ? existingConfig.certificate
          : data.certificate;

      // Update existing
      const [updated] = await db
        .update(samlConfigurations)
        .set({
          entityId: data.entityId,
          ssoUrl: data.ssoUrl,
          certificate: certificateValue,
          sloUrl: data.sloUrl || null,
          nameIdFormat: data.nameIdFormat,
          signRequests: data.signRequests,
          enabled: data.enabled,
          allowIdpInitiated: data.allowIdpInitiated,
          defaultRole: data.defaultRole,
          autoProvision: data.autoProvision,
          updatedAt: new Date(),
        })
        .where(eq(samlConfigurations.id, existingConfig.id))
        .returning();

      await db.insert(activityLogs).values({
        teamId: membership.teamId,
        userId: user.id,
        action: ActivityType.SSO_CONFIG_UPDATED,
      });

      return NextResponse.json({ config: updated });
    } else {
      // Create new
      const [created] = await db
        .insert(samlConfigurations)
        .values({
          teamId: membership.teamId,
          entityId: data.entityId,
          ssoUrl: data.ssoUrl,
          certificate: data.certificate,
          sloUrl: data.sloUrl || null,
          nameIdFormat: data.nameIdFormat,
          signRequests: data.signRequests,
          enabled: data.enabled,
          allowIdpInitiated: data.allowIdpInitiated,
          defaultRole: data.defaultRole,
          autoProvision: data.autoProvision,
          createdBy: user.id,
        })
        .returning();

      await db.insert(activityLogs).values({
        teamId: membership.teamId,
        userId: user.id,
        action: ActivityType.SSO_CONFIG_UPDATED,
      });

      return NextResponse.json({ config: created }, { status: 201 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Forbidden';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await requireTeamOwner(user.id);
    const existingConfig = await getSamlConfigByTeamId(membership.teamId);

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'No SSO configuration found' },
        { status: 404 }
      );
    }

    await db
      .delete(samlConfigurations)
      .where(eq(samlConfigurations.id, existingConfig.id));

    await db.insert(activityLogs).values({
      teamId: membership.teamId,
      userId: user.id,
      action: ActivityType.SSO_CONFIG_UPDATED,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Forbidden';
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
