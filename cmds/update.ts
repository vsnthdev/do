/*
 *  Updates the GitHub repo to latest codebase.
 *  Created On 12 March 2024
 */

import { $ } from 'bnx'
import { Listr } from 'listr2'
import { execaCommand } from 'execa'
import { type Command } from 'commander'

interface Ctx {
    remotes: string[]
}

async function action() {
    const remotes = (await $`git remote`).trim().split('\n')
    const branch = (await $`git branch --show-current`).trim()

    const tasks = new Listr<Ctx>(
        [], {
        ctx: {
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

    tasks.add(
        remotes.map(remote => ({
            title: `Pulling new changes from ${remote}`,
            task: () => execaCommand(`git pull ${remote} ${branch} --rebase`)
        }))
    )

    tasks.add([
        {
            title: 'Pushing changes',
            task: () => execaCommand('git push')
        }
    ])

    try {
        await tasks.run()
    } catch (e) {
        console.error(e)
    }
}

export default function setup(app: Command) {
    app.command('update')
        .action(action)
        .description('Update a Git repo to latest remote code')
}
