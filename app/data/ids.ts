/**
 * Branded id types. These are zero-cost at runtime — they are plain
 * strings — but they prevent accidentally mixing up a `UserId`, a
 * `GroupId`, and an `EventId` at compile time.
 *
 * When the cloud rollout swaps mock string ids (`alex`, `group1`, …)
 * for Supabase UUIDs, the brand survives unchanged: only the underlying
 * string format changes. This is the seam that keeps id-shape drift
 * from silently sneaking through.
 */

declare const userIdBrand: unique symbol;
declare const groupIdBrand: unique symbol;
declare const eventIdBrand: unique symbol;
declare const actorIdBrand: unique symbol;
declare const messageIdBrand: unique symbol;

export type UserId = string & { readonly [userIdBrand]: true };
export type GroupId = string & { readonly [groupIdBrand]: true };
export type EventId = string & { readonly [eventIdBrand]: true };
export type ActorId = string & { readonly [actorIdBrand]: true };
export type MessageId = string & { readonly [messageIdBrand]: true };

/**
 * Cast helpers. Use these at trusted boundaries (repository
 * implementations, seed data, `useLocalSearchParams` results) — never
 * to launder unknown user input.
 */
export const toUserId = (value: string): UserId => value as UserId;
export const toGroupId = (value: string): GroupId => value as GroupId;
export const toEventId = (value: string): EventId => value as EventId;
export const toActorId = (value: string): ActorId => value as ActorId;
export const toMessageId = (value: string): MessageId => value as MessageId;
