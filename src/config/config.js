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
  routeMode: 'hash',
  htmlOption: { // 控制骨架屏参数
    background: '180% / 200% 100% linear-gradient(100deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, .5) 50%, rgba(255, 255, 255, 0) 60%) #ededed',
    render: false, // 是否立即渲染到页面上
    animation: 'loading 2s linear infinite', // 动画
    animationStyles: ['loading {to {background-position-x: -20%}}']
  }
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
