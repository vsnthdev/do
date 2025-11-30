import { type Command } from "commander";
import { $ } from 'bnx'
import prompt from 'prompts'
import open from 'open'
import path from 'path'

function getRepositoryUrlFromGit(gitUrl: string) {
    const parsed = path.parse(gitUrl)
    return `${parsed.dir}/${parsed.name}`
}

async function action() {
    const branch = (await $`git rev-parse --abbrev-ref HEAD`)

    const raw = (await $`git remote -v`)
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

        await open(`${getRepositoryUrlFromGit(ans)}/tree/${branch.trim()}`)
    } else {
        const gitUrl = unique[0].split(' ').pop()?.trim()!
        await open(`${getRepositoryUrlFromGit(gitUrl)}/tree/${branch.trim()}`)
    }
}

export default function setup(app: Command) {
    app.command('open')
        .action(action)
        .description('Opens the remote repository URL in browser')
}