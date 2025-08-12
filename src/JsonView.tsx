
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const JsonView = ({ src }: { src: object }) => {
  return (
    <SyntaxHighlighter language="json" style={docco}>
      {JSON.stringify(src, null, 2)}
    </SyntaxHighlighter>
  );
};

export default JsonView;
