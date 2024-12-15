How to Use:

1. Run `npm install`
2. Make the necesary updates on `translations.xlsx` wherein:
   * sheet name = folder name
   * first row = supported translation files
   * first column = translation keys
   NOTE: Translation key values with `.` will be treated as a nested object (example: `"a.b": "test"` will be `a: { b: "test" }`)

3. Run `npm run start`
4. Check the created folder and all its json files
