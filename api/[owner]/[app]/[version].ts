export interface ReleaseInfo {
  id: string
  version: string
  short_version: string
}

export interface ErrorResponse {
  code: string
  message: string
}

export interface DownloadInfo {
  download_url: string
}

const NOT_FOUND = 404

const FETCH_OPTIONS = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  },
}

export const config = {
  runtime: 'edge',
}

export default async (req: Request): Promise<Response> => {
  const { searchParams } = new URL(req.url)

  const owner = searchParams.get('owner')!
  const app = searchParams.get('app')!
  let version = searchParams.get('version')!

  if (version.includes(',')) {
    version = version.split(',')[0]
    console.warn(
      `Version with comma is unnecessary anymore, using ${version} instead`,
    )
  }

  const releasesUrl = `https://install.appcenter.ms/api/v0.1/apps/${owner}/${app}/distribution_groups/public/public_releases`

  console.log(`Fetching ${releasesUrl}`)

  const releasesRes = await fetch(releasesUrl, FETCH_OPTIONS)

  const releases = (await releasesRes.clone().json()) as
    | ErrorResponse
    | ReleaseInfo[]

  if (!releasesRes.ok || !Array.isArray(releases)) {
    return releasesRes
  }

  const matched = releases.find(
    it => it.version === version || it.short_version === version,
  )

  if (!matched) {
    return new Response(
      `No matched version ${version} found for ${owner}/${app}`,
      {
        status: NOT_FOUND,
      },
    )
  }

  const releaseUrl = `https://install.appcenter.ms/api/v0.1/apps/${owner}/${app}/distribution_groups/public/releases/${matched.id}`

  console.log(`Fetching ${releaseUrl}`)

  const downloadInfoRes = await fetch(releaseUrl, FETCH_OPTIONS)

  const downloadInfo = (await downloadInfoRes.json()) as
    | DownloadInfo
    | ErrorResponse

  if (!downloadInfoRes.ok) {
    return downloadInfoRes
  }

  const { download_url: downloadUrl } = downloadInfo as DownloadInfo

  console.log(`Redirect to ${downloadUrl}`)

  return Response.redirect(downloadUrl)
}
