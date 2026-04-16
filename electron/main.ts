// Author: mjw
// Date: 2026-04-16

import { app, BrowserWindow } from 'electron'
import { ipcMain } from 'electron'
import path from 'path'
import nodemailer from 'nodemailer'

interface EmailReportPayload {
  senderEmail: string
  senderAuthCode: string
  recipientEmail: string
  subject: string
  text: string
}

async function sendEmailReport(payload: EmailReportPayload) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: payload.senderEmail,
      pass: payload.senderAuthCode,
    },
  })

  await transporter.sendMail({
    from: payload.senderEmail,
    to: payload.recipientEmail,
    subject: payload.subject,
    text: payload.text,
  })
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

ipcMain.handle('email-report:send', async (_event, payload: EmailReportPayload) => {
  try {
    await sendEmailReport(payload)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error'
    return { ok: false, error: message }
  }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
