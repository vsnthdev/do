import { $ } from 'bnx'
import { Listr } from 'listr2'
import { execaCommand } from 'execa'
import { type Command } from 'commander'

interface Ctx {
    currentBranch: string
    remotes: string[]
}

async function action() {
    const currentBranch = (await $`git branch --show-current`).trim()
    const remotes = (await $`git remote`).trim().split('\n')

    if (currentBranch == 'main') return console.log('You are already in main!')

    const tasks = new Listr<Ctx>(
        [
            {
                title: 'Switching to main branch',
                task: () => execaCommand('git checkout main')
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
        task: (ctx, task): Listr =>
            task.newListr([
                {
                    title: 'Fetching updates',
                    task: () => execaCommand('git fetch')
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
        .description('Updates main branch to latest, deletes current branch')
}