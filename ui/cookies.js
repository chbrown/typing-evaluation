/** Copyright 2012-2014, Christopher Brown <io@henrian.com>, MIT Licensed

Cookies v0.3.0 API:

`cookies.get(name [, options])`: get the string value of the cookie named `name`

`cookies.set(name, value [, options])`: set the string value of the cookie named `name`

`cookies.del(name [, options])`: expire the cookie named `name` and set its value to the empty string

`cookies.all([options])`: get all cookies as an object mapping names to values

https://raw.github.com/chbrown/misc-js/master/cookies.js
*/
export class Cookies {
  constructor(
    path = '/',
    expires = new Date(new Date().getTime() + 31 * 24 * 60 * 60 * 1000),
    encoder = encodeURIComponent,
    decoder = decodeURIComponent,
    domain = null,
    secure = false) {
    this.options = {path, expires, encoder, decoder, domain, secure}
  }
  get(name, options = {}) {
    const {decoder} = {...this.options, ...options}
    const document_cookie = document.cookie
    const cookies = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : []
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      // Does this cookie string begin with the name we want?
      if (cookie.slice(0, name.length + 1) == (name + '=')) {
        const value = cookie.slice(name.length + 1)
        return decoder(value)
      }
    }
  }
  set(name, value, options = {}) {
    const {path, expires, encoder, domain, secure} = {...this.options, ...options}
    const pairs = [[encoder(name), encoder(value.toString())]]
    if (expires) pairs.push(['expires', expires.toUTCString ? expires.toUTCString() : expires])
    if (path) pairs.push(['path', path])
    if (domain) pairs.push(['domain', domain])
    if (secure) pairs.push(['secure'])
    const cookie = pairs.map((pair) => pair.join('=')).join('; ')
    document.cookie = cookie
    return cookie
  }
  del(name, options = {}) {
    // delete by setting the expiration date to the UNIX epoch (Thu, 01 Jan 1970 00:00:00 GMT)
    return this.set(name, '', {...options, expires: new Date(0)})
  }
  all(options = {}) {
    const {decoder} = {...this.options, ...options}
    const cookies = {}
    const document_cookie = document.cookie
    const cookies_list = (document_cookie && document_cookie !== '') ? document_cookie.split(/\s*;\s*/) : []
    const cookies_length = cookies_list.length
    for (let i = 0; i < cookies_length; i++) {
      const cookie = cookies_list[i]
      const cookie_parts = cookie.split('=')
      const value = cookie_parts.slice(1).join('=')
      cookies[cookie_parts[0]] = decoder(value)
    }
    return cookies
  }
}
