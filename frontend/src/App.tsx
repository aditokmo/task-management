import { ReactQueryProvider } from './providers'
import { TanStackRouterProvider } from './providers/TanstackRouterProvider'
function App() {
  return (
    <ReactQueryProvider>
      <TanStackRouterProvider />
    </ReactQueryProvider>
  )
}

export default App
