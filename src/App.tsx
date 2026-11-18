import { useState } from 'react'
import logo from '@/assets/whatscommerce-logo.png'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { checkHealth } from '@/lib/api'

type Connection = 'idle' | 'checking' | 'ready' | 'error'

const messages: Record<Connection, string> = {
  idle: 'Conexión con el servidor pendiente de comprobar.',
  checking: 'Comprobando conexión…',
  ready: 'El servidor responde correctamente. Esta comprobación no valida la base de datos.',
  error: 'No se pudo verificar el servidor. Comprueba su dirección y que esté iniciado.',
}

function App() {
  const [connection, setConnection] = useState<Connection>('idle')

  async function handleCheck() {
    setConnection('checking')
    try {
      await checkHealth()
      setConnection('ready')
    } catch {
      setConnection('error')
    }
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-8 px-5 py-10 sm:px-8">
      <header className="space-y-4">
        <img className="h-auto w-full" src={logo} alt="WhatsCommerce EC: ventas y atención por WhatsApp para tu negocio" />
        <p className="text-sm font-semibold text-primary-dark">ADMINWEB · BASE TÉCNICA</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Todo empieza con una base segura.</h1>
        <p className="max-w-xl leading-relaxed">
          Proyecto inicial del panel administrativo. Las funciones de empresas,
          usuarios y ventas se incorporarán en las siguientes entregas.
        </p>
      </header>
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Estado del servidor</h2>
          <CardDescription>
            Verificación técnica de la API compartida con la aplicación móvil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p role="status" aria-live="polite" aria-atomic="true">{messages[connection]}</p>
          <Button type="button" size="lg" onClick={handleCheck} disabled={connection === 'checking'}>
            {connection === 'checking' ? 'Comprobando…' : 'Comprobar conexión'}
          </Button>
        </CardContent>
      </Card>
      <aside className="rounded-lg border-l-4 border-accent px-4 py-2 text-sm leading-relaxed">
        Esta pantalla no administra datos reales ni representa un módulo funcional terminado.
      </aside>
    </main>
  )
}

export default App
