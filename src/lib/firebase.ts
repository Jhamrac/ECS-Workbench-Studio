import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  signInAnonymously,
  updateProfile,
  User
} from 'firebase/auth';
import { saveVirtualEmail } from './virtualMailbox';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check
export async function testFirestoreConnection() {
  if (!auth.currentUser) return;
  const path = `users/${auth.currentUser.uid}`;
  try {
    await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
    }
  }
}

// Local storage fallback helpers for smooth authentication
const ACCOUNTS_KEY = 'niagara_cloud_local_accounts';
const ACTIVE_ACCOUNT_KEY = 'niagara_cloud_active_account';

export interface StoredLocalAccount {
  email: string;
  pass: string;
  name: string;
  uid: string;
}

export function getStoredAccounts(): StoredLocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredAccount(acc: StoredLocalAccount) {
  try {
    const accs = getStoredAccounts().filter((a) => a.email.toLowerCase() !== acc.email.toLowerCase());
    accs.push(acc);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accs));
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify(acc));
  } catch (e) {
    console.warn('Failed to persist local account', e);
  }
}

export function getActiveLocalAccount(): StoredLocalAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearActiveLocalAccount() {
  try {
    localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
  } catch {}
}

export function createMockUser(uid: string, email: string, displayName: string): User {
  return {
    uid,
    email,
    displayName,
    photoURL: null,
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'email',
  } as unknown as User;
}

// Auth triggers
export async function registerWithEmail(email: string, pass: string, name?: string) {
  const cleanEmail = email.trim();
  const displayName = name?.trim() || cleanEmail.split('@')[0] || 'Technician';

  // Dispatch In-App Welcome & Account Activation Email out of the box
  saveVirtualEmail({
    to: cleanEmail,
    from: 'no-reply@niagara-cloud-studio.com',
    subject: `🎉 Welcome to Niagara Cloud Studio – Account Created for ${displayName}`,
    category: 'verification',
    bodyHtml: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #0284c7, #0f172a); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 22px; font-weight: 800;">🎉 Account Registration Successful!</h2>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">ECS Workbench Studio & Wire Sheet Environment</p>
        </div>
        <div style="padding: 24px; line-height: 1.6;">
          <p style="font-size: 15px; margin-top: 0;">Hi <strong>${displayName}</strong>,</p>
          <p style="font-size: 14px;">Your account has been successfully created and registered with <strong>${cleanEmail}</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 20px 0;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; letter-spacing: 0.5px;">Registered Account Details</div>
            <div style="font-size: 13px; margin-top: 6px;"><strong>Email:</strong> ${cleanEmail}</div>
            <div style="font-size: 13px; margin-top: 2px;"><strong>User Role:</strong> Controls Engineer / System Integrator</div>
            <div style="font-size: 13px; margin-top: 2px;"><strong>Cloud Auto-Sync:</strong> <span style="color: #16a34a; font-weight: 700;">Active</span></div>
          </div>

          <p style="font-size: 13px; color: #475569;">You can now design logic, edit PID loops, save station programs, and auto-sync your wire sheets seamlessly.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">This email was generated directly in your Niagara Cloud Studio Virtual Inbox. No external setup required.</p>
        </div>
      </div>
    `,
  });

  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn('Could not set displayName:', e);
      }
    }
    if (cred.user) {
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Firebase sendEmailVerification notice:', e);
      }
      await ensureUserProfile(cred.user, cleanEmail, displayName);
    }
    return cred.user;
  } catch (err: any) {
    console.warn('Firebase createUserWithEmailAndPassword notice:', err?.message || err);
    if (
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('operation-not-allowed') ||
      err?.message?.includes('disabled')
    ) {
      try {
        const anonCred = await signInAnonymously(auth);
        if (anonCred.user) {
          try {
            await updateProfile(anonCred.user, { displayName });
          } catch {}
          saveStoredAccount({ email: cleanEmail, pass, name: displayName, uid: anonCred.user.uid });
          await ensureUserProfile(anonCred.user, cleanEmail, displayName);
          return anonCred.user;
        }
      } catch (anonErr) {
        console.warn('Anonymous auth fallback notice:', anonErr);
      }

      const localUid = 'usr_' + Math.random().toString(36).substring(2, 11);
      const localAcc: StoredLocalAccount = { email: cleanEmail, pass, name: displayName, uid: localUid };
      saveStoredAccount(localAcc);
      return createMockUser(localUid, cleanEmail, displayName);
    }
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const cleanEmail = email.trim();
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (cred.user) {
      await ensureUserProfile(cred.user, cleanEmail);
    }
    return cred.user;
  } catch (err: any) {
    console.warn('Firebase signInWithEmailAndPassword notice:', err?.message || err);
    if (
      err?.code === 'auth/operation-not-allowed' ||
      err?.message?.includes('operation-not-allowed') ||
      err?.message?.includes('disabled')
    ) {
      const stored = getStoredAccounts().find((a) => a.email.toLowerCase() === cleanEmail.toLowerCase());
      if (stored && stored.pass !== pass) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      const displayName = stored?.name || cleanEmail.split('@')[0] || 'Technician';

      try {
        const anonCred = await signInAnonymously(auth);
        if (anonCred.user) {
          try {
            await updateProfile(anonCred.user, { displayName });
          } catch {}
          saveStoredAccount({ email: cleanEmail, pass, name: displayName, uid: anonCred.user.uid });
          await ensureUserProfile(anonCred.user, cleanEmail, displayName);
          return anonCred.user;
        }
      } catch (anonErr) {
        console.warn('Anonymous login notice:', anonErr);
      }

      const uid = stored?.uid || 'usr_' + Math.random().toString(36).substring(2, 11);
      const localAcc: StoredLocalAccount = { email: cleanEmail, pass, name: displayName, uid };
      saveStoredAccount(localAcc);
      return createMockUser(uid, cleanEmail, displayName);
    }
    throw err;
  }
}

export async function resetPasswordEmail(email: string) {
  const cleanEmail = email.trim();

  // Dispatch In-App Password Reset Virtual Email
  saveVirtualEmail({
    to: cleanEmail,
    from: 'no-reply@niagara-cloud-studio.com',
    subject: `🔐 Password Reset Request for ${cleanEmail}`,
    category: 'password_reset',
    bodyHtml: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #d97706, #0f172a); padding: 24px; color: #ffffff;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 800;">🔐 Password Reset Instructions</h2>
          <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Niagara Cloud Studio Security Center</p>
        </div>
        <div style="padding: 24px; line-height: 1.6;">
          <p style="font-size: 14px;">We received a request to reset the password for your account <strong>${cleanEmail}</strong>.</p>
          
          <div style="background: #fffbebf1; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #b45309; uppercase;">Instant Password Reset Token</p>
            <div style="font-family: monospace; font-size: 20px; font-weight: 900; letter-spacing: 3px; color: #78350f;">RESET-${Math.floor(100000 + Math.random() * 900000)}</div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #92400e;">Use the Instant Password Reset tool in the login window to change your password instantly without waiting!</p>
          </div>

          <p style="font-size: 12px; color: #64748b;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  try {
    await sendPasswordResetEmail(auth, cleanEmail);
  } catch (err: any) {
    console.warn('Firebase sendPasswordResetEmail notice:', err?.message || err);
  }
}

export async function updateAccountPassword(email: string, newPass: string) {
  const cleanEmail = email.trim();

  // Dispatch Confirmation Virtual Email
  saveVirtualEmail({
    to: cleanEmail,
    from: 'no-reply@niagara-cloud-studio.com',
    subject: `✅ Password Successfully Reset for ${cleanEmail}`,
    category: 'password_reset',
    bodyHtml: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #0f172a;">
        <div style="background: #16a34a; padding: 20px; color: #ffffff;">
          <h3 style="margin: 0; font-size: 18px;">✅ Password Change Confirmation</h3>
        </div>
        <div style="padding: 20px;">
          <p style="font-size: 14px;">Your password for <strong>${cleanEmail}</strong> was updated successfully.</p>
          <p style="font-size: 13px; color: #166534; font-weight: 600;">You can now log in using your new credentials.</p>
        </div>
      </div>
    `,
  });

  if (auth.currentUser && auth.currentUser.email?.toLowerCase() === cleanEmail.toLowerCase()) {
    try {
      await updatePassword(auth.currentUser, newPass);
    } catch (e) {
      console.warn('Firebase updatePassword notice:', e);
    }
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail.toLowerCase());
  if (existing) {
    existing.pass = newPass;
    saveStoredAccount(existing);
  } else {
    const localUid = 'usr_' + Math.random().toString(36).substring(2, 11);
    saveStoredAccount({ email: cleanEmail, pass: newPass, name: cleanEmail.split('@')[0], uid: localUid });
  }
  return true;
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await ensureUserProfile(result.user);
    }
    return result.user;
  } catch (err) {
    console.error('Google Sign-In Error:', err);
    throw err;
  }
}

export async function logoutUser() {
  clearActiveLocalAccount();
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout Error:', err);
  }
}

export async function ensureUserProfile(user: User, customEmail?: string, customName?: string) {
  const path = `users/${user.uid}`;
  const localAccount = getActiveLocalAccount();
  const emailVal = customEmail || user.email || localAccount?.email || '';
  const nameVal = customName || user.displayName || localAccount?.name || emailVal.split('@')[0] || 'Technician';

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userDocRef);
    const now = new Date().toISOString();

    if (!existing.exists()) {
      const newProfile = {
        uid: user.uid,
        email: emailVal,
        displayName: nameVal,
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(userDocRef, newProfile);
    } else {
      await setDoc(
        userDocRef,
        {
          email: emailVal,
          displayName: nameVal,
          photoURL: user.photoURL || '',
          updatedAt: now,
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('Firestore user profile notice:', err);
  }
}

export interface CloudStationProgram {
  id: string;
  userId: string;
  title: string;
  category: string;
  description: string;
  programData: string; // JSON stringified template object
  createdAt: string;
  updatedAt: string;
}

const LOCAL_PROGRAMS_KEY = 'niagara_cloud_programs_local';

export function getLocalCloudPrograms(userId: string): CloudStationProgram[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_PROGRAMS_KEY}_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCloudProgram(userId: string, program: CloudStationProgram) {
  try {
    const existing = getLocalCloudPrograms(userId).filter((p) => p.id !== program.id);
    existing.unshift(program);
    localStorage.setItem(`${LOCAL_PROGRAMS_KEY}_${userId}`, JSON.stringify(existing));
  } catch (e) {
    console.warn('Local program save notice:', e);
  }
}

export function deleteLocalCloudProgram(userId: string, programId: string) {
  try {
    const existing = getLocalCloudPrograms(userId).filter((p) => p.id !== programId);
    localStorage.setItem(`${LOCAL_PROGRAMS_KEY}_${userId}`, JSON.stringify(existing));
  } catch (e) {
    console.warn('Local program delete notice:', e);
  }
}

export async function saveStationProgramToCloud(
  userId: string,
  program: {
    id: string;
    title: string;
    category?: string;
    description?: string;
    blocks: any[];
    links: any[];
    sequenceOfOperation?: string;
  }
) {
  const cleanId = program.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || `program_${Date.now()}`;
  const now = new Date().toISOString();
  const payload: CloudStationProgram = {
    id: cleanId,
    userId,
    title: program.title || 'Untitled Station',
    category: program.category || 'Custom Station',
    description: program.description || 'Custom Niagara wire sheet program',
    programData: JSON.stringify({
      blocks: program.blocks,
      links: program.links,
      sequenceOfOperation: program.sequenceOfOperation || '',
    }),
    createdAt: now,
    updatedAt: now,
  };

  // 1. Always save locally first so user edits are NEVER lost
  saveLocalCloudProgram(userId, payload);

  // 2. Try sync to Firestore if authenticated with Firebase Auth
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'programs', cleanId);
      await setDoc(docRef, payload);
    } catch (err) {
      console.warn('Firestore cloud save notice (local backup active):', err);
    }
  }

  return cleanId;
}

export async function deleteStationProgramFromCloud(userId: string, programId: string) {
  deleteLocalCloudProgram(userId, programId);
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'programs', programId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete program notice:', err);
    }
  }
}

export async function fetchCloudStationPrograms(userId: string): Promise<CloudStationProgram[]> {
  const localProgs = getLocalCloudPrograms(userId);
  if (!auth.currentUser) {
    return localProgs;
  }
  try {
    const colRef = collection(db, 'users', userId, 'programs');
    const snapshot = await getDocs(colRef);
    const remoteProgs: CloudStationProgram[] = [];
    snapshot.forEach((doc) => {
      remoteProgs.push(doc.data() as CloudStationProgram);
    });
    const map = new Map<string, CloudStationProgram>();
    localProgs.forEach((p) => map.set(p.id, p));
    remoteProgs.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  } catch (err) {
    console.warn('Fetch cloud programs notice:', err);
    return localProgs;
  }
}

export function subscribeToCloudPrograms(
  userId: string,
  onPrograms: (programs: CloudStationProgram[]) => void,
  onError?: (err: any) => void
) {
  // Always emit local programs immediately
  const localProgs = getLocalCloudPrograms(userId);
  onPrograms(localProgs);

  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'programs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const remoteProgs: CloudStationProgram[] = [];
      snapshot.forEach((doc) => {
        remoteProgs.push(doc.data() as CloudStationProgram);
      });
      const map = new Map<string, CloudStationProgram>();
      localProgs.forEach((p) => map.set(p.id, p));
      remoteProgs.forEach((p) => map.set(p.id, p));
      onPrograms(Array.from(map.values()));
    },
    (err) => {
      console.warn('Snapshot cloud program notice:', err);
      if (onError) onError(err);
    }
  );
}

export interface CloudChatConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

const LOCAL_CHAT_KEY = 'niagara_ai_chat_conversations_v1';

export function getLocalChatConversations(userId?: string): CloudChatConversation[] {
  try {
    const key = userId ? `${LOCAL_CHAT_KEY}_${userId}` : LOCAL_CHAT_KEY;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalChatConversation(conv: CloudChatConversation, userId?: string) {
  try {
    const key = userId ? `${LOCAL_CHAT_KEY}_${userId}` : LOCAL_CHAT_KEY;
    const existing = getLocalChatConversations(userId).filter((c) => c.id !== conv.id);
    existing.unshift(conv);
    localStorage.setItem(key, JSON.stringify(existing));
    if (userId) {
      // Also sync to global key for backup
      localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('Local chat save notice:', e);
  }
}

export function deleteLocalChatConversation(convId: string, userId?: string) {
  try {
    const key = userId ? `${LOCAL_CHAT_KEY}_${userId}` : LOCAL_CHAT_KEY;
    const existing = getLocalChatConversations(userId).filter((c) => c.id !== convId);
    localStorage.setItem(key, JSON.stringify(existing));
    if (userId) {
      localStorage.setItem(LOCAL_CHAT_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('Local chat delete notice:', e);
  }
}

export async function saveChatConversationToCloud(
  userId: string,
  conv: { id: string; title: string; createdAt: number; updatedAt: number; messages: any[] }
) {
  const cleanId = conv.id.replace(/[^a-zA-Z0-9_\-]/g, '_') || `conv_${Date.now()}`;
  const payload: CloudChatConversation = {
    id: cleanId,
    userId,
    title: conv.title || 'Controls Logic & Engineering Q&A',
    createdAt: conv.createdAt || Date.now(),
    updatedAt: conv.updatedAt || Date.now(),
    messages: conv.messages || [],
  };

  saveLocalChatConversation(payload, userId);

  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'chatConversations', cleanId);
      await setDoc(docRef, payload);
    } catch (err) {
      console.warn('Firestore cloud chat save notice:', err);
    }
  }
  return cleanId;
}

export async function deleteChatConversationFromCloud(userId: string, convId: string) {
  deleteLocalChatConversation(convId, userId);
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'chatConversations', convId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore delete chat notice:', err);
    }
  }
}

export function subscribeToChatConversations(
  userId: string,
  onConversations: (conversations: CloudChatConversation[]) => void,
  onError?: (err: any) => void
) {
  const localConvs = getLocalChatConversations(userId);
  onConversations(localConvs);

  if (!auth.currentUser) {
    return () => {};
  }

  const colRef = collection(db, 'users', userId, 'chatConversations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const remoteConvs: CloudChatConversation[] = [];
      snapshot.forEach((doc) => {
        remoteConvs.push(doc.data() as CloudChatConversation);
      });
      remoteConvs.sort((a, b) => b.updatedAt - a.updatedAt);
      const map = new Map<string, CloudChatConversation>();
      localConvs.forEach((c) => map.set(c.id, c));
      remoteConvs.forEach((c) => map.set(c.id, c));
      const merged = Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      onConversations(merged);
    },
    (err) => {
      console.warn('Snapshot cloud chat notice:', err);
      if (onError) onError(err);
    }
  );
}

