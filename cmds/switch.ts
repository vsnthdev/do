import { $ } from 'bnx'
import prompt from 'prompts'
import { type Command } from 'commander'

async function action() {
    const raw = (await $`git for-each-ref --format='%(refname:short)' refs/heads`).trim()
    const branches = raw.split('\n').map(str => str.replaceAll('\'', ''))

    const { ans } = await prompt({
        type: 'select',
        name: 'ans',
        message: 'Pick a branch to checkout',
        choices: branches.map(branch => ({
            title: branch,
            value: branch,
        }))
    })

    await $(`git checkout ${ans}`)
}

export default function setup(app: Command) {
    app.command('switch')
        .action(action)
        .description('Interactively switch between Git branches')
}