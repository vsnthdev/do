import { $ } from 'bnx'
import path from 'path'
import fs from 'fs/promises'
import prompt from 'prompts'
import { type Command } from 'commander'

async function action() {
    const DIR = path.join(process.env.HOME!, 'Projects')

    let projects = await fs.readdir(DIR, {
        encoding: 'utf-8'
    })

    projects = projects.filter(proj => proj.startsWith('.') == false).sort()

    const { ans } = await prompt({
        type: 'autocomplete',
        name: 'ans',
        message: 'Pick a project to enter',
        choices: projects.map(proj => ({
            title: proj,
            value: proj,
        }))
    })

    console.log(`cd ${path.join(DIR, ans)}`)
}

export default function setup(app: Command) {
    app.command('open').action(action)
}