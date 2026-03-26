import { Command } from 'commander'
import { log, loadConfig } from '@opendocs/core'

export function configCommand() {
  return new Command('config')
    .description('View or modify configuration')
    .argument('[key]', 'Config key to view')
    .argument('[value]', 'Config value to set')
    .action(async (key, value) => {
      if (value) {
        // TODO: Implement config writing (modify opendocs.config.ts)
        log.fail('Config writing is not yet implemented. Edit opendocs.config.ts directly.')
        return
      }
      const config = loadConfig(process.cwd())
      if (!key) {
        log.heading('Configuration')
        console.log(JSON.stringify(config, null, 2))
        return
      }
      const keys = key.split('.')
      let current: any = config
      for (const k of keys) { current = current?.[k] }
      if (current === undefined) log.fail(`Config key not found: ${key}`)
      else console.log(JSON.stringify(current, null, 2))
    })
}
