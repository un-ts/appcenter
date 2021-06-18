import { VercelRequest, VercelRequestQuery, VercelResponse } from '@vercel/node'
import got from 'got'

export interface RequestParams extends VercelRequestQuery {
  owner: string
  app: string
  version: string
}

export interface ReleaseInfo {
  id: string
  version: string
  short_version: string
}

export interface DownloadInfo {
  download_url: string
}

const NOT_FOUND = 404

export default async (
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> => {
  let { owner, app, version } = req.query as RequestParams

  if (version.includes(',')) {
    version = version.split(',')[0]
    console.warn(
      `Version with comma is unnecessary anymore, using ${version} instead`,
    )
  }

  const releasesUrl = `https://install.appcenter.ms/api/v0.1/apps/${owner}/${app}/distribution_groups/public/public_releases`

  console.log(`Fetching ${releasesUrl}`)

  const releases = await got(releasesUrl).json<ReleaseInfo[]>()

  const matched = releases.find(
    it => it.version === version || it.short_version === version,
  )

  if (!matched) {
    res.status(NOT_FOUND)
    res.send(`No matched version ${version} found for ${owner}/${app}`)
    return
  }

  const releaseUrl = `https://install.appcenter.ms/api/v0.1/apps/${owner}/${app}/distribution_groups/public/releases/${matched.id}`

  console.log(`Fetching ${releaseUrl}`)

  const { download_url: downloadUrl } = await got(
    releaseUrl,
  ).json<DownloadInfo>()

  console.log(`Redirect to ${downloadUrl}`)

  res.redirect(downloadUrl)
}
