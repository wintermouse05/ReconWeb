const PDFDocument = require('pdfkit');

const generateScanPDF = (scan, res) => {
  try {
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      bufferPages: true
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=scan-${scan._id}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('ReconWeb Security Scan Report', { align: 'center' });

    doc.moveDown();

    // Add scan metadata
    doc.fontSize(12)
       .font('Helvetica');

    addSection(doc, 'Scan Information');
    addKeyValue(doc, 'Scan ID', scan._id.toString());
    addKeyValue(doc, 'Target URL', scan.targetUrl);
    addKeyValue(doc, 'Created At', new Date(scan.createdAt).toLocaleString());
    addKeyValue(doc, 'Status', scan.status || 'completed');

    if (scan.notes) {
      addKeyValue(doc, 'Notes', scan.notes);
    }

    doc.moveDown();

    // Add summary section if available
    if (scan.summary) {
      addSection(doc, 'Executive Summary');
      
      const { riskLevel, riskScore, counts } = scan.summary;
      
      // Risk level
      doc.font('Helvetica-Bold').text('Risk Level: ', { continued: true });
      setRiskColor(doc, riskLevel);
      doc.text(riskLevel ? riskLevel.toUpperCase() : 'N/A');
      doc.font('Helvetica').fillColor('black');

      doc.moveDown(0.5);
      addKeyValue(doc, 'Risk Score', `${riskScore || 0}/100`);
      
      if (counts) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Findings Summary:');
        doc.font('Helvetica');
        
        if (counts.critical > 0) {
          addKeyValue(doc, '  Critical', counts.critical.toString(), 'red');
        }
        if (counts.high > 0) {
          addKeyValue(doc, '  High', counts.high.toString(), 'orange');
        }
        if (counts.medium > 0) {
          addKeyValue(doc, '  Medium', counts.medium.toString(), 'blue');
        }
        if (counts.low > 0) {
          addKeyValue(doc, '  Low', counts.low.toString(), 'gray');
        }
        if (counts.info > 0) {
          addKeyValue(doc, '  Info', counts.info.toString(), 'gray');
        }
        
        addKeyValue(doc, '  Total Findings', (counts.total || 0).toString(), 'black');
      }

      doc.moveDown();
    }

    // Add detailed results for each tool
    if (scan.results && scan.results.length > 0) {
      addSection(doc, 'Detailed Tool Results');

      scan.results.forEach((result, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Tool header
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(`Tool: ${(result.tool || 'Unknown').toUpperCase()}`);

        doc.fontSize(12)
           .font('Helvetica');

        doc.moveDown(0.5);

        // Tool status
        doc.font('Helvetica-Bold').text('Status: ', { continued: true });
        doc.fillColor(result.status === 'completed' ? 'green' : 'red')
           .text((result.status || 'unknown').toUpperCase());
        doc.fillColor('black');

        doc.moveDown(0.5);

        // Timestamps
        if (result.startedAt) {
          addKeyValue(doc, 'Started', new Date(result.startedAt).toLocaleString());
        }
        if (result.finishedAt) {
          addKeyValue(doc, 'Finished', new Date(result.finishedAt).toLocaleString());
        }

        doc.moveDown();

        // Findings section
        if (result.findings && result.findings.length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .text(`Findings (${result.findings.length}):`);
          doc.fontSize(12);

          doc.moveDown(0.5);

          result.findings.forEach((finding, fIdx) => {
            // Add page break if needed
            if (doc.y > 650) {
              doc.addPage();
            }

            doc.font('Helvetica-Bold')
               .text(`${fIdx + 1}. `, { continued: true });

            // Severity badge
            const severityColor = getSeverityColor(finding.severity || 'info');
            doc.fillColor(severityColor)
               .text(`[${(finding.severity || 'INFO').toUpperCase()}] `, { continued: true });
            doc.fillColor('black');

            // Description
            doc.font('Helvetica')
               .text(finding.description || 'No description', { width: 500 });

            if (finding.path) {
              doc.fontSize(10)
                 .fillColor('gray')
                 .text(`   Path: ${finding.path}`);
              doc.fontSize(12).fillColor('black');
            }

            if (finding.templateId) {
              doc.fontSize(10)
                 .fillColor('gray')
                 .text(`   Template: ${finding.templateId}`);
              doc.fontSize(12).fillColor('black');
            }

            doc.moveDown(0.5);
          });
        } else {
          doc.fillColor('gray')
             .text('No specific findings detected.');
          doc.fillColor('black');
        }

        doc.moveDown();

        // Options
        if (result.options && Object.keys(result.options).length > 0) {
          doc.font('Helvetica-Bold')
             .fontSize(12)
             .text('Scan Options:');
          doc.font('Helvetica')
             .fontSize(10)
             .fillColor('gray')
             .text(JSON.stringify(result.options, null, 2), { width: 500 });
          doc.fontSize(12).fillColor('black');

          doc.moveDown();
        }

        // Raw output (truncated)
        if (result.output) {
          doc.font('Helvetica-Bold')
             .fontSize(12)
             .text('Raw Output (first 1000 characters):');
          doc.font('Courier')
             .fontSize(8)
             .fillColor('gray')
             .text(result.output.substring(0, 1000), { width: 500 });
          
          if (result.output.length > 1000) {
            doc.text('... (truncated)');
          }

          doc.font('Helvetica')
             .fontSize(12)
             .fillColor('black');

          doc.moveDown();
        }

        // Errors
        if (result.error) {
          doc.font('Helvetica-Bold')
             .fillColor('red')
             .text('Errors:');
          doc.font('Helvetica')
             .fontSize(10)
             .text(result.error, { width: 500 });
          doc.fontSize(12).fillColor('black');
        }
      });
    }

    // Footer on last page
    doc.addPage();
    doc.fontSize(10)
       .fillColor('gray')
       .text('Report generated by ReconWeb Security Platform', { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text('https://reconweb.security', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    // Send error response if headers not sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to generate PDF', 
        error: error.message 
      });
    }
  }
};

// Helper functions (giữ nguyên như cũ)
const addSection = (doc, title) => {
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor('darkblue')
     .text(title);
  doc.fillColor('black')
     .fontSize(12)
     .font('Helvetica');
  doc.moveDown(0.5);
};

const addKeyValue = (doc, key, value, color = 'black') => {
  doc.font('Helvetica-Bold').text(`${key}: `, { continued: true });
  doc.font('Helvetica').fillColor(color).text(value);
  doc.fillColor('black');
};

const setRiskColor = (doc, riskLevel) => {
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'green',
    safe: 'green',
    info: 'gray'
  };
  doc.fillColor(colors[riskLevel] || 'black');
};

const getSeverityColor = (severity) => {
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'blue',
    low: 'darkgreen',
    info: 'gray'
  };
  return colors[severity] || 'black';
};

module.exports = {
  generateScanPDF
};