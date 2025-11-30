import { $ } from 'bnx'
import { Listr } from 'listr2'
import { execaCommand } from 'execa'
import { type Command } from 'commander'

interface Ctx {
    currentBranch: string
    remotes: string[]
}

async function action(branch: string) {
    const currentBranch = (await $`git branch --show-current`).trim()
    const remotes = (await $`git remote`).trim().split('\n')

    if (currentBranch == branch) return console.log(`You are already in ${branch}!`)

    const tasks = new Listr<Ctx>(
        [
            {
                title: `Switching to ${branch} branch`,
                task: () => execaCommand(`git checkout ${branch}`)
            },
        ], {
        ctx: {
            currentBranch,
            remotes,
        }
    }
    )

    tasks.add({
        title: 'Fetching updates',
        task: (_, task): Listr =>
            task.newListr([
                {
                    title: 'Fetching updates',
                    task: () => execaCommand('git fetch --prune')
                },
            ].concat(remotes.map(remote => ({
                title: `Fetching ${remote} remote`,
                task: () => execaCommand(`git fetch ${remote}`)
            }))))
    })

    tasks.add([
        {
            title: `Pulling new changes`,
            task: () => execaCommand(`git pull`)
        },
        {
            title: `Deleting ${currentBranch} branch`,
            task: () => execaCommand(`git branch -D ${currentBranch}`)
        }
    ])

    try {
        await tasks.run()
    } catch (e) {
        console.error(e)
    }
}

export default function setup(app: Command) {
    app.command('clean')
        .action(action)
        .description('Updates default branch to latest, deletes current branch')
        .argument('[branch]', 'custom branch name to reset to', 'main')
}