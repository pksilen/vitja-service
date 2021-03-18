export type UiProperties = {
  shouldBeVisible: boolean,
  booleanInputType: 'toggle' | 'checkbox'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function UiProperties(uiProperties: UiProperties) {
  return function() {
    // NO OPERATION
  };
}
