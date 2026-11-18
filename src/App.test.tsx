import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { checkHealth } from './lib/api'

vi.mock('./lib/api', () => ({ checkHealth: vi.fn() }))

describe('pantalla inicial (API simulada)', () => {
  it('muestra marca y no comprueba automáticamente la conexión', () => {
    vi.mocked(checkHealth).mockClear()
    render(<App />)
    expect(screen.getByRole('img', { name: /WhatsCommerce EC/ })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('pendiente de comprobar')
    expect(checkHealth).not.toHaveBeenCalled()
  })

  it('muestra éxito solo tras verificar el contrato', async () => {
    vi.mocked(checkHealth).mockResolvedValue({ status: 'ok', service: 'whatscommerceec-backend' })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Comprobar conexión' }))
    expect(await screen.findByText(/El servidor responde correctamente/)).toBeInTheDocument()
  })

  it('muestra error sin exponer detalles internos', async () => {
    vi.mocked(checkHealth).mockRejectedValue(new Error('internal detail'))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Comprobar conexión' }))
    expect(await screen.findByText(/No se pudo verificar el servidor/)).toBeInTheDocument()
    expect(screen.queryByText('internal detail')).not.toBeInTheDocument()
  })

  it('bloquea nuevas pulsaciones mientras espera', async () => {
    let resolveHealth!: (value: { status: 'ok'; service: 'whatscommerceec-backend' }) => void
    vi.mocked(checkHealth).mockImplementation(() => new Promise((resolve) => { resolveHealth = resolve }))
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Comprobar conexión' }))
    expect(screen.getByRole('button', { name: 'Comprobando…' })).toBeDisabled()
    resolveHealth({ status: 'ok', service: 'whatscommerceec-backend' })
    expect(await screen.findByText(/El servidor responde correctamente/)).toBeInTheDocument()
  })
})
