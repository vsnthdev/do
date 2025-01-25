/*
 *  Clones a GitHub repository into the right path.
 *  Created On 09 November 2024
 */

import { type Command } from 'commander'
import { config } from '../config'
import autocomplete from 'inquirer-autocomplete-standalone'
import ora from 'ora'
import { homedir } from 'node:os'
import path from 'node:path'
import { mkdirp } from 'mkdirp'
import { execaCommand } from 'execa'
import globalCacheDir from 'global-cache-dir'
import fs from 'fs/promises'

async function showCachedRepositories(file: string) {
    const answer = await autocomplete({
        message: 'Pick a repository from GitHub:',
        source: async (input) => {
            const raw = await fs.readFile(file, 'utf-8')
            const data: string[] = JSON.parse(raw)

            if (!input) return data.map(repo => ({
                value: repo,
            }))

            return data.filter(repo => repo.toLowerCase().includes(input)).map(repo => ({
                value: repo,
            }))
        }
    })

    const spinner = ora('Hang tight, making unicorns fly').start()
    const orgDir = path.join(homedir(), 'Projects', answer.split('/').shift()!)
    const repoDir = path.join(homedir(), 'Projects', answer)

    // handle when it's cloned already
    if (await fs.exists(repoDir)) {
        spinner.stopAndPersist({
            text: `Repository already exists at: ${repoDir}`,
            symbol: '⚠️'
        })
        process.exit(1)
    }

    await mkdirp(orgDir)

    await execaCommand(`gh repo clone ${answer} ${path.join(homedir(), 'Projects', answer)}`)
    spinner.stopAndPersist({
        symbol: '✅',
        text: `Cloned at: ${path.join(homedir(), 'Projects', answer)}`
    })
}

async function fresh(subprocess: any, file: string) {
    const spinner = ora('Loading unicorns').start()

    // as we don't have the existing cache available
    // we freshly download by blocking the user
    await subprocess.exited
    spinner.stop()

    await showCachedRepositories(file)
}

async function action(args: any) {
    if (!config.get('github.token')) {
        console.log(`No GitHub token has been configured.`)
        console.log(`Run: do config set github.token <your_token>`)
        return
    }

    const file = path.join(await globalCacheDir('do-cli'), 'github-repositories.json')

    // download updated repositories in background
    const scriptPath = path.join(import.meta.dirname, '..', 'scripts', 'download-repos.ts')
    const subprocess = Bun.spawn(['bun', 'run', scriptPath], {
        stderr: 'ignore',
        stdout: 'ignore',
        stdin: 'ignore',
    })

    if (args.fresh) {
        await fresh(subprocess, file)
    } else {
        if (await fs.exists(file)) {
            await showCachedRepositories(file)
        } else {
            await fresh(subprocess, file)
        }
    }

    return process.exit(0)
}

export default function setup(app: Command) {
    app.command('clone')
        .action(action)
        .description('Clones a GitHub repository into the right path')
        .option('--fresh', 'Freshly fetch repositories from GitHub')
}
