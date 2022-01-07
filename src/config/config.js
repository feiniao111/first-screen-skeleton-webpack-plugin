'use strict'

const staticPath = '__webpack_page_skeleton__'

const defaultOptions = {
  port: '8989',
  device: 'iPhone 6 Plus',
  debug: false,
  defer: 5000,
  cookies: [],
  headless: true,
  h5Only: false,
  logLevel: 'info',
  quiet: false,
  noInfo: false,
  logTime: true,
  routeMode: 'hash'
}

const htmlBeautifyConfig = {
  indent_size: 2,
  html: {
    end_with_newline: true,
    js: {
      indent_size: 2
    },
    css: {
      indent_size: 2
    }
  },
  css: {
    indent_size: 1
  },
  js: {
    'preserve-newlines': true
  }
}

module.exports = {
  htmlBeautifyConfig,
  defaultOptions,
  staticPath
}
