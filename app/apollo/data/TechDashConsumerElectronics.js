/* @flow */
import gql from 'graphql-tag'

const props = `
     brand
    customerAccountNumber
    customerName
    customerPhoneNumber
    customerAddress
    typeOfComplaint
    deviceModelNumber
    deviceSerialNumber
    deviceError
    callToCust1
    callToCust2
    callToCust3
    callNotes
`
export default class TechDashConsumerElectronics {
  static props = props
  static QUERY = {
    query: gql`
      query TechDashConsumerElectronics {
        TechDashConsumerElectronics {
          ${props}
        }
      }
    `,
  }
  static M_addRecord = {
    mutation: gql`
      mutation TechDashConsumerElectronics_addRecord(
        $brand: String!,
        $customerAccountNumber: String!,
        $customerName: String!,
        $customerPhoneNumber: String!,
        $customerAddress: String!,
        $typeOfComplaint: String!,
        $deviceModelNumber: String!,
        $deviceSerialNumber: String!,
        $deviceError: String!,
        $callToCust1: String!,
        $callToCust2: String!,
        $callToCust3: String!,
        $callNotes: String!,
        $inboxEmail: String!,
        $dmaEmail: String!){
        TechDashConsumerElectronics_addRecord(
            brand: $brand,
            customerAccountNumber: $customerAccountNumber,
            customerName: $customerName,
            customerPhoneNumber: $customerPhoneNumber,
            customerAddress: $customerAddress,
            typeOfComplaint: $typeOfComplaint,
            deviceModelNumber: $deviceModelNumber,
            deviceSerialNumber: $deviceSerialNumber,
            deviceError: $deviceError,
            callToCust1: $callToCust1,
            callToCust2: $callToCust2,
            callToCust3: $callToCust3,
            callNotes: $callNotes,
            inboxEmail: $inboxEmail,
            dmaEmail: $dmaEmail
            ){
              inboxEmail
        }
      }
    `,
  }
}