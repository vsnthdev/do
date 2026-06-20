import { $ } from 'bnx'
import { Listr } from 'listr2'
import { execaCommand } from 'execa'
import { type Command } from 'commander'
import keytar from 'keytar'
import { Octokit } from 'octokit'
import path from 'path'

interface Ctx {
    currentBranch: string
    remotes: string[]
}

async function action(branch: string) {
    const currentBranch = (await $`git branch --show-current`).trim()
    const remotes = (await $`git remote`).trim().split('\n')
    const parsed = path.parse((await $`git remote get-url origin`))
    const owner = parsed.dir.split('/').pop()!

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
        ...remotes.map(remote => ({
            title: `Pulling new changes from ${remote}`,
            task: () => execaCommand(`git pull ${remote} ${branch} --rebase`)
        })),
        {
            title: `Deleting ${currentBranch} branch`,
            task: (_, task): Listr => task.newListr([
                {
                    title: `Deleting ${currentBranch} locally`,
                    task: () => execaCommand(`git branch -D ${currentBranch}`)
                },
                {
                    title: `Deleting ${currentBranch} on GitHub`,
                    task: async () => {
                        const token = await keytar.getPassword('do-cli-vsnthdev', 'github-token')
                        const octokit = new Octokit({ auth: token })

                        try {
                            await octokit.rest.git.getRef({
                                owner,
                                repo: parsed.name,
                                ref: `heads/${currentBranch}`
                            })
                        } catch (e: any) {
                            if (e.status === 404) return
                            throw e
                        }

                        const deletionResponse = await octokit.rest.git.deleteRef({
                            owner,
                            repo: parsed.name,
                            ref: `heads/${currentBranch}`
                        })

                        if (deletionResponse.status != 204) {
                            throw new Error(`Failed deleting remote repository at GitHub`)
                        }
                    }
                }
            ])
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