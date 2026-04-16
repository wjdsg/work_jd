// Author: mjw
// Date: 2026-04-17

import { useEffect } from 'react'
import { useTaskStore } from '../store/taskStore'
import { useSettingsStore } from '../store/settingsStore'
import { buildEmailSummary, shouldSendEmailReport } from '../services/emailReportService'

const LAST_SENT_KEY = 'email-report-last-sent-at'

export function useEmailReportScheduler() {
  const tasks = useTaskStore((state) => state.tasks)
  const settings = useSettingsStore((state) => state.settings)

  useEffect(() => {
    let running = false

    const tick = async () => {
      if (running) return
      running = true

      try {
        const now = new Date()
        const lastSentAt = localStorage.getItem(LAST_SENT_KEY) ?? undefined
        const emailSettings = settings.emailReport

        if (!shouldSendEmailReport(emailSettings, now, lastSentAt)) {
          return
        }

        const summary = buildEmailSummary(tasks, now)

        if (!window.electronAPI) {
          return
        }

        const result = await window.electronAPI.sendEmailReport({
          senderEmail: emailSettings.senderEmail,
          senderAuthCode: emailSettings.senderAuthCode,
          recipientEmail: emailSettings.recipientEmail,
          subject: summary.subject,
          text: summary.text,
        })

        if (result.ok) {
          localStorage.setItem(LAST_SENT_KEY, now.toISOString())
        }
      } finally {
        running = false
      }
    }

    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [tasks, settings])
}
