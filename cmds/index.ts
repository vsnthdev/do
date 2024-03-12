/*
 *  Links all different commands together.
 *  Created On 13 September 2023
 */

import sw from './switch'
import clean from './clean'
import update from './update'
import { type Command } from 'commander'

export function cmds(app: Command) {
    sw(app)
    clean(app)
    update(app)
}