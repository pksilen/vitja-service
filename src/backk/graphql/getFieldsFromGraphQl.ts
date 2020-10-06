export default function getFieldsFromGraphQl(graphQlQuery: string) {
  const graphQlQueryLines = graphQlQuery.split('\n');
  const fields: string[] = [];
  let fieldPath = '';

  graphQlQueryLines.slice(1, -1).forEach((graphQlQueryLine) => {
    if (graphQlQueryLine.endsWith('{')) {
      const fieldName = graphQlQueryLine.split('{')[0].trim();
      fieldPath = fieldPath + fieldName + '.';
    } else if (graphQlQueryLine.endsWith('}')) {
      const secondLastDotPos = fieldPath.lastIndexOf('.', fieldPath.length - 2);
      fieldPath = fieldPath.slice(0, secondLastDotPos + 1);
    } else {
      const fieldName = graphQlQueryLine.trim();
      fields.push(fieldPath + fieldName);
    }
  });

  return fields;
}
