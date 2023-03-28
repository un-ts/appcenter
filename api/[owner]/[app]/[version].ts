export interface ReleaseInfo {
  id: string
  version: string
  short_version: string
}

export interface DownloadInfo {
  download_url: string
}

const REDIRECT = 302
const NOT_FOUND = 404

export const config = {
  runtime: 'experimental-edge',
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url, 'https://example.com')

  const searchParams = url.searchParams

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

  const releasesRes = await fetch(releasesUrl)
  const releases = (await releasesRes.json()) as ReleaseInfo[]

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

  const downloadInfoRes = await fetch(releaseUrl)
  const { download_url: downloadUrl } =
    (await downloadInfoRes.json()) as DownloadInfo

  console.log(`Redirect to ${downloadUrl}`)

  return new Response(null, {
    status: REDIRECT,
    headers: {
      Location: downloadUrl,
    },
  })
}
