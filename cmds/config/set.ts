/*
 *  Writes the config values into conf module.
 *  Created On 09 November 2024
 */

import type { Command } from 'commander'
import { config } from '../../config'

async function action(key: string, value: string) {
    if (value) {
        config.set(key, value)
        console.log('Configuration set successfully ✅')
    } else {
        config.delete(key)
        console.log('Configuration deleted successfully ✅')
    }
}

export default function setup(app: Command) {
    app.command('set')
        .action(action)
        .description('Sets a value into config')
        .argument('<key>', 'Which config value to update')
        .argument('[value]', 'The value that needs to be set', '')
}
