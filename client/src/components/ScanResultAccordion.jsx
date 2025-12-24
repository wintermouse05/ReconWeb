import { Accordion, Badge } from 'react-bootstrap';
import { TOOL_DEFINITIONS } from '../constants/tools';
import FindingsList from './FindingsList';

const ScanResultAccordion = ({ results }) => {
  if (!results || !results.length) {
    return null;
  }

  return (
    <Accordion defaultActiveKey="0">
      {results.map((result, index) => {
        const toolLabel = TOOL_DEFINITIONS[result.tool]?.label || result.tool;
        const isSuccess = result.status === 'completed';
        const findingsCount = result.findings?.length || 0;

        return (
          <Accordion.Item eventKey={String(index)} key={`${result.tool}-${index}`}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 align-items-center">
                <span>
                  {toolLabel}
                  {findingsCount > 0 && (
                    <Badge bg="danger" className="ms-2">
                      {findingsCount} phát hiện
                    </Badge>
                  )}
                </span>
                <Badge bg={isSuccess ? 'success' : 'danger'}>{result.status}</Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              {result.findings && result.findings.length > 0 && (
                <FindingsList findings={result.findings} />
              )}
              
              <div className="mb-3">
                <strong>Options</strong>
                <pre className="bg-body-secondary p-2 rounded-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(result.options || {}, null, 2)}
                </pre>
              </div>
              <div className="mb-3">
                <strong>Raw Output</strong>
                <pre className="bg-dark text-white p-2 rounded-2 overflow-auto" style={{ maxHeight: '240px' }}>
                  {result.output || 'No output recorded.'}
                </pre>
              </div>
              {result.error ? (
                <div>
                  <strong>Error</strong>
                  <pre className="bg-danger-subtle text-danger p-2 rounded-2" style={{ whiteSpace: 'pre-wrap' }}>
                    {result.error}
                  </pre>
                </div>
              ) : null}
            </Accordion.Body>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
};

export default ScanResultAccordion;
