import { execSync } from 'node:child_process'

function readGitValue(command: string) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return ''
  }
}

const commitCount = readGitValue('git rev-list --count HEAD')
const commitSha = process.env.CF_PAGES_COMMIT_SHA?.slice(0, 7) || readGitValue('git rev-parse --short HEAD')
const appVersion = commitCount && commitSha ? `b${commitCount}-${commitSha}` : commitSha || 'dev'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      appVersion
    }
  },
  app: {
    head: {
      title: 'VocalWarm',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon.svg'
        }
      ]
    }
  }
})
