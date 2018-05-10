import React from 'react'
import ReactDOMServer from 'react-dom/server'
import config from 'server/config'

export default ({ sender, invite }) => {
  const inviteUrl = `${config.host}/invites/accept/${invite.token}`
  return ReactDOMServer.renderToStaticMarkup(
    <div>
      <h2>Welcome to CCS Desk!</h2>
      <p>
        Hello {invite.name}! {sender.name} has invited you to create an account on CCS Desk. To create your account,
        click the following link.
      </p>
      <a href={inviteUrl}>{inviteUrl}</a>
    </div>
  )
}
