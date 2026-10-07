import { mutationKey, overlayMutations, validateMutation, type CloudMutation, type CloudSnapshot } from './cloudContracts';

export interface CloudAdapter {
  load: () => Promise<CloudSnapshot>;
  apply: (mutation: CloudMutation) => Promise<void>;
}
export interface SyncStatus {
  state: 'pending' | 'syncing' | 'synced' | 'offline' | 'error';
  pending: number;
  error: string;
}
interface QueuedMutation { revision: number; mutation: CloudMutation }
const STORAGE_FAILURE_MESSAGE = 'This device could not persist your latest changes. They remain in this open page; free up storage and retry before leaving.';
class QueueStorageError extends Error {
  constructor(cause: unknown) {
    super(STORAGE_FAILURE_MESSAGE, { cause });
    this.name = 'QueueStorageError';
  }
}
interface Options {
  userId: string;
  adapter: CloudAdapter;
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  isOnline: () => boolean;
  isCurrentUser: () => boolean;
  onHydrate: (snapshot: CloudSnapshot) => void;
  onStatus: (status: SyncStatus) => void;
}

export function cloudQueueKey(userId: string): string { return `scriber_cloud_queue_v1:user:${userId}`; }

export class CloudSync {
  private pending: Record<string, QueuedMutation> = {};
  private revision = 0;
  private active = true;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private again = false;
  private persistenceFailed = false;
  constructor(private readonly options: Options) {
    const raw = options.storage.getItem(cloudQueueKey(options.userId));
    if (raw) {
      const data: unknown = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('Your pending sync data is invalid. Existing data has been preserved.');
      for (const entry of data) {
        if (!entry || typeof entry !== 'object' || !('revision' in entry) || !Number.isSafeInteger(entry.revision)
          || typeof entry.revision !== 'number' || entry.revision < 1 || !('mutation' in entry)) throw new Error('Invalid pending sync data.');
        const mutation = validateMutation(entry.mutation);
        this.pending[mutationKey(mutation)] = { revision: entry.revision, mutation };
        this.revision = Math.max(this.revision, entry.revision);
      }
    }
  }
  private current(): boolean { return this.active && this.options.isCurrentUser(); }
  private persist(pending = this.pending): void {
    try {
      this.options.storage.setItem(cloudQueueKey(this.options.userId), JSON.stringify(Object.values(pending)));
      this.persistenceFailed = false;
    } catch (error) {
      this.persistenceFailed = true;
      throw new QueueStorageError(error);
    }
  }
  private status(state: SyncStatus['state'], error = ''): void {
    if (this.current()) this.options.onStatus({ state, pending: Object.keys(this.pending).length, error });
  }
  enqueue(value: CloudMutation): void {
    this.enqueueBatch([value]);
  }
  enqueueBatch(values: CloudMutation[]): void {
    if (!this.current()) throw new Error('Your account changed. Please save again in the current account.');
    const mutations = values.map(validateMutation);
    if (!mutations.length) return;
    const pending = { ...this.pending };
    for (let mutation of mutations) {
      const key = mutationKey(mutation);
      const previous = pending[key]?.mutation;
      if (previous?.kind === 'profile' && mutation.kind === 'profile') {
        mutation = { kind: 'profile', profile: mutation.profile ?? previous.profile, preferences: { ...previous.preferences, ...mutation.preferences } };
      }
      pending[key] = { revision: ++this.revision, mutation };
    }
    this.pending = pending;
    try {
      this.persist();
    } catch (error) {
      this.status('error', error instanceof QueueStorageError ? error.message : 'Pending changes could not be persisted.');
      throw error;
    }
    this.status(this.options.isOnline() ? 'pending' : 'offline');
    this.schedule();
  }
  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.sync(); }, 750);
  }
  async sync(): Promise<void> {
    if (!this.current()) return;
    if (!this.options.isOnline()) {
      this.status(this.persistenceFailed ? 'error' : 'offline', this.persistenceFailed ? STORAGE_FAILURE_MESSAGE : '');
      return;
    }
    if (this.running) { this.again = true; return; }
    this.running = true;
    this.status('syncing');
    try {
      if (this.persistenceFailed) this.persist();
      const snapshot = await this.options.adapter.load();
      if (!this.current()) return;
      this.options.onHydrate(overlayMutations(snapshot, Object.values(this.pending).map((entry) => entry.mutation)));
      while (Object.keys(this.pending).length) {
        if (!this.current()) return;
        if (!this.options.isOnline()) { this.status('offline'); return; }
        const [key, entry] = Object.entries(this.pending)[0];
        await this.options.adapter.apply(entry.mutation);
        if (!this.current()) return;
        if (this.pending[key]?.revision === entry.revision) {
          const pending = { ...this.pending };
          delete pending[key];
          this.persist(pending);
          this.pending = pending;
        }
      }
      const confirmed = await this.options.adapter.load();
      if (!this.current()) return;
      this.options.onHydrate(overlayMutations(confirmed, Object.values(this.pending).map((entry) => entry.mutation)));
      this.status(Object.keys(this.pending).length ? 'pending' : 'synced');
    } catch (error) {
      console.warn('Private cloud sync failed', { name: error instanceof Error ? error.name : 'Unknown error' });
      this.status('error', error instanceof QueueStorageError ? error.message : 'Cloud sync could not finish. Your device data and pending changes are retained. Check your connection or Firebase setup, then retry.');
    } finally {
      this.running = false;
      if (this.current() && (this.again || Object.keys(this.pending).length) && this.options.isOnline()) {
        if (this.again) { this.again = false; this.schedule(); }
      }
    }
  }
  stop(): void { this.active = false; if (this.timer) clearTimeout(this.timer); }
}
