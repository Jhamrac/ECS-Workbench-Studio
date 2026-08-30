export interface VirtualEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  bodyHtml: string;
  category: 'verification' | 'password_reset' | 'system' | 'welcome';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const STORAGE_KEY = 'niagara_virtual_mailbox_v1';

const listeners: Set<(emails: VirtualEmail[]) => void> = new Set();

export function getVirtualEmails(): VirtualEmail[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed initial welcome email if empty
      const defaultWelcome: VirtualEmail = {
        id: 'email_welcome_initial',
        to: 'user@niagara.cloud',
        from: 'no-reply@niagara-cloud-studio.com',
        subject: '⚡ Welcome to Niagara Cloud Studio In-App Inbox',
        category: 'welcome',
        timestamp: new Date().toISOString(),
        isRead: false,
        bodyHtml: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
            <div style="background: linear-gradient(135deg, #0284c7, #0f172a); padding: 20px; border-radius: 12px 12px 0 0; color: white;">
              <h2 style="margin:0; font-size: 20px;">⚡ Welcome to Niagara Cloud Studio</h2>
              <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Out-of-the-Box In-App Virtual Email Center Active</p>
            </div>
            <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="font-size: 14px; line-height: 1.6;">Hello Controls Engineer,</p>
              <p style="font-size: 14px; line-height: 1.6;">
                Your in-app email inbox is active and running automatically out of the box! All system notifications, account verification links, password resets, and cloud station backup notices will arrive right here without requiring external SMTP or third-party email configuration.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 8px; margin: 16px 0;">
                <strong style="color: #166534; font-size: 13px;">✅ Status: Instant In-App Dispatch Enabled</strong>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #15803d;">All emails are processed locally and securely in real-time.</p>
              </div>
            </div>
          </div>
        `,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultWelcome]));
      return [defaultWelcome];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveVirtualEmail(email: Omit<VirtualEmail, 'id' | 'timestamp' | 'isRead'>): VirtualEmail {
  const emails = getVirtualEmails();
  const newEmail: VirtualEmail = {
    ...email,
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  emails.unshift(newEmail);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (e) {
    console.warn('Could not persist virtual email:', e);
  }
  notifyListeners(emails);
  return newEmail;
}

export function markVirtualEmailRead(id: string) {
  const emails = getVirtualEmails().map((m) => (m.id === id ? { ...m, isRead: true } : m));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (e) {}
  notifyListeners(emails);
}

export function markAllVirtualEmailsRead() {
  const emails = getVirtualEmails().map((m) => ({ ...m, isRead: true }));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (e) {}
  notifyListeners(emails);
}

export function deleteVirtualEmail(id: string) {
  const emails = getVirtualEmails().filter((m) => m.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (e) {}
  notifyListeners(emails);
}

export function subscribeVirtualMailbox(callback: (emails: VirtualEmail[]) => void) {
  listeners.add(callback);
  callback(getVirtualEmails());
  return () => {
    listeners.delete(callback);
  };
}

function notifyListeners(emails: VirtualEmail[]) {
  listeners.forEach((cb) => {
    try {
      cb(emails);
    } catch (e) {}
  });
}
