// Worker stub: bill-run chunks, SMS batches, exports.
// Idempotent handlers with bounded retries + DLQ (spec 01 F10).
export const QUEUES = ['bill-run', 'sms-batch', 'export', 'dunning'] as const;
export type QueueName = (typeof QUEUES)[number];
