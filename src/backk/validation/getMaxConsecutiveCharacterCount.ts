export default function getMaxConsecutiveCharacterCount(str: string): number {
  let maxConsecutiveIdenticalCharacterCount = 0;
  for (let i = 0; i < str.length; i++) {
    const character = str[i];
    let consecutiveIdenticalCharacterCount = 1;
    for (let j = i + 1; j < str.length; j++) {
      if (str[j] === character) {
        consecutiveIdenticalCharacterCount++;
        if (
          j == str.length - 1 &&
          consecutiveIdenticalCharacterCount > maxConsecutiveIdenticalCharacterCount
        ) {
          maxConsecutiveIdenticalCharacterCount = consecutiveIdenticalCharacterCount;
        }
      } else {
        if (consecutiveIdenticalCharacterCount > maxConsecutiveIdenticalCharacterCount) {
          maxConsecutiveIdenticalCharacterCount = consecutiveIdenticalCharacterCount;
        }
        // noinspection BreakStatementJS
        break;
      }
    }
  }

  let maxAlphabeticallyConsecutiveCharacterCount = 0;
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    let alphabeticallyConsecutiveCharacterCount = 1;
    for (let j = i + 1; j < str.length; j++) {
      if (str.charCodeAt(j) === charCode + 1) {
        alphabeticallyConsecutiveCharacterCount++;
        charCode++;
        if (
          j === str.length - 1 &&
          alphabeticallyConsecutiveCharacterCount > maxAlphabeticallyConsecutiveCharacterCount
        ) {
          maxAlphabeticallyConsecutiveCharacterCount = alphabeticallyConsecutiveCharacterCount;
        }
      } else {
        if (alphabeticallyConsecutiveCharacterCount > maxAlphabeticallyConsecutiveCharacterCount) {
          maxAlphabeticallyConsecutiveCharacterCount = alphabeticallyConsecutiveCharacterCount;
        }
        // noinspection BreakStatementJS
        break;
      }
    }
  }

  let maxInKeyboardLayoutConsecutiveLetterCount = 0;
  const letters = 'qwertyuiopasdfghjklzxcvbnm';
  for (let i = 0; i < str.length; i++) {
    for (let j = 1; j <= str.length - i; j++) {
      if (letters.indexOf(str.slice(i, i + j)) !== -1) {
        if (j > maxInKeyboardLayoutConsecutiveLetterCount) {
          maxInKeyboardLayoutConsecutiveLetterCount = j;
        }
      }
    }
  }

  return Math.max(
    maxConsecutiveIdenticalCharacterCount,
    maxAlphabeticallyConsecutiveCharacterCount,
    maxInKeyboardLayoutConsecutiveLetterCount
  );
}
