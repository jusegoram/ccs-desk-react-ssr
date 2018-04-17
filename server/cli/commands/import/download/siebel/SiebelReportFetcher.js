//CCS_UNIQUE RMXNRWBWBXR
/* eslint-disable no-console */
const path = require('path')

const Promise = require('bluebird')
const Horseman = require('node-horseman')
const cheerio = require('cheerio')
const moment = require('moment-timezone')

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36' +
  ' (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'
const baseUrl = 'https://sesar.directv.com/analytics/'
const logInUrl = baseUrl + 'saw.dll?Dashboard'

const selector = {
  usernameInput: '#username',
  passwordInput: '#password',
  loginSubmitButton:
    'body > div > div.ping-body-container > div:nth-child(2) > form > div.ping-buttons > a.ping-button.normal.allow',
  navMenuItems: '#PageContentOuterDiv #DashboardPageContentDiv',
  getNthNavMenuReportLink(n) {
    return `#PageContentOuterDiv #DashboardPageContentDiv .FitContent .ColumnTable > tbody > tr:nth-child(${1 +
      2 * n[0]}) .SectionTable table tr:nth-child(${1 + 2 * n[1]}) a`
  },
  exportHtml: '.ViewContent > table > tbody > tr > td:last-child',
}

const generateGetScreenshotPath = options => screenshotName =>
  path.join(options.screenshotsDirectory, `${options.screenshotsPrefix}${screenshotName}.png`)
const generateFormatLog = options => output =>
  output.replace(/\n/g, `\n[${options.loggingPrefix}] `).replace(/^/g, `[${options.loggingPrefix}] `)

class SiebelReportFetcher {
  static initClass() {
    this.reportParamsPageHandlers = {
      Sclosed: function(horseman) {
        const twoDaysAgo = moment().add(-2, 'day')
        const params = [
          moment(twoDaysAgo)
          .startOf('month')
          .format('YYYY-MM-DD'),
          moment(twoDaysAgo).format('YYYY-MM-DD'),
        ]
        horseman = horseman.waitForSelector('.promptEditBoxField')
        return horseman
        .html('.PromptViewCell')
        .then(function(html) {
          let _horseman = this
          const $ = cheerio.load(html)
          return Promise.all(
            $('.promptControl input')
            .toArray()
            .map((el, index) => {
              const inputId = $(el).attr('id')
              const inputValue = params[index]
              if (inputValue != null) {
                return (_horseman = _horseman.type(`#${inputId}`, inputValue))
              }
            })
          )
        })
        .then(function() {
          return this.click('#gobtn')
        })
      },
    }
  }

  constructor(credentials) {
    this.fetchReport = this.fetchReport.bind(this)
    this.attemptToFetchReport = this.attemptToFetchReport.bind(this)
    this.credentials = credentials
    if (!credentials || !credentials.username || !credentials.password) {
      throw new Error('Credentials required.')
    }
  }

  fetchReport(
    reportName,
    {
      loggingPrefix = false,
      screenshotsDirectory = false,
      screenshotsPrefix = '',
      reportParams = {},
      horsemanConfig = {},
      maxRetries = 1,
    } = {}
  ) {
    const options = { loggingPrefix, screenshotsDirectory, screenshotsPrefix, reportParams, horsemanConfig, maxRetries }

    let retries = 0
    var attempt = () => {
      const reportLinkText = reportName
      return Promise.resolve()
      .then(() => {
        return this.attemptToFetchReport(reportLinkText, options)
      })
      .catch(error => {
        if (retries >= options.maxRetries) {
          throw error
        }
        console.log(`Error while attempting to fetch ${reportLinkText} - trying again (retry: ${retries})`)
        retries++
        return attempt()
      })
    }
    return attempt()
  }

  attemptToFetchReport(
    reportLinkText,
    {
      loggingPrefix = false,
      screenshotsDirectory = false,
      screenshotsPrefix = '',
      reportParams = {},
      horsemanConfig = {},
    } = {}
  ) {
    let formatLog
    const options = { loggingPrefix, screenshotsDirectory, screenshotsPrefix, reportParams, horsemanConfig }

    const horsemanConfigBase = {
      timeout: 600000, // 10 minutes
      switchToNewTab: true,
      cookiesFile: path.join(__dirname, 'cookies.txt'),
      injectBluebird: false,
      injectJquery: false,
      phantomPath: '/usr/local/bin/phantomjs',
    }

    if (options.loggingPrefix) {
      formatLog = generateFormatLog(options)
    }

    const getScreenshotPath = generateGetScreenshotPath(options)

    // for referencing this from child scopes
    const thisReportFetcher = this

    // summon the headless horseman
    let horseman = new Horseman({ ...horsemanConfigBase, ...options.horsemanConfig })
    .userAgent(userAgent)
    .viewport(1400, 800)

    return Promise.resolve()
    .then(() => {
      if (options.loggingPrefix) {
        horseman = horseman.log(formatLog('\nOpening page...'))
      }

      // open page
      horseman = horseman.open(logInUrl).wait(5000)

      if (options.screenshotsDirectory) {
        horseman = horseman.screenshot(getScreenshotPath('0_pageOpened'))
      }

      horseman = horseman
      .exists(selector.usernameInput)
      .then(function(loginPagePresented) {
        let thisChain = this

        // if presented with a login page, log in
        if (loginPagePresented) {
          if (options.loggingPrefix) {
            thisChain = thisChain.log(formatLog('Login page opened. Logging in...'))
          }

          thisChain = thisChain
            // wait for username to be present
          .waitForSelector(selector.usernameInput)
            // wait for password to be present
          .waitForSelector(selector.passwordInput)
            // wait for submit button to be present
          .waitForSelector(selector.loginSubmitButton)
            // wait half a second, just to be sure
          .wait(500)
            // fill in username
          .type(selector.usernameInput, thisReportFetcher.credentials.username)
            // fill in password
          .type(selector.passwordInput, thisReportFetcher.credentials.password)

          if (options.screenshotsDirectory) {
            thisChain = thisChain.screenshot(getScreenshotPath('1_loginFormFilledOut'))
          }

          thisChain = thisChain
          .wait(1000)
            // click log in button
          .click(selector.loginSubmitButton)

          if (options.loggingPrefix) {
            thisChain = thisChain.log(formatLog('\nLogin button clicked...'))
          }

          // wait for page load
          return thisChain.waitForNextPage()
        }
        if (options.loggingPrefix) {
          return this.log(formatLog('Dashboard opened. No login required.'))
        }
      })
      .waitForSelector(selector.navMenuItems)

      if (options.loggingPrefix) {
        horseman = horseman.log(formatLog('Successfully logged in.'))
      }
      if (options.screenshotsDirectory) {
        horseman = horseman.screenshot(getScreenshotPath('2_dashboard'))
      }

      const encodedReportPath = encodeURIComponent(`/shared/FSS HSP Objects - Transfer/STL/${reportLinkText}`)
      return horseman.download(
        `https://sesar.directv.com/analytics/saw.dll?Go&path=${encodedReportPath}&Format=csv&Extension=.csv`
      )
    })
    .tap(() => {
      if (options.loggingPrefix) {
        return console.log(formatLog(`\n${reportLinkText} CSV data has been downloaded.`))
      }
    })
    .finally(() => {
      // kill the headless horseman
      return horseman.close()
    })
  }
}
SiebelReportFetcher.initClass()

module.exports = SiebelReportFetcher
