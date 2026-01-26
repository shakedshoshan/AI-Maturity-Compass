export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * A custom error class to represent Firestore permission errors.
 * This error is thrown by the application's data access layer when a
 * Firestore operation fails due to insufficient permissions. It is then
 * caught by a global error handler that displays a helpful overlay
 * to the developer with context about the error.
 */
export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: Cannot ${context.operation} on ${context.path}.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error serializable for the Next.js overlay.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
