import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// This is a NodeJS event emitter, but it works in the browser.
// We are using it to globally communicate Firestore permission errors.
// A listener in the FirebaseProvider will catch these and display an overlay.
class TypedEventEmitter extends EventEmitter {
  emit<T extends keyof Events>(event: T, ...args: Parameters<Events[T]>) {
    return super.emit(event, ...args);
  }

  on<T extends keyof Events>(event: T, listener: Events[T]) {
    return super.on(event, listener);
  }
}

export const errorEmitter = new TypedEventEmitter();
