// src/auth/utils/token.ts
import { randomBytes } from 'crypto';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

import { createHash } from 'crypto';

export function hashToken(token: string): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}
