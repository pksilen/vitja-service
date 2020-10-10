export default function shouldHashValue(key: string): boolean {
  return key.toLowerCase().includes('password');
}
