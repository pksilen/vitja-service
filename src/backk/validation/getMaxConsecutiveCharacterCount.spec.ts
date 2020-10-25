import getMaxConsecutiveCharacterCount from './getMaxConsecutiveCharacterCount';

describe('getMaxConsecutiveCharacterCount', () => {
  it('should return 3 when input is "aaab"', () => {
    // GIVEN
    const input = 'aaab';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(3);
  });

  it('should return 3 when input is "aabbbba"', () => {
    // GIVEN
    const input = 'aabbbba';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(4);
  });

  it('should return 3 when input is "aabzzz"', () => {
    // GIVEN
    const input = 'aabzzz';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(3);
  });

  it('should return 3 when input is "abcrnb"', () => {
    // GIVEN
    const input = 'abcrnb';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(3);
  });

  it('should return 4 when input is "489aopqrs87a"', () => {
    // GIVEN
    const input = '489aopqrs87a';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(5);
  });

  it('should return 4 when input is "alop1234"', () => {
    // GIVEN
    const input = 'alop1234';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(4);
  });

  it('should return 4 when input is "qwer6a"', () => {
    // GIVEN
    const input = 'qwer6a';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(4);
  });

  it('should return 4 when input is "l87asdfg123"', () => {
    // GIVEN
    const input = 'l87asdfg123';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(5);
  });

  it('should return 4 when input is "aa11bbzxc"', () => {
    // GIVEN
    const input = 'aa11bbzxc';

    // WHEN
    const count = getMaxConsecutiveCharacterCount(input);

    // THEN
    expect(count).toBe(3);
  });
});
