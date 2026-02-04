import { describe, it, expect } from 'vitest';
import {
  isAtLeastRole,
  isAdmin,
  isOwner,
  canRemoveMember,
  canUpdateMemberRole,
} from '../permissions';

describe('permissions', () => {
  describe('isAtLeastRole', () => {
    it('should return true when user role meets the required role', () => {
      expect(isAtLeastRole('owner', 'owner')).toBe(true);
      expect(isAtLeastRole('owner', 'admin')).toBe(true);
      expect(isAtLeastRole('owner', 'member')).toBe(true);
      expect(isAtLeastRole('admin', 'admin')).toBe(true);
      expect(isAtLeastRole('admin', 'member')).toBe(true);
      expect(isAtLeastRole('member', 'member')).toBe(true);
    });

    it('should return false when user role is below the required role', () => {
      expect(isAtLeastRole('member', 'admin')).toBe(false);
      expect(isAtLeastRole('member', 'owner')).toBe(false);
      expect(isAtLeastRole('admin', 'owner')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(isAtLeastRole('unknown', 'member')).toBe(false);
      expect(isAtLeastRole('', 'member')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin and owner roles', () => {
      expect(isAdmin('admin')).toBe(true);
      expect(isAdmin('owner')).toBe(true);
    });

    it('should return false for member role', () => {
      expect(isAdmin('member')).toBe(false);
    });

    it('should return false for unknown roles', () => {
      expect(isAdmin('unknown')).toBe(false);
      expect(isAdmin('')).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true only for owner role', () => {
      expect(isOwner('owner')).toBe(true);
    });

    it('should return false for non-owner roles', () => {
      expect(isOwner('admin')).toBe(false);
      expect(isOwner('member')).toBe(false);
      expect(isOwner('unknown')).toBe(false);
    });
  });

  describe('canRemoveMember', () => {
    it('should not allow removing yourself', async () => {
      expect(await canRemoveMember('owner', 'member', 1, 1)).toBe(false);
      expect(await canRemoveMember('admin', 'member', 1, 1)).toBe(false);
    });

    it('should not allow members to remove anyone', async () => {
      expect(await canRemoveMember('member', 'member', 1, 2)).toBe(false);
    });

    it('should allow owner to remove admin', async () => {
      expect(await canRemoveMember('owner', 'admin', 1, 2)).toBe(true);
    });

    it('should allow owner to remove member', async () => {
      expect(await canRemoveMember('owner', 'member', 1, 2)).toBe(true);
    });

    it('should allow admin to remove member', async () => {
      expect(await canRemoveMember('admin', 'member', 1, 2)).toBe(true);
    });

    it('should not allow admin to remove another admin', async () => {
      expect(await canRemoveMember('admin', 'admin', 1, 2)).toBe(false);
    });

    it('should not allow anyone to remove owner', async () => {
      expect(await canRemoveMember('admin', 'owner', 1, 2)).toBe(false);
      expect(await canRemoveMember('owner', 'owner', 1, 2)).toBe(false);
    });
  });

  describe('canUpdateMemberRole', () => {
    it('should not allow changing own role', async () => {
      expect(await canUpdateMemberRole('owner', 'admin', 'member', 1, 1)).toBe(false);
    });

    it('should not allow non-owners to change roles', async () => {
      expect(await canUpdateMemberRole('admin', 'member', 'admin', 1, 2)).toBe(false);
      expect(await canUpdateMemberRole('member', 'member', 'admin', 1, 2)).toBe(false);
    });

    it('should allow owner to promote member to admin', async () => {
      expect(await canUpdateMemberRole('owner', 'member', 'admin', 1, 2)).toBe(true);
    });

    it('should allow owner to demote admin to member', async () => {
      expect(await canUpdateMemberRole('owner', 'admin', 'member', 1, 2)).toBe(true);
    });

    it('should not allow assigning owner role', async () => {
      expect(await canUpdateMemberRole('owner', 'member', 'owner', 1, 2)).toBe(false);
      expect(await canUpdateMemberRole('owner', 'admin', 'owner', 1, 2)).toBe(false);
    });

    it('should not allow changing another owner role', async () => {
      expect(await canUpdateMemberRole('owner', 'owner', 'admin', 1, 2)).toBe(false);
    });
  });
});
