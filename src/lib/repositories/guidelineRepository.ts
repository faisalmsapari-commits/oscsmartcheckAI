import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { Guideline, RuleSet, SystemConfig } from "@/types/guideline";

export class GuidelineRepository {
  private db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  /**
   * Retrieves active guidelines
   */
  async getActiveGuidelines(): Promise<Guideline[]> {
    const col = collection(this.db, "guidelines");
    const q = query(col, where("active", "==", true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Guideline));
  }

  /**
   * Retrieves active rule sets
   */
  async getActiveRuleSets(): Promise<RuleSet[]> {
    const col = collection(this.db, "ruleSets");
    const q = query(col, where("status", "==", "ACTIVE"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RuleSet));
  }

  /**
   * Retrieves a system configuration item
   */
  async getSystemConfig(configKey: string): Promise<SystemConfig | null> {
    const docRef = doc(this.db, "systemConfig", configKey);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return null;
    }

    return { id: snap.id, ...snap.data() } as SystemConfig;
  }
}

export const guidelineRepository = new GuidelineRepository();
