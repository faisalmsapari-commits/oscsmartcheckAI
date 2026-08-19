import type { MigrationScript } from "../../src/lib/migration/migrationRunner.ts";

export const migration003: MigrationScript = {
  migrationId: "003-normalize-rule-status",
  name: "Normalize Rule Status",
  description: "Ensures all planning rules have a normalized status field (ACTIVE / DRAFT / SUPERSEDED).",
  async up(ctx) {
    const snap = await ctx.db.collection("planningRules").get();
    let affected = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      if (!data.status) {
        if (!ctx.dryRun) {
          await doc.ref.update({ status: "ACTIVE" });
        }
        affected++;
      }
    }

    return { scanned: snap.size, affected, errors };
  },
};
