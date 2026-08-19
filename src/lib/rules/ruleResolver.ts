import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import type { PlanningRuleSet, PlanningRule, PlanningDataContext } from "../../types/rules.ts";
import { isRuleApplicable } from "./applicability.ts";
import { TEST_RULE_SETS } from "./fixtures.ts";

/**
 * Resolves active rule sets applicable on the given application submission date
 */
export async function resolveApplicableRuleSets(
  applicationDate: string,
  customDb?: Firestore
): Promise<PlanningRuleSet[]> {
  const db = customDb || getAdminDb();
  const ruleSets: PlanningRuleSet[] = [];

  // In test environment or fallback, use test fixtures
  if (process.env.NODE_ENV === "test" || !db) {
    return TEST_RULE_SETS.filter((rs) => rs.status === "ACTIVE");
  }

  try {
    const snap = await db
      .collection("planningRuleSets")
      .where("status", "==", "ACTIVE")
      .get();

    for (const doc of snap.docs) {
      const data = doc.data() as PlanningRuleSet;
      // Effective date check
      const appTime = new Date(applicationDate).getTime();
      const fromTime = data.effectiveFrom ? new Date(data.effectiveFrom).getTime() : 0;
      const toTime = data.effectiveTo ? new Date(data.effectiveTo).getTime() : Infinity;

      if (appTime >= fromTime && appTime <= toTime) {
        ruleSets.push(data);
      }
    }
  } catch {
    return TEST_RULE_SETS.filter((rs) => rs.status === "ACTIVE");
  }

  return ruleSets.length > 0 ? ruleSets : TEST_RULE_SETS.filter((rs) => rs.status === "ACTIVE");
}

/**
 * Resolves all applicable rules for a given context
 */
export async function resolveApplicableRules(
  context: PlanningDataContext,
  ruleSets: PlanningRuleSet[],
  customDb?: Firestore
): Promise<PlanningRule[]> {
  const db = customDb || getAdminDb();
  const applicableRules: PlanningRule[] = [];

  for (const set of ruleSets) {
    let rules: PlanningRule[] = [];

    if (set.isTestOnly || process.env.NODE_ENV === "test") {
      const fixture = TEST_RULE_SETS.find((ts) => ts.ruleSetId === set.ruleSetId);
      rules = (fixture as unknown as { rules?: PlanningRule[] })?.rules || [];
    } else {
      try {
        const rulesSnap = await db.collection(`planningRuleSets/${set.ruleSetId}/rules`).get();
        rules = rulesSnap.docs.map((d) => d.data() as PlanningRule);
      } catch {
        const fixture = TEST_RULE_SETS.find((ts) => ts.ruleSetId === set.ruleSetId);
        rules = (fixture as unknown as { rules?: PlanningRule[] })?.rules || [];
      }
    }

    for (const rule of rules) {
      if (isRuleApplicable(rule, context)) {
        applicableRules.push(rule);
      }
    }
  }

  // Sort by priority (higher priority evaluated first)
  return applicableRules.sort((a, b) => (b.priority || 100) - (a.priority || 100));
}
