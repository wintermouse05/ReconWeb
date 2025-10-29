import { Col, Form, Row } from 'react-bootstrap';
import { TOOL_DEFINITIONS } from '../constants/tools';

const ToolOptionForm = ({ toolKey, values, onChange }) => {
  const tool = TOOL_DEFINITIONS[toolKey];

  if (!tool) {
    return null;
  }

  const handleChange = (name, type) => (event) => {
    let nextValue;
    if (type === 'checkbox') {
      nextValue = event.target.checked;
    } else if (type === 'number') {
      nextValue = event.target.value;
    } else {
      nextValue = event.target.value;
    }

    onChange(toolKey, name, nextValue);
  };

  return (
    <div className="border rounded-3 p-3 mb-3 bg-white shadow-sm">
      <h5 className="mb-3">{tool.label} Options</h5>
      <Row className="g-3">
        {tool.options.map((option) => {
          const { name, type = 'text' } = option;
          const value = values?.[name] ?? option.defaultValue ?? (type === 'checkbox' ? false : '');

          return (
            <Col xs={12} md={type === 'textarea' ? 12 : 6} key={name}>
              {type === 'checkbox' ? (
                <div>
                  <Form.Check
                    type="switch"
                    id={`${toolKey}-${name}`}
                    label={option.label}
                    checked={Boolean(value)}
                    onChange={handleChange(name, type)}
                  />
                  {option.helpText ? <Form.Text>{option.helpText}</Form.Text> : null}
                </div>
              ) : (
                <Form.Group controlId={`${toolKey}-${name}`}>
                  <Form.Label>{option.label}</Form.Label>
                  {type === 'textarea' ? (
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder={option.placeholder}
                      value={value}
                      onChange={handleChange(name, type)}
                      required={option.required}
                    />
                  ) : type === 'select' ? (
                    <Form.Select
                      value={value}
                      onChange={handleChange(name, type)}
                      required={option.required}
                    >
                      {(option.options || []).map((selectOption) => (
                        <option key={selectOption.value} value={selectOption.value}>
                          {selectOption.label}
                        </option>
                      ))}
                    </Form.Select>
                  ) : (
                    <Form.Control
                      type={type}
                      placeholder={option.placeholder}
                      value={value}
                      onChange={handleChange(name, type)}
                      min={option.min}
                      max={option.max}
                      step={option.step}
                      required={option.required}
                    />
                  )}
                  {option.helpText ? <Form.Text>{option.helpText}</Form.Text> : null}
                </Form.Group>
              )}
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ToolOptionForm;
