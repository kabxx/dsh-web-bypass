import { createRequire } from 'node:module'
import { dshRequire, importDsh } from './runtime.js'

export const name = 'dsh-web-bypass-startup'
export const inject = ['profileContext', 'cmdlineArgs']

export async function apply(ctx) {
  const requireDsh = dshRequire(ctx)
  const requireWeb = createRequire(requireDsh.resolve('@deepseek-ai/dsh-web-app/package.json'))
  const { Command } = requireWeb('commander')
  const [{ parseCmdline }, { isWildcardHost }, { Config: WebConfig }] = await Promise.all([
    importDsh(requireDsh, '@deepseek-ai/dsh-cmdline'),
    importDsh(requireDsh, '@deepseek-ai/dsh-host-webserver'),
    importDsh(requireDsh, '@deepseek-ai/dsh-web-app'),
  ])

  // Keep the shipped 0.2.2-rc.5 Web options and validation.
  const program = new Command()
    .name('dsh web')
    .description('Serve the DeepSeek Harness browser UI.')
    .helpOption('-h, --help', 'show this help')
    .option('--host <host>', 'bind address (IPv4 or IPv6 literal)')
    .option('--no-open', 'do not open the Web UI in the default browser')
    .option('--port <port>', 'listen port; pass 0 to let the OS pick a free one')
    .option('--public-url <url>', 'advertise this HTTP(S) root; grants no Host trust')
    .option('--trusted-host <authority...>', 'accept an extra Host authority (host or host:port; repeatable)')
    .option('--tls-cert <file>', 'PEM server certificate chain; requires --tls-key')
    .option('--tls-key <file>', 'unencrypted PEM private key; requires --tls-cert')
    .option('--allow-wildcard-host', 'permit --host 0.0.0.0 or --host :: (keeps the configured bind address if --host is omitted)')
    .option('--no-auth', 'allow anonymous access to the Web UI, API and WebSocket')
    .addHelpText('after', '\nFor wildcard binds, set --trusted-host to the address in the browser URL.\nUse --public-url to print that address at startup.\nWith --no-auth, clients that reach the port can act as the DSH owner.\nHost and Origin checks still apply.\n')

  program.action(() => {
    const options = program.opts()
    if (options.host !== undefined && isWildcardHost(options.host) && !options.allowWildcardHost) {
      program.error(`error: --host ${options.host} is a wildcard address; pass --allow-wildcard-host to permit it`)
    }
    if (options.port !== undefined && !/^\d+$/.test(options.port)) {
      program.error(`error: --port must be a number, got ${JSON.stringify(options.port)}`)
    }
    if ((options.tlsCert === undefined) !== (options.tlsKey === undefined)) {
      program.error('error: --tls-cert and --tls-key must be supplied together')
    }
    if (options.publicUrl !== undefined) {
      try {
        WebConfig({ publicUrl: options.publicUrl })
      } catch (error) {
        program.error(`error: --public-url: ${error.message}`)
      }
    }

    ctx.provide('webStartup', {
      openBrowser: options.open,
      host: options.host,
      port: options.port === undefined ? undefined : Number(options.port),
      publicUrl: options.publicUrl,
      trustedHosts: options.trustedHost ?? [],
      tls: options.tlsCert === undefined ? undefined : { certFile: options.tlsCert, keyFile: options.tlsKey },
      allowWildcardHost: options.allowWildcardHost === true,
      noAuth: options.auth === false,
    })
  })
  parseCmdline(ctx, program)
}
