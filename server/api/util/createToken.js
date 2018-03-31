import jwt from 'jsonwebtoken'

export default ({ sessionId, clientContext }) => {
  const tokenPayload = { sessionId }
  const expiresIn = clientContext === 'Mobile' ? days(7) : hours(2) // 2 hours in seconds
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn })
  return token
}

const days = num => num * hours(24)
const hours = num => num * 60 * 60
