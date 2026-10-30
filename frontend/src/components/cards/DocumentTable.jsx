import { formatDate } from '../../utils/formatters.js';

export default function DocumentTable({ documents = [] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>File</th><th>Type</th><th>Added</th></tr></thead>
        <tbody>{documents.map((document) => (
          <tr key={document.id}><td>{document.file_name}</td><td>{document.content_type}</td><td>{formatDate(document.created_at)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
