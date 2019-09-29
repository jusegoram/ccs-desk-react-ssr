import React from 'react'
import ReactDOMServer from 'react-dom/server'

export default ({
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
}) =>
  ReactDOMServer.renderToStaticMarkup(
    <div>
      <h2>TECH DASH CONSUMER ELECTRONICS FORM</h2>
      <br/>
      <br/>
      <br/>
      <table>
        <tr>
          <td>BRAND:</td>
          <td>{brand}</td>
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
        <tr>
          <td>COMPLAINT TYPE:</td>
          <td>{typeOfComplaint}</td>
        </tr>
        <tr>
          <td>DEVICE MODEL NUMBER:</td>
          <td>{deviceModelNumber}</td>
        </tr>
        <tr>
          <td>DEVICE SERIAL NUMBER:</td>
          <td>{deviceSerialNumber}</td>
        </tr>
        <tr>
          <td>DEVICE ERROR:</td>
          <td>{deviceError}</td>
        </tr>
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