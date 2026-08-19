import type { MigrationScript } from "../../src/lib/migration/migrationRunner.ts";

export const migration001: MigrationScript = {
  migrationId: "001-backfill-application-version",
  name: "Backfill Application Version",
  description: "Sets currentVersion to 1 for all legacy application documents lacking version field.",
  async up(ctx) {
    const snap = await ctx.db.collection("applications").get();
    let affected = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.currentVersion === undefined) {
        if (!ctx.dryRun) {
          await doc.ref.update({ currentVersion: 1 });
        }
        affected++;
      }
    }

    return { scanned: snap.size, affected, errors };
  },
};
