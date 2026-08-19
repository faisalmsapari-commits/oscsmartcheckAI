import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "../firebase/admin.ts";
import { FieldValue } from "firebase-admin/firestore";
import type {
  PlanningRuleSet,
  PlanningRule,
  PlanningDataContext,
  RuleEvaluation,
} from "../../types/rules.ts";
import { TEST_RULE_SETS } from "./fixtures.ts";
import { evaluateRule } from "./evaluators/index.ts";

export async function createRuleSet(
  ruleSet: Omit<PlanningRuleSet, "createdAt" | "updatedAt">,
  customDb?: Firestore
): Promise<PlanningRuleSet> {
  const db = customDb || getAdminDb();
  const now = new Date().toISOString();
  const fullRuleSet: PlanningRuleSet = {
    ...ruleSet,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("planningRuleSets").doc(ruleSet.ruleSetId).set({
    ...fullRuleSet,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    eventType: "RULE_SET_CREATED",
    resourceType: "planningRuleSets",
    resourceId: ruleSet.ruleSetId,
    actorUid: ruleSet.createdBy,
    actorRole: "ADMIN",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      code: ruleSet.code,
      version: ruleSet.version,
    },
  });

  return fullRuleSet;
}

export async function publishRuleSet(
  ruleSetId: string,
  officerUid: string,
  customDb?: Firestore
): Promise<PlanningRuleSet> {
  const db = customDb || getAdminDb();
  const setRef = db.collection("planningRuleSets").doc(ruleSetId);
  const snap = await setRef.get();

  if (!snap.exists) {
    throw new Error("Set peraturan tidak dijumpai.");
  }

  const current = snap.data() as PlanningRuleSet;

  // Mark previous version SUPERSEDED
  const existingSnap = await db
    .collection("planningRuleSets")
    .where("code", "==", current.code)
    .where("status", "==", "ACTIVE")
    .get();

  const batch = db.batch();
  for (const doc of existingSnap.docs) {
    if (doc.id !== ruleSetId) {
      batch.update(doc.ref, {
        status: "SUPERSEDED",
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  batch.update(setRef, {
    status: "ACTIVE",
    approvedBy: officerUid,
    approvedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await db.collection("auditLogs").add({
    eventType: "RULE_SET_ACTIVATED",
    resourceType: "planningRuleSets",
    resourceId: ruleSetId,
    actorUid: officerUid,
    actorRole: "ADMIN",
    timestamp: FieldValue.serverTimestamp(),
    metadata: {
      code: current.code,
      version: current.version,
    },
  });

  return { ...current, status: "ACTIVE", approvedBy: officerUid };
}

export async function simulateRule(
  rule: PlanningRule,
  context: PlanningDataContext
): Promise<RuleEvaluation> {
  return await evaluateRule(rule, context);
}

export async function getRuleSets(customDb?: Firestore): Promise<PlanningRuleSet[]> {
  const db = customDb || getAdminDb();
  try {
    const snap = await db.collection("planningRuleSets").get();
    if (snap.empty) {
      return TEST_RULE_SETS;
    }
    return snap.docs.map((d) => d.data() as PlanningRuleSet);
  } catch {
    return TEST_RULE_SETS;
  }
}
