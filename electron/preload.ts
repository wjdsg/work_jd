// Author: mjw
// Date: 2026-04-17

import { contextBridge, ipcRenderer } from 'electron'

interface EmailReportPayload {
  senderEmail: string
  senderAuthCode: string
  recipientEmail: string
  subject: string
  text: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  sendEmailReport(payload: EmailReportPayload) {
    return ipcRenderer.invoke('email-report:send', payload)
  },
})
