import * as argon2 from 'argon2';

export default async function hash(value: string) {
  if (value.startsWith('$argon2i$v=19$m=4096,t=3,p=')) {
    return Promise.resolve(value);
  }

  return await argon2.hash(value);
}
