import { Accordion, Badge } from 'react-bootstrap';
import { TOOL_DEFINITIONS } from '../constants/tools';

const ScanResultAccordion = ({ results }) => {
  if (!results || !results.length) {
    return null;
  }

  return (
    <Accordion defaultActiveKey="0">
      {results.map((result, index) => {
        const toolLabel = TOOL_DEFINITIONS[result.tool]?.label || result.tool;
        const isSuccess = result.status === 'completed';

        return (
          <Accordion.Item eventKey={String(index)} key={`${result.tool}-${index}`}>
            <Accordion.Header>
              <div className="d-flex justify-content-between w-100 align-items-center">
                <span>{toolLabel}</span>
                <Badge bg={isSuccess ? 'success' : 'danger'}>{result.status}</Badge>
              </div>
            </Accordion.Header>
            <Accordion.Body>
              <div className="mb-3">
                <strong>Options</strong>
                <pre className="bg-body-secondary p-2 rounded-2" style={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(result.options || {}, null, 2)}
                </pre>
              </div>
              <div className="mb-3">
                <strong>Output</strong>
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
