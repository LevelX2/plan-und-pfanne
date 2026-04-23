export function createUserStorageNamespace(userId: number) {
  return `user:${userId}`;
}

export function createUserScopedStorageKey(storageNamespace: string, suffix: string) {
  return `${storageNamespace}:${suffix}`;
}
