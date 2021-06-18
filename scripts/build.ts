import fs from 'fs'

import { request } from '@octokit/request'

/**
 * @link https://github.com/sindresorhus/github-markdown-css
 */
request('POST /markdown', {
  text: fs.readFileSync('README.md', 'utf8'),
  token: process.env.GITHUB_TOKEN,
}).then(response => {
  fs.writeFileSync(
    'public/index.html',
    /* HTML */ `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>App Center</title>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/4.0.0/github-markdown.min.css"
          />
          <style>
            .markdown-body {
              box-sizing: border-box;
              min-width: 200px;
              max-width: 980px;
              margin: 0 auto;
              padding: 45px;
            }

            @media (max-width: 767px) {
              .markdown-body {
                padding: 15px;
              }
            }
          </style>
        </head>
        <body>
          <article class="markdown-body">${String(response.data)}</article>
        </body>
      </html>`,
  )
}, console.error)
