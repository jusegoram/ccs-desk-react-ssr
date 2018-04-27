export default {
  host: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://beta.ccsdesk.com',
  emailSender: 'CCS Desk<info@ccsdesk.com>',
}
