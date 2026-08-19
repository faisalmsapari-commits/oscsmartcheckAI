"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  User as FirebaseUser,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth } from "@/lib/firebase/auth";
import { getFirestoreDb } from "@/lib/firebase/firestore";
import { UserRole, UserProfile, isValidUserRole } from "@/types/common";

export interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  organizationId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  mockSignIn: (role: UserRole, email?: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAndSyncProfile = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      // 1. Extract Custom Claims from verified ID Token
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const claimRole = tokenResult.claims.role as string | undefined;
      const claimOrgId = tokenResult.claims.organizationId as string | undefined;

      const verifiedRole: UserRole =
        claimRole && isValidUserRole(claimRole) ? claimRole : "APPLICANT";
      const verifiedOrgId = claimOrgId || "PUBLIC";

      setRole(verifiedRole);
      setOrganizationId(verifiedOrgId);

      // 2. Fetch User Profile from Firestore users/{uid}
      const db = getFirestoreDb();
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || data.email || "",
          displayName: firebaseUser.displayName || data.displayName || "Pengguna",
          role: verifiedRole,
          organizationId: verifiedOrgId,
          department: data.department || null,
          designation: data.designation || null,
          active: data.active !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastLoginAt: data.lastLoginAt || null,
        });

        // Update last login timestamp in Firestore
        await setDoc(
          userDocRef,
          {
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      } else {
        // Create baseline profile if first login
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Pengguna Baru",
          role: verifiedRole,
          organizationId: verifiedOrgId,
          department: null,
          designation: null,
          active: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };

        setProfile(newProfile);

        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Pengguna Baru",
          role: verifiedRole,
          organizationId: verifiedOrgId,
          department: null,
          designation: null,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        }).catch(() => {});
      }
    } catch (err) {
      console.error("[AuthContext] Error syncing profile:", err);
    }
  }, []);

  useEffect(() => {
    // 1. Check if mock session exists in localStorage
    if (typeof window !== "undefined") {
      const savedMock = localStorage.getItem("osc_mock_user");
      if (savedMock) {
        try {
          const parsed = JSON.parse(savedMock);
          const targetRole = parsed.role as UserRole;
          const fakeUser = {
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            getIdToken: async () => `mock-token-for-${targetRole}`,
            getIdTokenResult: async () => ({
              claims: {
                role: targetRole,
                organizationId: "MPLBP",
              },
              authTime: new Date().toISOString(),
              issuedAtTime: new Date().toISOString(),
              expirationTime: new Date(Date.now() + 3600000).toISOString(),
              signInProvider: "password",
              signInSecondFactor: null,
              token: `mock-token-for-${targetRole}`,
            }),
          } as unknown as FirebaseUser;

          setUser(fakeUser);
          setRole(targetRole);
          setOrganizationId("MPLBP");
          setProfile({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            role: targetRole,
            organizationId: "MPLBP",
            department: "Unit Pusat Setempat (OSC)",
            designation: targetRole,
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          });
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem("osc_mock_user");
        }
      }
    }

    const auth = getFirebaseAuth();

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchAndSyncProfile(currentUser);
      } else {
        const savedMock = typeof window !== "undefined" ? localStorage.getItem("osc_mock_user") : null;
        if (!savedMock) {
          setUser(null);
          setProfile(null);
          setRole(null);
          setOrganizationId(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchAndSyncProfile]);

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("osc_mock_user");
      }
      const auth = getFirebaseAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      await fetchAndSyncProfile(userCredential.user);
    } finally {
      setIsLoading(false);
    }
  };

  const mockSignIn = async (
    targetRole: UserRole,
    mockEmail?: string,
    mockDisplayName?: string
  ) => {
    setIsLoading(true);
    try {
      const email = mockEmail || `${targetRole.toLowerCase()}@mplbp.gov.my`;
      const displayName = mockDisplayName || `Pegawai ${targetRole}`;
      const uid = `demo-${targetRole.toLowerCase()}-uid`;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "osc_mock_user",
          JSON.stringify({ role: targetRole, email, displayName, uid })
        );
      }

      const fakeUser = {
        uid,
        email,
        displayName,
        getIdToken: async () => `mock-token-for-${targetRole}`,
        getIdTokenResult: async () => ({
          claims: {
            role: targetRole,
            organizationId: "MPLBP",
          },
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          signInProvider: "password",
          signInSecondFactor: null,
          token: `mock-token-for-${targetRole}`,
        }),
      } as unknown as FirebaseUser;

      setUser(fakeUser);
      setRole(targetRole);
      setOrganizationId("MPLBP");
      setProfile({
        uid,
        email,
        displayName,
        role: targetRole,
        organizationId: "MPLBP",
        department: "Unit Pusat Setempat (OSC)",
        designation: targetRole,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOutUser = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("osc_mock_user");
      }
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth).catch(() => {});
      setUser(null);
      setProfile(null);
      setRole(null);
      setOrganizationId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserSession = async () => {
    if (user) {
      await fetchAndSyncProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        organizationId,
        isAuthenticated: !!user,
        isLoading,
        signInWithEmail,
        mockSignIn,
        signOutUser,
        refreshUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
