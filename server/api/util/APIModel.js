import BaseModel from 'server/api/util/BaseModel'
import withUUID from 'server/api/util/mixins/withUUID'
import withVisibility from 'objection-visibility'
import { forOwn } from 'lodash'

export default class APIModel extends withUUID(withVisibility(BaseModel)) {}
