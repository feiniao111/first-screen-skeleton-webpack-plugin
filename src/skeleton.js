'use strict'

const puppeteer = require('puppeteer')
const devices = require('puppeteer/DeviceDescriptors')
const { parse, toPlainObject, fromPlainObject, generate } = require('css-tree')
const { sleep, genScriptContent, htmlMinify, collectImportantComments } = require('./util')

class Skeleton {
  constructor(options = {}, log) {
    this.options = options
    this.browser = null
    this.scriptContent = ''
    this.pages = new Set()
    this.log = log
    this.initialize()
  }

  // Launch headless Chrome by puppeteer and load script
  async initialize() {
    const { headless } = this.options
    const { log } = this
    try {
      // load script content from `script` folder
      this.scriptContent = await genScriptContent()
      // Launch the browser
      this.browser = await puppeteer.launch({ headless })
    } catch (err) {
      log(err)
    }
  }

  async newPage() {
    const { device, debug } = this.options
    const page = await this.browser.newPage()
    this.pages.add(page)
    await page.emulate(devices[device])
    if (debug) {
      page.on('console', (...args) => {
        this.log.info(...args)
      })
    }
    return page
  }

  async closePage(page) {
    await page.close()
    return this.pages.delete(page)
  }

  // Generate the skeleton screen for the specific `page`
  async makeSkeleton(page) {
    const { defer, htmlOption } = this.options
    await page.addScriptTag({ content: this.scriptContent })
    await sleep(defer)
    return await page.evaluate((htmlOption) => Skeleton.evalDOM(htmlOption), htmlOption)
  }

  async genHtml(url, route) {
    const stylesheetAstObjects = {}
    const stylesheetContents = {}

    const page = await this.newPage()
    const { cookies, storagies = {}, sessionStoragies = {} } = this.options

    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (stylesheetAstObjects[request.url]) {
        // don't need to download the same assets
        request.abort()
      } else {
        request.continue()
      }
    })
    // To build a map of all downloaded CSS (css use link tag)
    page.on('response', (response) => {
      const requestUrl = response.url()
      const ct = response.headers()['content-type'] || ''
      if (response.ok && !response.ok()) {
        throw new Error(`${response.status} on ${requestUrl}`)
      }

      if (ct.indexOf('text/css') > -1 || /\.css$/i.test(requestUrl)) {
        response.text().then((text) => {
          const ast = parse(text, {
            parseValue: false,
            parseRulePrelude: false
          })
          stylesheetAstObjects[requestUrl] = toPlainObject(ast)
          stylesheetContents[requestUrl] = text
        })
      }
    })
    page.on('pageerror', (error) => {
      throw error
    })


    if (cookies.length) {
      await page.setCookie(...cookies.filter(cookie => typeof cookie === 'object'))
    }

    const response = await page.goto(url, { waitUntil: 'networkidle2' })

    if (Object.keys(storagies).length) {
      await page.evaluate((storagies) => {
        for (const item in storagies) {
          if (storagies.hasOwnProperty(item)) {
            localStorage.setItem(item, storagies[item])
          }
        }
      }, storagies)
    }

    if (Object.keys(sessionStoragies).length) {
      await page.evaluate((sessionStoragies) => {
        for (const item in sessionStoragies) {
          if (sessionStoragies.hasOwnProperty(item)) {
            sessionStorage.setItem(item, sessionStoragies[item])
          }
        }
      }, sessionStoragies)
    }

    if (response && !response.ok()) {
      throw new Error(`${response.status} on ${url}`)
    }


    const res = await this.makeSkeleton(page)

    let shellHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Page Skeleton</title>
          $$style$$
      </head>
      <body>
        $$html$$
      </body>
      </html>`
    shellHtml = shellHtml
      .replace('$$style$$', res.substring(0, res.indexOf('</style>') + 8))
      .replace('$$html$$', res.substring(res.indexOf('</style>') + 8))
    const result = {
      originalRoute: route,
      route: this.options.routeMode == 'history' ? await page.evaluate('window.location.pathname') : (await page.evaluate('window.location.hash')).replace('#', ''),
      html: htmlMinify(shellHtml, false)
    }
    await this.closePage(page)
    return Promise.resolve(result)
  }

  async renderRoutes(origin, sklWriteDir, routes = this.options.routes) {
    let curRoutes = routes
    if (typeof(routes[0]) == 'object') { // 多入口场景，routes是元素为对象的数组
      let isNoMatch = true
      for (let i = 0; i < routes.length; i++) {
        if (!!routes[i][sklWriteDir]) {
          isNoMatch = false
          curRoutes = routes[i][sklWriteDir]
          break
        }
      }
      curRoutes = isNoMatch ? [] : curRoutes
    }
    return Promise.all(curRoutes.map((route) => {
      const { routeMode = 'history' } = this.options // 增加hash路由支持
      const url = routeMode == 'hash' ? `${origin}#${route}` : `${origin}${route}`
      return this.genHtml(url, route)
    }))
  }

  async destroy() {
    const { log } = this
    if (this.pages.size) {
      const promises = []
      for (const page of this.pages) {
        promises.push(page.close())
      }
      try {
        await Promise.all(promises)
      } catch (err) {
        log(err)
      }
      this.pages = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

module.exports = Skeleton
