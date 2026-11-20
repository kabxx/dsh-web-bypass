import { dshRequire, importDsh } from './runtime.js'

export const name = 'dsh-web-bypass-server'
export const inject = ['profileContext', 'webStartup', 'connection']

const browserAuthMethods = ['isAuthenticated', 'authenticateApi', 'authorizeConnect', 'authorizeIndex', 'authenticatedUrl']

function useAnonymousBrowserAuth(ctx) {
  ctx.effect(() => {
    const connection = ctx.connection
    const original = Object.getOwnPropertyDescriptor(connection, 'browserAuth')
    if (!original?.configurable || !browserAuthMethods.every(key => typeof original.value?.[key] === 'function')) {
      throw new Error('dsh-web-bypass: unsupported DSH Web authentication implementation')
    }
    const anonymous = {
      // Native request admission still checks Host/Origin before consulting this adapter.
      isAuthenticated: () => true,
      authenticateApi: () => undefined,
      authorizeConnect(_request, response) {
        response.writeHead(204, { 'Cache-Control': 'no-store' })
        response.end()
      },
      authorizeIndex(request, response) {
        const { rejection } = connection.admit(request)
        if (rejection === undefined) return true
        response.writeHead(rejection, { 'Cache-Control': 'no-store' })
        response.end(rejection === 403 ? 'forbidden' : 'unauthorized')
        return false
      },
      authenticatedUrl: baseUrl => baseUrl,
    }
    Object.defineProperty(connection, 'browserAuth', { ...original, value: anonymous })
    return () => {
      if (Object.getOwnPropertyDescriptor(connection, 'browserAuth')?.value === anonymous) {
        Object.defineProperty(connection, 'browserAuth', original)
      }
    }
  }, 'dsh-web-bypass: anonymous browser admission')
}

function getInheritedSettings(ctx, interpolate) {
  // The native row is disabled, but its composed config still includes profile patches.
  const source = ctx.fiber.entry.parent.data.find(entry => entry.id === 'webserver')
  if (source?.name !== '@deepseek-ai/dsh-host-webserver') {
    throw new Error('dsh-web-bypass: cannot find the native webserver configuration')
  }
  const settings = interpolate(ctx, source.config)
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw new Error('dsh-web-bypass: invalid native webserver configuration')
  }
  return settings
}

export async function apply(ctx, config) {
  const requireDsh = dshRequire(ctx)
  const [ { WebServer, isWildcardHost, normalizeBindAddress }, { interpolate } ] = await Promise.all([
    importDsh(requireDsh, '@deepseek-ai/dsh-host-webserver'),
    importDsh(requireDsh, '@deepseek-ai/cordis-plugin-loader'),
  ])
  const startup = ctx.webStartup
  const settings = { ...getInheritedSettings(ctx, interpolate), ...config }

  let Server = WebServer
  if (startup.allowWildcardHost && isWildcardHost(settings.host)) {
    const loopback = normalizeBindAddress(settings.host) === '0.0.0.0' ? '127.0.0.1' : '[::1]'
    // Reuse the native schema for all settings other than the explicitly permitted bind.
    const host = settings.host
    Object.assign(settings, WebServer.Config({ ...settings, host: '127.0.0.1' }), { host })
    Server = class WildcardWebServer extends WebServer {
      static Config = undefined

      getOrigin() {
        if (this.port === undefined) throw new Error('webserver: origin read before the listener bound a port')
        return `${this.protocol}//${loopback}:${this.port}`
      }
    }
  }
  if (startup.noAuth) {
    useAnonymousBrowserAuth(ctx)
    console.warn('dsh web: --no-auth is active; clients that reach the port can access DSH with owner privileges.')
  }
  await ctx.plugin(Server, settings)
}
