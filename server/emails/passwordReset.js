import React from 'react'
import ReactDOMServer from 'react-dom/server'

export default ({ resetUrl }) =>
  ReactDOMServer.renderToStaticMarkup(
    <div>
      <h2>Password Reset</h2>
      <p>Someone has requested a password reset for your account. To reset your password, click the following link.</p>
      <a href={resetUrl}>{resetUrl}</a>
    </div>
  )
