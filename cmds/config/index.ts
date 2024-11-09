/*
 *  Writes or reads the config values into conf module.
 *  Created On 09 November 2024
 */

import type { Command } from 'commander'
import set from './set'
import get from './get'

async function action(args: any) {
    console.log(args)
}

export default function setup(app: Command) {
    const cmd = app.command('config')
        .action(action)
        .description('Read or write configuration values for this CLI')

    set(cmd)
    get(cmd)
}
