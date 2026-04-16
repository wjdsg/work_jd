// Author: mjw
// Date: 2026-04-17

export interface EmailReportPayload {
  senderEmail: string
  senderAuthCode: string
  recipientEmail: string
  subject: string
  text: string
}

export interface ElectronApi {
  sendEmailReport: (payload: EmailReportPayload) => Promise<{ ok: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronApi
  }
}
