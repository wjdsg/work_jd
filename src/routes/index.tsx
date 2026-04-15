import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routesConfig } from './config'

const router = createBrowserRouter(routesConfig)

export function AppRouter() {
  return <RouterProvider router={router} />
}
