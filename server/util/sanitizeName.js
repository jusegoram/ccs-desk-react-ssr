import { parseFullName } from 'parse-full-name'

export default dirtyName => {
  if (!dirtyName) return undefined
  const name = parseFullName(dirtyName)
  return `${name.first} ${name.last}`
}
