/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";

export interface MigrationContext {
  db: Firestore;
  dryRun: boolean;
}

export interface MigrationResult {
  migrationId: string;
  name: string;
  dryRun: boolean;
  documentsScanned: number;
  documentsAffected: number;
  errorsCount: number;
  errors: string[];
  durationMs: number;
}

export interface MigrationScript {
  migrationId: string;
  name: string;
  description: string;
  up: (ctx: MigrationContext) => Promise<{ scanned: number; affected: number; errors: string[] }>;
  down?: (ctx: MigrationContext) => Promise<void>;
}

/**
 * Executes a migration script with dry-run support and auditing
 */
export async function runMigration(
  script: MigrationScript,
  dryRun = false,
  customDb?: Firestore
): Promise<MigrationResult> {
  const db = customDb || getAdminDb();
  const startTime = Date.now();

  const ctx: MigrationContext = { db, dryRun };
  const execution = await script.up(ctx);
  const durationMs = Date.now() - startTime;

  const result: MigrationResult = {
    migrationId: script.migrationId,
    name: script.name,
    dryRun,
    documentsScanned: execution.scanned,
    documentsAffected: execution.affected,
    errorsCount: execution.errors.length,
    errors: execution.errors,
    durationMs,
  };

  if (!dryRun) {
    await db.collection("migrationsHistory").doc(script.migrationId).set({
      ...result,
      executedAt: FieldValue.serverTimestamp(),
    });
  }

  return result;
}
