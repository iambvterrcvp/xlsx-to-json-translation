How to Use:

1. Run `npm install` to install packages
2. Create your translation xlsx file (check `test.xlsx` file for sample) wherein:
   * sheet name = folder name
   * first row = supported translation files
   * first column = translation keys

3. Run `npm run start` to initialize transformation. The following arguments can be added:
   | arg | default | allowed value | remarks |
   |-----|---------|---------------|---------|
   | `nested` | `false` | `true` / `false` | If `true`, keys with `.` or `[x]` will be nested (example: `"a.b.c": "test"` = `"a": { "b": { "c": "test" } }`, `"a.list[0]": "test"` = `"a: { "list": ["test"] }`, else keys will be added to the json file as it is.) |
   | `filepath` | `./test.xlsx` | absolute xlsx file path | - |

   Example: `npm run start -- nested=true filepath=C:/my-folder/documents/test.xlsx`

4. Check the created folder and all its json files in `output` folder

---

(WIP)
Or go to https://iambvterrcvp.github.io/xlsx-to-json-translation/
