import * as argon2 from 'argon2';

export default async function hash(value: string) {
  return await argon2.hash(value);
}
