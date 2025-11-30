/*
 *  Standalone bun script to download GitHub repos & place in cache.
 *  Created On 09 November 2024
 */

import { Octokit } from 'octokit'
import globalCacheDir from 'global-cache-dir'
import path from 'node:path'
import keytar from 'keytar'

export async function downloadRepositories(logOutputs = false) {
    const log = logOutputs ? console.log : (log: string) => true

    const token = await keytar.getPassword('do-cli-vsnthdev', 'github-token')
    const octokit = new Octokit({ auth: token })

    const repos = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
        per_page: 100,
        sort: 'updated',
    })

    let repositories: string[] = []
    for (const repo of repos) {
        repositories.push(repo.full_name)
    }

    repositories = [
        ...repositories.filter(repo => repo.startsWith('vsnthdev')),
        ...repositories.filter(repo => repo.startsWith('vsnthdev') == false)
            .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    ]

    const cacheDir = await globalCacheDir('do-cli')
    log(`Written to: ${path.join(cacheDir, 'github-repositories.json')}`)
    await Bun.write(path.join(cacheDir, 'github-repositories.json'), JSON.stringify(repositories))
}

if (import.meta.main) {
    downloadRepositories(true)
}
