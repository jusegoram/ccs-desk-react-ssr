import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { GraphQLString } from 'graphql'
// import _ from 'lodash'
import sendEmail from 'server/util/sendEmail'
import consumerElectronicsEmail from 'server/emails/techDashConsumerElectronics'

export default class TechDashConsumerElectronics extends APIModel {

  static jsonSchema = {
    title: 'TechDashConsumerElectronics',
    description:
      'Information about consumer electronics sold at customer houses',
    type: 'object',

    properties: {
      id: { type: 'string' },
      brand: { type: 'string' },
      customerAccountNumber: { type: 'string' },
      customerName: { type: 'string' },
      customerPhoneNumber: { type: 'string' }, //ID for database relationships;
      customerAddress: { type: 'string' },
      typeOfComplaint: { type: 'string' },
      deviceModelNumber: { type: 'string' },
      deviceSerialNumber: { type: 'string' },
      deviceError: { type: 'string' },
      callToCust1: { type: 'string' },
      callToCust2: { type: 'string' },
      callToCust3: { type: 'string' },
      callNotes: { type: 'string' },
      inboxEmail: { type: 'string' },
      dmaEmail: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
    },
  };

  static get QueryBuilder() {
    return class extends BaseQueryBuilder {
      _contextFilter() {
        return super._contextFilter()
      }
    }
  }

  static get mutations() {
    return {
      addRecord: {
        description: 'add a Tech Dash Consumer Electronics Record',
        type: this.GraphqlTypes.TechDashConsumerElectronics,
        args: {
          brand: { type: GraphQLString },
          customerAccountNumber: { type: GraphQLString },
          customerName: { type: GraphQLString },
          customerPhoneNumber: { type: GraphQLString }, //ID for database relationships;
          customerAddress: { type: GraphQLString },
          typeOfComplaint: { type: GraphQLString },
          deviceModelNumber: { type: GraphQLString },
          deviceSerialNumber: { type: GraphQLString },
          deviceError: { type: GraphQLString },
          callToCust1: { type: GraphQLString },
          callToCust2: { type: GraphQLString },
          callToCust3: { type: GraphQLString },
          callNotes: { type: GraphQLString },
          inboxEmail: { type: GraphQLString },
          dmaEmail: { type: GraphQLString },
        },
        resolve: async (
          root,
          {
            brand,
            customerAccountNumber,
            customerName,
            customerPhoneNumber,
            customerAddress,
            typeOfComplaint,
            deviceModelNumber,
            deviceSerialNumber,
            deviceError,
            callToCust1,
            callToCust2,
            callToCust3,
            callNotes,
            inboxEmail,
            dmaEmail,
          }
        ) => {
          const record = await TechDashConsumerElectronics.query().insert(
            {
              brand: brand,
              customerAccountNumber: customerAccountNumber,
              customerName: customerName,
              customerPhoneNumber: customerPhoneNumber,
              customerAddress: customerAddress,
              typeOfComplaint: typeOfComplaint,
              deviceModelNumber: deviceModelNumber,
              deviceSerialNumber: deviceSerialNumber,
              deviceError: deviceError,
              callToCust1: callToCust1,
              callToCust2: callToCust2,
              callToCust3: callToCust3,
              callNotes: callNotes,
              inboxEmail: inboxEmail,
              dmaEmail: dmaEmail,
            }
          ).returning('*')

          const html = consumerElectronicsEmail({
            brand,
            customerAccountNumber,
            customerName,
            customerPhoneNumber,
            customerAddress,
            typeOfComplaint,
            deviceModelNumber,
            deviceSerialNumber,
            deviceError,
            callToCust1,
            callToCust2,
            callToCust3,
            callNotes,
            inboxEmail,
            dmaEmail,
          })
          const subject = `CONSUMER ELECTRONIC FOR CUST. ${customerName} PHONE: ${customerPhoneNumber}`
          try {
            await sendEmail({ recipient: 'brhoads@goodmannetworks.com', subject, html })
            await sendEmail({ recipient: 'goodman@ccs-live.com', subject, html })
            await sendEmail({ recipient: inboxEmail, subject, html })
            await sendEmail({ recipient: dmaEmail, subject, html })
          } catch (e) {
            console.error(e) // eslint-disable-line no-console
          }
          return await record
        },
      },
    }
  }
}

