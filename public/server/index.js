export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const acceptsHtml = request.headers.get('accept')?.includes('text/html')

    if (acceptsHtml && !url.pathname.split('/').pop()?.includes('.')) {
      url.pathname = '/index.html'
      return env.ASSETS.fetch(new Request(url, request))
    }

    return env.ASSETS.fetch(request)
  },
}
