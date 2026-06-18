import { type Command } from "commander";
import { $ } from 'bnx'
import prompt from 'prompts'
import open from 'open'

function convertToHttpUrl(gitUrl: string): string {
    let url = gitUrl.trim()

    if (url.startsWith('https://') || url.startsWith('http://')) {
        return url.replace('.git', '')
    }

    if (url.startsWith('ssh://')) {
        url = url.replace('ssh://', '')
    }

    if (url.startsWith('git@')) {
        url = url.replace('git@', '')
    }

    if (url.includes('@')) {
        url = url.split('@').pop() || url
    }

    if (url.includes(':')) {
        url = url.replace(':', '/')
    }

    url = url.replace('.git', '')

    return `https://${url}`
}

function getBranchUrl(baseUrl: string, branch: string): string {
    if (baseUrl.includes('codeberg.org')) {
        return `${baseUrl}/src/branch/${branch}`
    }
    return `${baseUrl}/tree/${branch}`
}

async function openUrl(url: string, cmuxCli?: string, hasCli?: boolean) {
    if (cmuxCli && hasCli) {
        Bun.spawn([cmuxCli, 'browser', 'open', url])
    } else {
        await open(url)
    }
}

async function action() {
    const cmuxCli = Bun.env.CMUX_BUNDLED_CLI_PATH

    const [branchResult, rawResult, hasCli] = await Promise.all([
        $`git rev-parse --abbrev-ref HEAD`,
        $`git remote -v`,
        cmuxCli ? Bun.file(cmuxCli).exists() : Promise.resolve(false)
    ])

    const branch = branchResult.trim()

    const raw = rawResult
        .trim()
        .split('\n')
        .map(line => line.split('\t').map((chunk, idx) => idx == 1 ? chunk.split(' ').shift()?.trim() : chunk.trim()))
        .map(line => line.join(' '))

    const unique = Array.from(new Set(raw))

    if (unique.length > 1) {
        const { ans } = await prompt({
            type: 'select',
            name: 'ans',
            message: 'Pick a remote URL to open',
            choices: unique.map(link => ({
                title: link,
                value: link.split(' ').pop()?.trim(),
            }))
        })

        const urlToOpen = getBranchUrl(convertToHttpUrl(ans), branch)
        await openUrl(urlToOpen, cmuxCli, hasCli)
    } else {
        const gitUrl = unique[0].split(' ').pop()?.trim()!
        const urlToOpen = getBranchUrl(convertToHttpUrl(gitUrl), branch)
        await openUrl(urlToOpen, cmuxCli, hasCli)
    }
}

export default function setup(app: Command) {
    app.command('open')
        .action(action)
        .description('Opens the remote repository URL in browser')
}