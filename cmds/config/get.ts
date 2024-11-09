/*
 *  Reads the entire config store and outputs a table.
 *  Created On 09 November 2024
 */

import type { Command } from 'commander'
import { config } from '../../config'

async function action() {
    for (const key in config.store) {
        console.log(`${key}: ${config.get(key)}`)
    }
}

export default function setup(app: Command) {
    app.command('get')
        .action(action)
        .description('Shows all config values as a table')
}
