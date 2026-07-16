/**
 * Raised inside a Visit transaction when the Tenant has no System AppointmentStatus
 * for the category a Visit transition needs (ADR 0030).
 *
 * Throwing rather than calling `tx.rollback()` is deliberate: Drizzle's `rollback()`
 * throws a `TransactionRollbackError` that its own `transaction()` wrapper re-throws
 * after issuing the SQL ROLLBACK, so the repository could never return a typed
 * outcome. A sentinel error rolls back the same way but can be caught at the
 * repository boundary and mapped onto the outcome union.
 */
export class AppointmentStatusNotConfiguredError extends Error {
  constructor() {
    super('Tenant has no System AppointmentStatus for the required category.');
    this.name = 'AppointmentStatusNotConfiguredError';
  }
}
