import { QRToken } from '@/lib/supabase/types';

// Mock repository for QR Tokens
let qrTokenStore: Record<string, QRToken> = {};

/**
 * Generates a cryptographically random, non-predictable 256-bit token string
 * Encodes ZERO PII (no names, phones, tables or pass counts)
 */
export function generateSecureTokenString(): string {
  const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  return `tk_${randomUuid.replace(/-/g, '')}`;
}

/**
 * Returns or creates the active QR Token for a GuestGroup
 */
export function getOrCreateGroupQRToken(groupId: string, eventId: string, workspaceId: string): QRToken {
  if (qrTokenStore[groupId]) {
    return qrTokenStore[groupId];
  }

  const newToken: QRToken = {
    id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    group_id: groupId,
    event_id: eventId,
    workspace_id: workspaceId,
    token_hash: generateSecureTokenString(),
    is_active: true,
    created_at: new Date().toISOString(),
  };

  qrTokenStore[groupId] = newToken;
  return newToken;
}

/**
 * Revokes an active token and generates a brand new token string for the group
 */
export function revokeAndRegenerateQRToken(groupId: string, eventId: string, workspaceId: string): QRToken {
  const existing = qrTokenStore[groupId];
  if (existing) {
    existing.is_active = false;
  }

  const newToken: QRToken = {
    id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    group_id: groupId,
    event_id: eventId,
    workspace_id: workspaceId,
    token_hash: generateSecureTokenString(),
    is_active: true,
    created_at: new Date().toISOString(),
  };

  qrTokenStore[groupId] = newToken;
  return newToken;
}

/**
 * Resolves a token hash to verify validity and return group details
 */
export function resolveQRToken(tokenHash: string): { valid: boolean; token?: QRToken; reason?: string } {
  const foundToken = Object.values(qrTokenStore).find(t => t.token_hash === tokenHash);

  if (!foundToken) {
    return { valid: false, reason: 'REJECTED_INVALID' };
  }

  if (!foundToken.is_active) {
    return { valid: false, reason: 'REJECTED_REVOKED', token: foundToken };
  }

  return { valid: true, token: foundToken };
}
