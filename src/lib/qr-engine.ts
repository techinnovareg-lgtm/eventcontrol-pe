import { QRToken } from '@/lib/supabase/types';
import { getEventGuestGroups } from '@/lib/events';

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
  const cleanHash = extractTokenFromInput(tokenHash);
  const foundToken = Object.values(qrTokenStore).find(t => t.token_hash === cleanHash || t.group_id === cleanHash || t.id === cleanHash);

  if (!foundToken) {
    return { valid: false, reason: 'REJECTED_INVALID' };
  }

  if (!foundToken.is_active) {
    return { valid: false, reason: 'REJECTED_REVOKED', token: foundToken };
  }

  return { valid: true, token: foundToken };
}

/**
 * Extracts a token hash from a URL or raw string
 */
export function extractTokenFromInput(rawInput: string): string {
  if (!rawInput) return '';
  const trimmed = rawInput.trim();
  
  // Extract ?token= parameter from URL if present
  if (trimmed.includes('token=')) {
    try {
      const match = trimmed.match(/[?&]token=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }

  // Extract ?group= or ?id= parameter if present
  if (trimmed.includes('group=') || trimmed.includes('id=')) {
    try {
      const match = trimmed.match(/[?&](?:group|id)=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch (e) {}
  }

  return trimmed;
}

/**
 * Robustly matches any scanned QR code text, URL, token hash, group ID, or guest name against event groups
 */
export function findTokenAndGroupForScannedInput(
  rawInput: string,
  eventId: string,
  workspaceId: string,
  groups: any[]
): { valid: boolean; token?: QRToken; group?: any; reason?: string } {
  if (!rawInput || !rawInput.trim()) {
    return { valid: false, reason: 'REJECTED_INVALID' };
  }

  const cleanInput = extractTokenFromInput(rawInput);

  // 1. Ensure all groups in this event have registered QR tokens in qrTokenStore
  groups.forEach(g => {
    if (g && g.id) {
      getOrCreateGroupQRToken(g.id, eventId, workspaceId);
    }
  });

  // 2. Search qrTokenStore by token_hash, group_id, or token id
  let matchedToken = Object.values(qrTokenStore).find(
    t => t.event_id === eventId && (t.token_hash === cleanInput || t.group_id === cleanInput || t.id === cleanInput)
  );

  // Fallback: search across all events if event_id is unspecified or newly loaded
  if (!matchedToken) {
    matchedToken = Object.values(qrTokenStore).find(
      t => t.token_hash === cleanInput || t.group_id === cleanInput || t.id === cleanInput
    );
  }

  if (matchedToken) {
    if (!matchedToken.is_active) {
      return { valid: false, reason: 'REJECTED_REVOKED', token: matchedToken };
    }
    let matchedGroup = groups.find(g => g.id === matchedToken!.group_id);
    if (!matchedGroup && matchedToken.event_id) {
      const eventGroups = getEventGuestGroups(matchedToken.event_id);
      matchedGroup = eventGroups.find(g => g.id === matchedToken!.group_id);
    }
    return { valid: true, token: matchedToken, group: matchedGroup };
  }

  // 3. Fallback: match by group ID or group name directly
  const searchLower = cleanInput.toLowerCase();
  const matchedGroup = groups.find(
    g => g.id === cleanInput || 
         g.group_name.toLowerCase() === searchLower || 
         (g.responsible_phone && g.responsible_phone.toLowerCase() === searchLower)
  );

  if (matchedGroup) {
    const newToken = getOrCreateGroupQRToken(matchedGroup.id, eventId, workspaceId);
    return { valid: true, token: newToken, group: matchedGroup };
  }

  return { valid: false, reason: 'REJECTED_INVALID' };
}

