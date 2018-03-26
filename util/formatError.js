import chalk from 'chalk'

const stackLineRegex = /^\s*at /
const nodeModulesRegex = /node_modules/
const myErrorRegex = /(.+)(\(.+)(\/next\/.+\/)(.+)(\..+:\d+)(:\d+\))/

export default error => {
  return (
    error.stack
    .split('\n')
    .map(line => {
      if (!stackLineRegex.test(line)) {
        if (/^From/.test(line)) return chalk.red.dim(line)
        return chalk.cyanBright(line)
      }
      if (nodeModulesRegex.test(line)) return chalk.red.dim(line)
      if (myErrorRegex.test(line)) {
        const [fnCall, filler, relPath, file, lineNumber, end] = line.match(myErrorRegex).slice(1)
        return [
          chalk.red.bold(fnCall),
          chalk.red.dim(filler),
          chalk.cyan(relPath),
          chalk.cyanBright.bold(file),
          chalk.cyan(lineNumber),
          chalk.red.dim(end),
        ].join('')
      }
      return chalk.red.dim(line)
    })
    .join('\n') + chalk.reset('')
  )
}
