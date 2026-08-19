import type { MigrationScript } from "../../src/lib/migration/migrationRunner.ts";

export const migration002: MigrationScript = {
  migrationId: "002-add-site-version",
  name: "Add Site Version",
  description: "Initializes siteVersion to 1 for site records.",
  async up(ctx) {
    const snap = await ctx.db.collection("sites").get();
    let affected = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.siteVersion === undefined) {
        if (!ctx.dryRun) {
          await doc.ref.update({ siteVersion: 1 });
        }
        affected++;
      }
    }

    return { scanned: snap.size, affected, errors };
  },
};
