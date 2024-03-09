/*
 *  Links all different commands together.
 *  Created On 13 September 2023
 */

import clean from './clean'
import sw from './switch'
import open from './open'
import { type Command } from 'commander'

export function cmds(app: Command) {
    sw(app)
    open(app)
    clean(app)
}