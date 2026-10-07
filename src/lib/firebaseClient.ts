export { usingFirebaseEmulators } from './firebaseEnvironment';

let client: Promise<typeof import('./firebase')> | undefined;

export function getFirebaseClient(): Promise<typeof import('./firebase')> {
  if (!client) {
    client = import('./firebase').catch((error) => {
      client = undefined;
      throw error;
    });
  }
  return client;
}
