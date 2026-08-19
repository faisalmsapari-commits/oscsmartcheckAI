import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { UserProfile } from "@/types/common";

export class UserRepository {
  private db: Firestore;

  constructor(customDb?: Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  /**
   * Retrieves a user profile by UID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(this.db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      return null;
    }

    return { uid: snap.id, ...snap.data() } as UserProfile;
  }

  /**
   * Updates non-sensitive user profile fields (displayName, department, designation)
   */
  async updateProfileInfo(
    uid: string,
    updates: { displayName?: string; department?: string | null; designation?: string | null }
  ): Promise<{ success: boolean }> {
    const userRef = doc(this.db, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  }

  /**
   * Initializes basic profile if new user
   */
  async initializeUserProfile(profile: UserProfile): Promise<{ success: boolean }> {
    const userRef = doc(this.db, "users", profile.uid);
    await setDoc(
      userRef,
      {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true };
  }
}

export const userRepository = new UserRepository();
