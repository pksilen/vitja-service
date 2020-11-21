import _IdAndVersion from "./_IdAndVersion";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndLastModifiedTimestamp extends _IdAndVersion {
  lastModifiedTimestamp!: Date;
}
