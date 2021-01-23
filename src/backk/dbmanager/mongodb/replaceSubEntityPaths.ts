export default function replaceSubEntityPaths<T extends { subEntityPath?: string }>(
  operations: T[] | undefined,
  wantedSubEntityPath: string
): T[] {
  return (
    operations
      ?.filter((operation) => {
        return operation.subEntityPath === wantedSubEntityPath;
      })
      .map((operation) => {
        let [, subEntityPathPostFix] = (operation.subEntityPath ?? '').split(wantedSubEntityPath);
        if (subEntityPathPostFix[0] === '.') {
          subEntityPathPostFix = subEntityPathPostFix.slice(1);
        }
        return {
          ...operation,
          subEntityPath: subEntityPathPostFix
        };
      }) ?? []
  );
}
