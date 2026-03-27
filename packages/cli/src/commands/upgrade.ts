import { Command } from 'commander'
import { log } from '@opendocs/core'

export function upgradeCommand() {
  return new Command('upgrade').description('Upgrade OpenDocs to latest version').action(async () => {
    const { execSync } = await import('node:child_process')
    log.heading('Upgrading OpenDocs')
    try {
      execSync('npm install -g @opendocs/cli@latest', { stdio: 'inherit' })
      log.ok('Upgrade complete')
    } catch (err) {
      log.fail('Upgrade failed. Try: npm install -g @opendocs/cli@latest')
    }
  })
}
