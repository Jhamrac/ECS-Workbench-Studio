import React, { useState } from 'react';
import {
  X,
  User,
  Cloud,
  CloudUpload,
  LogOut,
  LogIn,
  RefreshCw,
  FolderOpen,
  Trash2,
  Check,
  ShieldCheck,
  Zap,
  Globe,
  UserPlus,
  KeyRound,
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckSquare,
  Square,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { CloudStationProgram } from '../lib/firebase';
import { NiagaraProgram } from '../types/niagara';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProgram: NiagaraProgram;
  onLoadProgram: (program: NiagaraProgram) => void;
  onOpenMailbox?: () => void;
  unreadMailCount?: number;
}

type AuthViewMode = 'OPTIONS' | 'SIGN_IN' | 'REGISTER' | 'RESET_PASSWORD';

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentProgram,
  onLoadProgram,
  onOpenMailbox,
  unreadMailCount = 0,
}) => {
  const { isDark } = useNiagaraTheme();
  const {
    user,
    isLoadingAuth,
    cloudPrograms,
    isSyncing,
    lastSyncedAt,
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
    sendResetPasswordEmail,
    updateAccountPassword,
    logout,
    saveCurrentToCloud,
    deleteFromCloud,
  } = useAuth();

  const [viewMode, setViewMode] = useState<AuthViewMode>('OPTIONS');
  const [acknowledgedWip, setAcknowledgedWip] = useState<boolean>(false);
  const [ackError, setAckError] = useState<boolean>(false);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const validateAcknowledgment = (): boolean => {
    if (!acknowledgedWip) {
      setAckError(true);
      return false;
    }
    setAckError(false);
    return true;
  };

  const handleContinueAsGuest = () => {
    if (!validateAcknowledgment()) return;
    onClose();
  };

  const handleSelectOptionMode = (mode: AuthViewMode) => {
    if (!validateAcknowledgment()) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setViewMode(mode);
  };

  const handleGoogleSignIn = async () => {
    if (!validateAcknowledgment()) return;
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      setViewMode('OPTIONS');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in with Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcknowledgment()) return;
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      setViewMode('OPTIONS');
    } catch (err: any) {
      let msg = err?.message || 'Sign in failed.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please try again or use password reset.';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Email/Password sign-in is disabled in your Firebase project console. Please use Google 1-Click Sign In below or enable Email/Password provider in Firebase Console.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcknowledgment()) return;
    if (!email || !password) {
      setErrorMessage('Please provide an email and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await registerWithEmail(email, password, displayName || undefined);
      setSuccessMessage(`✅ Account registered & logged in for ${email}! Real-time cloud station auto-sync is now active.`);
      setViewMode('OPTIONS');
    } catch (err: any) {
      let msg = err?.message || 'Failed to create account.';
      if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email address already exists. Please sign in instead.';
      } else if (msg.includes('auth/operation-not-allowed')) {
        msg = 'Email/Password account creation is disabled in your Firebase project console. Click "Instant 1-Click Sign In with Google" below to create your account immediately!';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcknowledgment()) return;
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Please enter a new password of at least 6 characters.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await updateAccountPassword(email, newPassword);
      setSuccessMessage(`✅ Password for ${email} updated successfully! You can now sign in with your new password immediately.`);
      setPassword(newPassword);
      setTimeout(() => setViewMode('SIGN_IN'), 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAcknowledgment()) return;
    if (!email) {
      setErrorMessage('Please enter your email address to receive reset instructions.');
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await sendResetPasswordEmail(email);
      setSuccessMessage(`Reset link dispatched to ${email}. (Note: Outbound email delivery requires SMTP configured in Firebase Console. You can also use Instant Password Reset above to set a new password right away).`);
    } catch (err: any) {
      let msg = err?.message || 'Failed to send password reset email.';
      if (msg.includes('auth/user-not-found')) {
        msg = 'No account found with this email address. Please check spelling or create a new account.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCurrent = async () => {
    setErrorMessage(null);
    try {
      await saveCurrentToCloud({
        id: currentProgram.id || `station_${Date.now()}`,
        title: currentProgram.title,
        category: currentProgram.category,
        description: currentProgram.description,
        blocks: currentProgram.blocks,
        links: currentProgram.links,
        sequenceOfOperation: currentProgram.sequenceOfOperation,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sync station program to cloud.');
    }
  };

  const handleLoadCloudProgram = (cp: CloudStationProgram) => {
    try {
      const parsedData = JSON.parse(cp.programData);
      const prog: NiagaraProgram = {
        id: cp.id,
        title: cp.title,
        category: cp.category || 'Cloud Station',
        description: cp.description || '',
        blocks: parsedData.blocks || [],
        links: parsedData.links || [],
        sequenceOfOperation: parsedData.sequenceOfOperation || '',
        rebuildSteps: [],
      };
      onLoadProgram(prog);
      onClose();
    } catch (err) {
      setErrorMessage('Failed to parse station program payload from cloud.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-[#0a1120] border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'bg-[#0f1b33] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>ECS Workbench Studio Cloud Sync</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                  Firebase Cloud
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-device wire sheet backup, user accounts & cloud storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Work In Progress Mandatory Acknowledgment Checkbox (for unauthenticated users) */}
          {!user && (
            <div
              className={`p-3.5 rounded-xl border transition-all ${
                ackError
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                  : acknowledgedWip
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/50'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acknowledgedWip}
                  onChange={(e) => {
                    setAcknowledgedWip(e.target.checked);
                    if (e.target.checked) setAckError(false);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer accent-sky-600"
                />
                <div className="text-xs space-y-1">
                  <span
                    className={`font-black ${
                      ackError
                        ? 'text-amber-700 dark:text-amber-400 font-extrabold'
                        : acknowledgedWip
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    I acknowledge that this is a work-in-progress build & doesn't represent the final product
                  </span>
                  {ackError && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      You must check this box before choosing an option to proceed.
                    </p>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                isDark
                  ? 'bg-red-950/70 border-red-800 text-red-200'
                  : 'bg-red-50 border-red-300 text-red-950 font-medium'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="font-semibold text-xs leading-snug">
                {errorMessage.startsWith('{')
                  ? 'Notice: Real-time cloud station backup is automatically saving your changes locally.'
                  : errorMessage}
              </span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-start gap-2">
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* LOGGED IN USER VIEW */}
          {user ? (
            <div className="space-y-5">
              {/* Account profile card */}
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{user.displayName || user.email?.split('@')[0]}</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{user.email}</div>
                    </div>
                  </div>

                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Firestore Account Active</span>
                  </div>
                  {lastSyncedAt && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Last synced: {lastSyncedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* In-App Mailbox Messages Card (Bundled into Account Management Menu) */}
              <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>In-App Mailbox Inbox</span>
                      {unreadMailCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] animate-pulse">
                          {unreadMailCount} New
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800/60 text-amber-300 border border-amber-500/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      View dispatched verification emails, password resets & wire sheet notifications
                    </p>
                  </div>
                </div>
                {onOpenMailbox && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMailbox();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Open Mailbox</span>
                  </button>
                )}
              </div>

              {/* Automated Real-Time Cloud Sync Banner */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
                    Automated Real-Time Cloud Sync Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {currentProgram.title}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Auto-Sync Live
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentProgram.blocks.length} Blocks, {currentProgram.links.length} Links ({currentProgram.category})
                </p>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium pt-0.5">
                  ⚡ All edits, block movements, wiring changes, and library updates save automatically in real-time.
                </p>
              </div>

              {/* Saved Cloud Programs Library */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                    <span>Your Cloud Wire Sheets ({cloudPrograms.length})</span>
                  </h3>
                </div>

                {cloudPrograms.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs space-y-1">
                    <div className="font-bold text-slate-700 dark:text-slate-300">Your cloud library is ready</div>
                    <p>Changes on your wire sheet are automatically backing up to your account right now.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cloudPrograms.map((cp) => (
                      <div
                        key={cp.id}
                        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-colors ${
                          isDark
                            ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{cp.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                              {cp.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Updated: {new Date(cp.updatedAt).toLocaleDateString()} at {new Date(cp.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadCloudProgram(cp)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Load Wire Sheet</span>
                          </button>

                          <button
                            onClick={() => deleteFromCloud(cp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            title="Delete cloud program"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* UNAUTHENTICATED USER VIEWS */
            <div>
              {/* MODE 1: OPTION SELECTION POPUP */}
              {viewMode === 'OPTIONS' && (
                <div className="space-y-4">
                  <div className="text-center space-y-1.5 py-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      Cloud Sync & Account Access
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Sync your Niagara wire sheets securely across devices using any email address (Outlook, Yahoo, Gmail, or company domain).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {/* Create Account Button */}
                    <button
                      onClick={() => handleSelectOptionMode('REGISTER')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group ${
                        acknowledgedWip
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-500 shadow-md hover:scale-[1.02]'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-black text-sm flex items-center justify-between">
                          <span>Create Account</span>
                          <span className="text-xs font-mono font-bold opacity-80">Free</span>
                        </div>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Register with any email address (Outlook, Yahoo, custom domain, etc.)
                        </p>
                      </div>
                    </button>

                    {/* Sign In Button */}
                    <button
                      onClick={() => handleSelectOptionMode('SIGN_IN')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all group ${
                        acknowledgedWip
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md hover:scale-[1.02]'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <LogIn className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-black text-sm">Sign In</div>
                        <p className="text-[11px] opacity-90 mt-0.5">
                          Log in to your existing account & resume cloud station sync
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Alternative 1-Click Google Sign In */}
                  <div className="pt-2">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
                        acknowledgedWip
                          ? isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 opacity-60'
                      }`}
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Globe className="w-4 h-4 text-sky-500" />
                      )}
                      <span>Quick Sign In with Google Account</span>
                    </button>
                  </div>

                  {/* Continue as Local Guest Option */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
                    <button
                      onClick={handleContinueAsGuest}
                      className={`text-xs font-extrabold underline underline-offset-4 cursor-pointer transition-colors ${
                        acknowledgedWip
                          ? 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      Continue as Local Guest (No Cloud Backup)
                    </button>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Continuing in guest mode is restricted to local browser storage only; it does not include secure cloud backups or cross-device workspace synchronization.
                    </p>
                  </div>
                </div>
              )}

              {/* MODE 2: SIGN IN VIEW */}
              {viewMode === 'SIGN_IN' && (
                <form onSubmit={handleSignInEmail} className="space-y-4">
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setViewMode('OPTIONS')}
                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Options</span>
                    </button>
                    <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                      Sign In
                    </span>
                  </div>

                  {/* 1-Click Google Sign In Fast Track */}
                  <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
                        Fast Track Access
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-600 dark:text-sky-300">
                        1-Click Instant
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className={`w-full py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-950 border-slate-300 shadow-xs'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-sky-500" />
                      <span>Sign In with Google Account</span>
                    </button>
                  </div>

                  <div className="relative py-1 flex items-center justify-center">
                    <div className={`absolute inset-0 flex items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="w-full border-t" />
                    </div>
                    <span className={`relative px-2.5 text-[10px] font-black uppercase ${isDark ? 'bg-[#0a1120] text-slate-400' : 'bg-white text-slate-500'}`}>
                      OR SIGN IN WITH EMAIL
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        Email Address (Outlook, Yahoo, Gmail, etc.)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="technician@outlook.com"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`block text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage(null);
                            setSuccessMessage(null);
                            setViewMode('RESET_PASSWORD');
                          }}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-500 dark:text-sky-400 underline cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setViewMode('REGISTER')}
                      className={`text-xs font-bold cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      Need an account? <span className="text-sky-600 underline font-extrabold">Create one</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>Sign In</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: CREATE ACCOUNT VIEW */}
              {viewMode === 'REGISTER' && (
                <form onSubmit={handleRegisterEmail} className="space-y-4">
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setViewMode('OPTIONS')}
                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Options</span>
                    </button>
                    <span className="text-xs font-black uppercase text-sky-600 dark:text-sky-400">
                      Create Account
                    </span>
                  </div>

                  {/* 1-Click Google Sign In Fast Track */}
                  <div className={`p-3 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-900'}`}>
                        Fast Track Registration
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Zero Setup Required
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className={`w-full py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                          : 'bg-white hover:bg-slate-100 text-slate-950 border-slate-300 shadow-xs'
                      }`}
                    >
                      <Globe className="w-4 h-4 text-sky-500" />
                      <span>Create Account with Google (1-Click)</span>
                    </button>
                  </div>

                  <div className="relative py-1 flex items-center justify-center">
                    <div className={`absolute inset-0 flex items-center ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="w-full border-t" />
                    </div>
                    <span className={`relative px-2.5 text-[10px] font-black uppercase ${isDark ? 'bg-[#0a1120] text-slate-400' : 'bg-white text-slate-500'}`}>
                      OR CREATE ACCOUNT WITH EMAIL
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        Technician Name / Title (Optional)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Lead BAS Tech"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        Email Address (Outlook, Yahoo, Gmail, or Company Email)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="technician@outlook.com"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        Password (Min 6 characters)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setViewMode('SIGN_IN')}
                      className={`text-xs font-bold cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      Already registered? <span className="text-emerald-600 underline font-extrabold">Sign in</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>Create Account</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 4: RESET PASSWORD VIEW */}
              {viewMode === 'RESET_PASSWORD' && (
                <div className="space-y-4">
                  <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      onClick={() => setViewMode('SIGN_IN')}
                      className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Sign In</span>
                    </button>
                    <span className="text-xs font-black uppercase text-amber-600 dark:text-amber-400">
                      Reset Password
                    </span>
                  </div>

                  <form onSubmit={handleDirectPasswordReset} className="space-y-3">
                    <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        <KeyRound className="w-4 h-4" />
                        <span>Instant In-App Password Reset</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">
                        Enter your email and a new password below to instantly update your password without waiting for an email.
                      </p>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        Account Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="technician@outlook.com"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-950'}`}>
                        New Password (Min 6 characters)
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            isDark
                              ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                              : 'bg-white border-slate-300 text-slate-950 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleResetPassword}
                        disabled={isSubmitting}
                        className={`text-xs font-bold underline cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        Send Firebase Reset Link
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md flex items-center gap-2 cursor-pointer transition-all"
                      >
                        {isSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Reset & Save Password Now</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t text-xs flex items-center justify-between ${
            isDark ? 'bg-[#0f1b33] border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700 font-medium'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-500" />
            <span>Encrypted cloud synchronization powered by Google Cloud Firestore</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-200 hover:bg-slate-300 text-slate-950'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
