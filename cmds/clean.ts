import { $ } from 'bnx'
import { type Command } from 'commander'

async function action() {
    const branch = (await $`git branch --show-current`).trim()

    if (branch == 'main') return console.log('You are already in main!')

    try {
        await $`git checkout main`
    } catch { }
    try {
        await $`git fetch`
    } catch { }
    try {
        await $`git fetch upstream`
    } catch { }
    try {
        await $`git pull`
    } catch { }

    try {
        await $(`git branch -D "${branch}"`)
    } catch { }
}

export default function setup(app: Command) {
    app.command('clean').action(action)
}