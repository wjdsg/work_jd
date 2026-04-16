import { RouterProvider, createBrowserRouter, createHashRouter } from 'react-router-dom'
import { routesConfig } from './config'

const shouldUseHashRouter = typeof window !== 'undefined' && window.location.protocol === 'file:'
const router = shouldUseHashRouter ? createHashRouter(routesConfig) : createBrowserRouter(routesConfig)

export function AppRouter() {
  return <RouterProvider router={router} />
}
