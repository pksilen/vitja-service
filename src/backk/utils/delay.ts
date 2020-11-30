export default function delay(delayInMillis: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInMillis));
}
