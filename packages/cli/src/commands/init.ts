import { Command } from 'commander'
import { log } from '@opendocs/core'

export function initCommand() {
  return new Command('init')
    .description('Initialize OpenDocs project')
    .action(async () => {
      log.heading('OpenDocs Setup')
      log.info('Interactive setup wizard will be available soon.')
      log.info('For now, OpenDocs runs with default settings.')
      log.arrow('Run: opendocs start')
    })
}
