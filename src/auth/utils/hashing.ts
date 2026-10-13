import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hash(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function compare(
  token: string,
  hashedToken: string,
): Promise<boolean> {
  return bcrypt.compare(token, hashedToken);
}