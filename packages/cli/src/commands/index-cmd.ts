import { Command } from 'commander'
import { log, discoverFiles } from '@opendocs/core'
import { getContext, shutdownContext } from '../utils/bootstrap.js'
import { readFileSync } from 'node:fs'
import { extname, basename, resolve } from 'node:path'

export function indexCommand() {
  return new Command('index')
    .description('Index a file or directory')
    .argument('<path>', 'File or directory path')
    .option('--reindex', 'Force reindex even if unchanged')
    .action(async (inputPath, opts) => {
      const ctx = await getContext()
      const absPath = resolve(inputPath)
      try {
        log.heading('Indexing')
        const files = discoverFiles(absPath)
        if (files.length === 0) { log.fail('No supported files found'); return }
        log.info(`Found ${files.length} file(s)`)
        for (const file of files) {
          if (opts.reindex) {
            // Delete existing document to force reindex (bypass content hash check)
            const docs = ctx.store.listDocuments()
            const existing = docs.find(d => d.source_path === file)
            if (existing) {
              await ctx.store.deleteDocument(existing.id)
            }
          }
          const content = readFileSync(file, 'utf-8')
          const result = await ctx.pipeline.ingest({
            title: basename(file), content, sourceType: 'local',
            sourcePath: file, fileType: extname(file),
          })
          if (result.status === 'indexed') log.ok(`${basename(file)} (${result.chunks} chunks)`)
          else if (result.status === 'skipped') log.info(`${basename(file)} (unchanged)`)
          else log.fail(`${basename(file)} (error)`)
        }
      } finally {
        await shutdownContext()
      }
    })
}
