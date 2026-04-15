// Author: mjw
// Date: 2026-04-15

import { ReminderPanel } from './ReminderPanel'
import { ReminderToastHost } from './ReminderToastHost'
import './styles/reminders.css'

export default function RemindersView() {
  return (
    <>
      <ReminderPanel />
      <ReminderToastHost />
    </>
  )
}
