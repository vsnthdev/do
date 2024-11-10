/*
 *  Links all different commands together.
 *  Created On 13 September 2023
 */

import sw from './switch'
import clean from './clean'
import update from './update'
import open from './open'
import config from './config/index'
import { type Command } from 'commander'
import clone from './clone'

export function cmds(app: Command) {
    sw(app)
    clean(app)
    update(app)
    open(app)
    config(app)
    clone(app)
}