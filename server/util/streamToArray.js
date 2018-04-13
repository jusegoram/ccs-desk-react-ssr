import Promise from 'bluebird'
import { identity } from 'lodash'

import ObjectStreamTransform from 'server/util/ObjectStreamTransform'

export default async (stream, transformCallback = identity) =>
  new Promise(async (resolve, reject) => {
    const objArray = []
    stream
    .pipe(new ObjectStreamTransform(transformCallback))
    .on('data', obj => objArray.push(obj))
    .on('end', () => {
      resolve(objArray)
    })
    .on('error', error => {
      reject(error)
    })
  })
