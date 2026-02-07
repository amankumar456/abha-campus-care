/**
 * Generates a verification URL for printable documents
 * In production, this would link to a verification page
 */
export const getVerificationUrl = (documentId: string, documentType: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify?doc=${documentType}&id=${documentId}`;
};

/**
 * Generates inline CSS for the standardized footer with QR code
 */
export const getFooterStyles = (): string => `
  .verification-footer {
    margin-top: 30px;
    padding: 15px;
    border-top: 2px solid #1e3a5f;
    background: #f8fafc;
  }
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }
  .footer-text {
    flex: 1;
  }
  .footer-title {
    font-size: 11px;
    font-weight: 600;
    color: #1e3a5f;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .footer-info {
    font-size: 10px;
    color: #4a5568;
    line-height: 1.6;
  }
  .footer-info p {
    margin: 2px 0;
  }
  .footer-contact {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
  }
  .footer-contact-title {
    font-size: 9px;
    font-weight: 600;
    color: #1e3a5f;
    margin-bottom: 4px;
  }
  .footer-contact-info {
    font-size: 10px;
    color: #2d3748;
  }
  .qr-section {
    text-align: center;
    padding: 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }
  .qr-code {
    width: 70px;
    height: 70px;
    margin-bottom: 4px;
  }
  .qr-label {
    font-size: 8px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .document-id {
    font-size: 8px;
    color: #888;
    font-family: monospace;
    margin-top: 2px;
  }
`;

/**
 * Generates the HTML for the standardized verification footer
 */
export const getFooterHtml = (
  documentId: string,
  documentType: string,
  qrDataUrl: string,
  generatedDate: string
): string => `
  <div class="verification-footer">
    <div class="footer-content">
      <div class="footer-text">
        <div class="footer-title">Document Verification</div>
        <div class="footer-info">
          <p>This is a digitally generated document from NIT Warangal Health Centre.</p>
          <p>Generated on: ${generatedDate}</p>
          <p>Document Type: ${documentType}</p>
        </div>
        <div class="footer-contact">
          <div class="footer-contact-title">For Verification Contact:</div>
          <div class="footer-contact-info">
            <strong>Health Centre, NIT Warangal</strong><br/>
            Phone: 0870-2462022 | Emergency: 0870-2462099<br/>
            Email: healthcentre@nitw.ac.in<br/>
            Address: Health Centre, NIT Warangal, Telangana - 506004
          </div>
        </div>
      </div>
      <div class="qr-section">
        <img src="${qrDataUrl}" alt="Verification QR Code" class="qr-code" />
        <div class="qr-label">Scan to Verify</div>
        <div class="document-id">${documentId.slice(0, 12).toUpperCase()}</div>
      </div>
    </div>
  </div>
`;

/**
 * Hospital card specific footer (more compact)
 */
export const getCompactFooterStyles = (): string => `
  .verification-footer-compact {
    margin-top: 12px;
    padding: 10px;
    border-top: 1px solid #1a365d;
    background: #f0f4f8;
    font-size: 9px;
    color: #4a5568;
  }
  .footer-compact-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }
  .footer-compact-text {
    flex: 1;
  }
  .footer-compact-text p {
    margin: 2px 0;
  }
  .footer-compact-text strong {
    color: #1a365d;
  }
  .qr-compact {
    text-align: center;
  }
  .qr-compact img {
    width: 50px;
    height: 50px;
  }
  .qr-compact-label {
    font-size: 7px;
    color: #666;
    margin-top: 2px;
  }
`;

export const getCompactFooterHtml = (
  documentId: string,
  qrDataUrl: string
): string => `
  <div class="verification-footer-compact">
    <div class="footer-compact-content">
      <div class="footer-compact-text">
        <p><strong>NIT Warangal Health Centre</strong></p>
        <p>For verification: 0870-2462022 | healthcentre@nitw.ac.in</p>
        <p>This is a digitally generated hospital referral card.</p>
      </div>
      <div class="qr-compact">
        <img src="${qrDataUrl}" alt="QR" />
        <div class="qr-compact-label">Verify: ${documentId.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
  </div>
`;
