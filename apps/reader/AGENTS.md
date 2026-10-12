# AGENTS.md — MajiBill reader (Expo RN 57, offline-first)

Companion, not clone: route-day reading capture + sync. SQLite outbox
with client UUIDs; server validates; conflicts surface to supervisor.
Other-tenant ids render as not-found, never retried; cached data
clears on tenant switch.

Stack: Expo 57, Expo Router, expo-sqlite, secure-store for refresh.
Gate: Expo verify per slice (recorded). Tracker: `docs/trackers/reader.md`.
Spec: `docs/specs/majibill/01-layers.md` (F03).
