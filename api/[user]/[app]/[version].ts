import { VercelRequest, VercelRequestQuery, VercelResponse } from '@vercel/node'
import puppeteer from 'puppeteer-core'

import { getOptions } from '../../_lib'

export interface RequestParams extends VercelRequestQuery {
  user: string
  app: string
  version: string
}

export interface DownloadInfo {
  download_url: string
}

const NOT_FOUND = 404

const RELEASE_SECTIONS_SELECTOR = '[data-test-class="release"]'

const isDev = process.env.NODE_ENV === 'development'

const getDownloadInfo = ({
  page,
  user,
  app,
}: {
  page: puppeteer.Page
  user: string
  app: string
}) =>
  new Promise<DownloadInfo>((resolve, reject) => {
    const handler = (response: puppeteer.HTTPResponse) => {
      if (
        response
          .url()
          .startsWith(
            `https://install.appcenter.ms/api/v0.1/apps/${user}/${app}/distribution_groups/public/releases/`,
          )
      ) {
        page.off('response', handler)
        resolve(response.json() as Promise<DownloadInfo>)
      }
    }
    page.on('response', handler)
    setTimeout(reject, 5 * 1000)
  })

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  const { user, app, version } = req.query as RequestParams

  const [versionPrefix, versionSuffix = versionPrefix] = version.split(',')

  const browser = await puppeteer.launch(await getOptions(isDev))
  const page = await browser.newPage()

  await page.goto(
    `https://install.appcenter.ms/users/${user}/apps/${app}/distribution_groups/public`,
    {
      waitUntil: 'domcontentloaded',
    },
  )

  const options = { page, user, app }

  let downloadInfo: DownloadInfo

  try {
    downloadInfo = await getDownloadInfo(options)
  } catch {
    res.status(NOT_FOUND)
    res.send('Not Found')
    return
  }

  const index = await page.$$eval(
    RELEASE_SECTIONS_SELECTOR,
    (els, [versionPrefix, versionSuffix]: [string, string]) => {
      const index = els.findIndex(
        el =>
          el.firstElementChild!.firstElementChild!.firstElementChild!
            .firstElementChild!.textContent ===
          `Version ${versionPrefix} (${versionSuffix})`,
      )
      if (index !== -1) {
        ;(els[index] as HTMLElement).click()
      }
      return index
    },
    [versionPrefix, versionSuffix],
  )

  if (index === -1) {
    res.status(NOT_FOUND)
    res.send('Not Found')
    return
  }

  const els = await page.$$(RELEASE_SECTIONS_SELECTOR)
  const el = await els[index].$('[data-test-class~="install-button"]')
  await el!.click()

  if (index) {
    downloadInfo = await getDownloadInfo(options)
  }

  await browser.close()

  res.redirect(downloadInfo.download_url)
}
