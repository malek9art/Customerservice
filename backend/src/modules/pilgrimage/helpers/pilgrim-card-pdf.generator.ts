export interface PilgrimCardData {
  pilgrimId: string;
  fullName: string;
  passportNumber: string;
  nationality: string;
  packageName: string;
  season: string;
  groupName?: string;
  busNumber?: string;
  seatNumber?: number;
  hotelName?: string;
  roomNumber?: string;
  roomType?: string;
  minaCamp?: string;
  arafatCamp?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  agencyName: string;
}

export class PilgrimCardPdfGenerator {
  static generateCardPdfBuffer(data: PilgrimCardData): Buffer {
    const qrData = `NUSUK:${data.pilgrimId}:${data.passportNumber}:${data.agencyName}`;
    const cardHtml = `
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 350 500] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 800 >>
stream
BT
/F1 16 Tf
20 460 Td
(${data.agencyName.toUpperCase()} - PILGRIM CARD) Tj
/F1 10 Tf
0 -20 Td
(Season: ${data.season || '1447H'}) Tj
0 -15 Td
(--------------------------------------------------) Tj
0 -20 Td
/F1 12 Tf
(NAME: ${data.fullName}) Tj
/F1 10 Tf
0 -15 Td
(PASSPORT: ${data.passportNumber} | NAT: ${data.nationality}) Tj
0 -20 Td
(PACKAGE: ${data.packageName}) Tj
0 -15 Td
(BUS: ${data.busNumber || 'N/A'} | SEAT: ${data.seatNumber || 'N/A'}) Tj
0 -15 Td
(GROUP: ${data.groupName || 'Unassigned'}) Tj
0 -15 Td
(HOTEL: ${data.hotelName || 'N/A'} | ROOM: ${data.roomNumber || 'N/A'} [${data.roomType || 'STD'}]) Tj
0 -20 Td
(MINA CAMP: ${data.minaCamp || 'TENT ZONE A'}) Tj
0 -15 Td
(ARAFAT CAMP: ${data.arafatCamp || 'ZONE 4'}) Tj
0 -20 Td
(EMERGENCY CONTACT: ${data.emergencyContact || 'AGENCIES HELPLINE'}) Tj
0 -15 Td
(MEDICAL INFO: ${data.medicalInfo || 'NONE'}) Tj
0 -25 Td
(VERIFICATION QR DATA: ${qrData}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000315 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
1180
%%EOF
`;
    return Buffer.from(cardHtml.trim());
  }
}
