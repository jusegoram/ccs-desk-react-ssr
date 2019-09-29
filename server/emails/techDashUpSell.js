import React from 'react'
import ReactDOMServer from 'react-dom/server'

export default ({
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
}) =>
  ReactDOMServer.renderToStaticMarkup(
    <div>
      <h2> TECH DASH UP SELL FORM </h2>
      <br/>
      <br/>
      <br/>
      <br/>
      <table>
        <tr>
          <td>MAIN CALL PURPOUSE:</td>
          <td>{message}</td>
        </tr>
        <tr>
          <td>PRODUCT:</td>
          <td>{product}</td>
        </tr>

        <tr>
          <td>CUST. ACCOUNT NO.:</td>
          <td>{customerAccountNumber}</td>
        </tr>
        <tr>
          <td>NAME:</td>
          <td>{customerName}</td>
        </tr>
        <tr>
          <td>PHONE NUMBER:</td>
          <td>{customerPhoneNumber}</td>
        </tr>
        <tr>
          <td>ADDRESS:</td>
          <td>{customerAddress}</td>
        </tr>
        {receiptNotes !== '' && (
          <tr>
            <td>RECIEPT/INVOICE/BILLING NOTES:</td>
            <td>{receiptNotes}</td>
          </tr>
        )}
        {typeOfComplaint !== '' && (
          <div>
            <tr>
              <td>COMPLAINT TYPE:</td>
              <td>{typeOfComplaint}</td>
            </tr>
            <tr>
              <td>COMPLAINT TYPE:</td>
              <td>{complaintDetails}</td>
            </tr>
          </div>
        )}
        {problemDetails !== '' && (
          <tr>
            <td>PROBLEM / ISSUE DETAILS</td>
            <td>{problemDetails}</td>
          </tr>
        )}
        <tr>
          <td>CALL 1 OUTCOME:</td>
          <td>{callToCust1}</td>
        </tr>
        <tr>
          <td>CALL 2 OUTCOME:</td>
          <td>{callToCust2}</td>
        </tr>
        <tr>
          <td>CALL 3 OUTCOME:</td>
          <td>{callToCust3}</td>
        </tr>
        <tr>
          <td>CALL NOTES</td>
          <td>{callNotes}</td>
        </tr>
        <tr>
          <td>INBOXED TO:</td>
          <td>{inboxEmail}</td>
        </tr>
        <tr>
          <td>EMAILED TO:</td>
          <td>{dmaEmail}</td>
        </tr>
      </table>
    </div>
  )