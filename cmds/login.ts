/*
 *  Logs the user into GitHub so we can access their profile.
 *  Created On 30 November 2025
 */

import type { Command } from 'commander'
import { createOAuthDeviceAuth } from '@octokit/auth-oauth-device'
import clipboardy from 'clipboardy'
import open from 'open'
import ora from 'ora'
import chalk from 'chalk'
import keytar from 'keytar'
import globalCacheDir from 'global-cache-dir'
import { rimraf } from 'rimraf'
import { downloadRepositories } from '../scripts/download-repos'

async function action() {
    const spinner = ora({
        text: `Preparing please wait`,
    }).start()

    const previousValue = await keytar.getPassword('do-cli-vsnthdev', 'github-token')

    if (previousValue) {
        const oldPasswordDeleted = await keytar.deletePassword(`do-cli-vsnthdev`, 'github-token')

        if (!oldPasswordDeleted) {
            spinner.stop()
            throw new Error(`Failed to delete previously stored token`)
        }
    }

    const cacheDir = await globalCacheDir('do-cli')
    await rimraf(cacheDir)

    spinner.text = 'Accessing GitHub servers, hang tight'

    const auth = createOAuthDeviceAuth({
        clientType: 'oauth-app',
        clientId: 'Ov23lig8anXf01He0sY7',
        scopes: ['repo', 'read:org'],
        async onVerification({ verification_uri, user_code }) {
            await clipboardy.write(user_code)
            await open(verification_uri)

            spinner.stopAndPersist({
                text: `Login code has been copied to your clipboard`,
                symbol: '📋'
            })

            console.log(`\nIn case the browser did not automatically open, visit ${chalk.whiteBright.underline(verification_uri)}`)
            console.log(`and paste the following code into the input field ${chalk.greenBright.bold(user_code)} to login.\n`)

            spinner.start('Waiting for GitHub to confirm authentication')
        }
    })

    const token = await auth({ type: 'oauth' })
    await keytar.setPassword(`do-cli-vsnthdev`, 'github-token', token.token)

    spinner.text = 'Fetching your GitHub repositories'
    await downloadRepositories(false)

    spinner.stop()
    console.log(`✅ Successfully logged into GitHub, you can now start using this CLI`)
    console.log(`To clone repositories, start by running: ${chalk.whiteBright.bold('do clone')}`)
}

export async function login(app: Command) {
    app.command('login')
        .action(action)
        .description('Login into GitHub to start using this CLI tool')
}
