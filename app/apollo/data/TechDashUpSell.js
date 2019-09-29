import gql from 'graphql-tag'

const props = `
    message
    product
    customerAccountNumber
    customerName
    customerPhoneNumber
    customerAddress
    receiptNotes
    typeOfComplaint
    complaintDetails
    problemDetails
    callToCust1
    callToCust2
    callToCust3
    callNotes
`
export default class TechDashUpSell {
  static props = props
  static QUERY = {
    query: gql`
      query TechDashUpSell {
        TechDashUpSell {
          ${props}
        }
      }
    `,
  }
  static M_addRecord = {
    mutation: gql`
      mutation TechDashUpSell_addRecord(
        $message: String!,
        $product: String!,
        $customerAccountNumber: String!,
        $customerName: String!,
        $customerPhoneNumber: String!,
        $customerAddress: String!,
        $receiptNotes: String!,
        $typeOfComplaint: String!,
        $complaintDetails: String!,
        $problemDetails: String!,
        $callToCust1: String!,
        $callToCust2: String!,
        $callToCust3: String!,
        $callNotes: String!,
        $inboxEmail: String!,
        $dmaEmail: String!){
        TechDashUpSell_addRecord(
            message: $message,
            product: $product,
            customerAccountNumber: $customerAccountNumber,
            customerName: $customerName,
            customerPhoneNumber: $customerPhoneNumber,
            customerAddress: $customerAddress,
            receiptNotes: $receiptNotes,
            typeOfComplaint: $typeOfComplaint,
            complaintDetails: $complaintDetails,
            problemDetails: $problemDetails,
            callToCust1: $callToCust1,
            callToCust2: $callToCust2,
            callToCust3: $callToCust3,
            callNotes: $callNotes,
            inboxEmail: $inboxEmail,
            dmaEmail: $dmaEmail
            ){
              ${props}
        }
      }
    `,
  }
}