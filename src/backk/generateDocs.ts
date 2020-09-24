import { Application, Comment, TSConfigReader, TypeDocReader } from 'typedoc-pksilen';

export default function generateDocs() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const app = new Application();
  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());
  app.bootstrap({
    exclude: ['**/*Impl.ts']
  });

  const project = app.convert(app.expandInputFiles(['src/services']));

  if (project) {
    project.children?.forEach((possibleModule) => {
      if (possibleModule.kind === 1) {
        possibleModule.children?.forEach((possibleClass) => {
          if (possibleClass.kind === 128) {
            possibleClass.children?.forEach((possibleProperty) => {
              if (possibleProperty.kind === 1024) {
                if (possibleProperty.decorators) {
                  const decorators = possibleProperty.decorators
                    .filter(
                      (decorator) => decorator.name !== 'TestValue' && decorator.name !== 'TestValueType'
                    )
                    .map((decorator) => {
                      const hasDecoratorArgumens = Object.keys(decorator.arguments).length > 0;

                      return (
                        decorator.name +
                        '(' +
                        (hasDecoratorArgumens ? JSON.stringify(decorator.arguments) : '') +
                        ')'
                      );
                    });
                  possibleProperty.comment = new Comment(decorators.join('\n'));
                }
              }
            });
          }
        });
      }
    });

    const outputDir = 'docs';
    app.generateDocs(project, outputDir);
  }
}
