import { ReactQueryProvider } from './providers'
import { TanStackRouterProvider } from './providers/TanstackRouterProvider'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <ReactQueryProvider>
      <TanStackRouterProvider />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
        }}
      />
    </ReactQueryProvider>
  )
}

export default App
