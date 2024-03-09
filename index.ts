#!/usr/bin/env bun
/*
 *  Configures the commander module.
 *  Created On 13 September 2023
 */

import rupa from 'rupa'
import { Command } from 'commander'
import { cmds } from './cmds/index'

const app = new Command('do')

app.version('0.0.0')
app.description('does various things for Vasanth')
cmds(app)

rupa(app)

await app.parseAsync(process.argv)
