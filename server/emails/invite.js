import React from 'react'
import ReactDOMServer from 'react-dom/server'

export default ({ invite }) => {
  const inviteUrl = `${process.env.HOST}/invites/accept/${invite.token}`
  return ReactDOMServer.renderToStaticMarkup(
    <div>
      <h2>Welcome to CCS Desk!</h2>
      <p>
        {invite.sender.owner.name} has requested a password reset for your account. To reset your password, click the
        following link.
      </p>
      <a href={inviteUrl}>{inviteUrl}</a>
    </div>
  )
}
