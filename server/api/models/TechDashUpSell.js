import { APIModel, BaseQueryBuilder } from 'server/api/util'
import { GraphQLString } from 'graphql'
// import _ from 'lodash'
import sendEmail from 'server/util/sendEmail'
import upSellEmail from 'server/emails/techDashUpSell'

export default class TechDashUpSell extends APIModel {




  static jsonSchema = {
    title: 'TechDashUpSell',
    description:
      'Information about Up Sell Products sold at customer houses',
    type: 'object',

    properties: {
      id: { type: 'string' },
      message: { type: 'string' },
      product: { type: 'string' },
      customerAccountNumber: { type: 'string' },
      customerName: { type: 'string' },
      customerPhoneNumber: { type: 'string' }, //ID for database relationships;
      customerAddress: { type: 'string' },
      receiptNotes: { type: 'string' },
      typeOfComplaint: { type: 'string' },
      complaintDetails: { type: 'string' },
      problemDetails: { type: 'string' },
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
        type: this.GraphqlTypes.TechDashUpSell,
        args: {
          message: { type: GraphQLString },
          product: { type: GraphQLString },
          customerAccountNumber: { type: GraphQLString },
          customerName: { type: GraphQLString },
          customerPhoneNumber: { type: GraphQLString },
          customerAddress: { type: GraphQLString },
          receiptNotes: { type: GraphQLString },
          typeOfComplaint: { type: GraphQLString },
          complaintDetails: { type: GraphQLString },
          problemDetails: { type: GraphQLString },
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
            message,
            product,
            customerAccountNumber,
            customerName,
            customerPhoneNumber,
            customerAddress,
            receiptNotes,
            typeOfComplaint,
            complaintDetails,
            problemDetails,
            callToCust1,
            callToCust2,
            callToCust3,
            callNotes,
            inboxEmail,
            dmaEmail,
          }
        ) => {
          const record = await TechDashUpSell.query().insert(
            {
              message:message,
              product: product,
              customerAccountNumber: customerAccountNumber,
              customerName: customerName,
              customerPhoneNumber: customerPhoneNumber,
              customerAddress: customerAddress,
              receiptNotes: receiptNotes,
              typeOfComplaint: typeOfComplaint,
              complaintDetails: complaintDetails,
              problemDetails: problemDetails,
              callToCust1: callToCust1,
              callToCust2: callToCust2,
              callToCust3: callToCust3,
              callNotes: callNotes,
              inboxEmail: inboxEmail,
              dmaEmail: dmaEmail,
            }
          ).returning('*')

          const html = upSellEmail({
            message,
            product,
            customerAccountNumber,
            customerName,
            customerPhoneNumber,
            customerAddress,
            receiptNotes,
            typeOfComplaint,
            complaintDetails,
            problemDetails,
            callToCust1,
            callToCust2,
            callToCust3,
            callNotes,
            inboxEmail,
            dmaEmail,
          })
          const subject = `UP SELL REPORT FOR CUST. ${customerName} PHONE: ${customerPhoneNumber}`
          try {
             await sendEmail({ recipient: 'david.long@ccs-live.com', subject, html })
            await sendEmail({ recipient: 'jseb16@gmail.com', subject, html })
            // await sendEmail({ recipient: inboxEmail, subject, html })
            // await sendEmail({ recipient: dmaEmail, subject, html })
          } catch (e) {
            console.error(e) // eslint-disable-line no-console
          }
          return await record
        },
      },
    }
  }
}