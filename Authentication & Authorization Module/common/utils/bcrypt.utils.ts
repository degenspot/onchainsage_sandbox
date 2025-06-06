import * as bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}