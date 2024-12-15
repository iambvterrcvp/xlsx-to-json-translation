const fs = require('fs').promises
const path = require('path')

const transformArray = (obj, keys, value, arrayIndexMatch) => {
  const [_, arrayKey, index] = arrayIndexMatch
  obj[arrayKey] = obj[arrayKey] || []
  if (keys.length === 0) obj[arrayKey][index] = value
  else {
    obj[arrayKey][index] = obj[arrayKey][index] || {}
    setNestedValue(obj[arrayKey][index], keys, value)
  }
}

const transformObj = (obj, keys, value, key) => {
  if (keys.length === 0) obj[key] = value
  else {
    obj[key] = obj[key] || {}
    setNestedValue(obj[key], keys, value)
  }
}

const setNestedValue = (obj, keys, value) => {
  const key = keys.shift()
  const arrayIndexMatch = key.match(/^(.+)\[(\d+)\]$/)
  if (arrayIndexMatch) transformArray(obj, keys, value, arrayIndexMatch)
  else transformObj(obj, keys, value, key)
}

const transformJsonObj = (obj) => {
  const result = {}
  for (const key in obj) {
    const keys = key.split('.')
    setNestedValue(result, keys, obj[key])
  }
  return result
}

const getTranslationData = (arr) => {
  const translations = {}
  for (const value of arr) {
    const translationKey = value.key
    for (const keyEntry in value) {
      if (keyEntry === 'key') continue
      if (!translations[keyEntry]) translations[keyEntry] = {}
      translations[keyEntry][translationKey] = value[keyEntry]
      translations[keyEntry] = transformJsonObj(translations[keyEntry])
    }
  }
  return translations
}

const getXlsxData = (filePath) => {
  const reader = require('xlsx')
  const file = reader.readFile(filePath)
  const sheets = file.SheetNames
  const sheetsObj = {}
  for (let index = 0; index < sheets.length; index++) {
    if (file.Workbook.Sheets[index].Hidden) continue
    sheetsObj[sheets[index]] = getTranslationData(reader.utils.sheet_to_json(file.Sheets[file.SheetNames[index]]))
  }
  return sheetsObj
}

const createFolder = async (name) => {
  try {
    const folderPath = path.join(__dirname, name)
    // check if the folder exists
    const folderExists = await fs.access(folderPath).then(() => true).catch(() => false)
    if (folderExists) {
      // delete the folder and its contents
      await fs.rm(folderPath, { recursive: true })
      console.log(`Existing ${name} deleted successfully!`)
    }
    // create the folder
    await fs.mkdir(folderPath, { recursive: true })
    console.log(`${name} created successfully!`)
    return folderPath
  } catch (err) {
    console.error(`Error: ${err.message}`)
  }
}

const replacer = (_, value) => {
  if (typeof value !== 'string') return value
  return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}

const createFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, data, 'utf8')
    console.log(`"${filePath}" created successfully!`)
  } catch (err) {
    console.error(`Error creating "${filePath}": ${err.message}`)
  }
}

const createFiles = async (folderPath, translations) => {
  for (const lang in translations) {
    const filePath = path.join(folderPath, `${lang}.json`)
    const data = JSON.stringify(translations[lang], replacer, 2)
    await createFile(filePath, data)
  }
}

const transformToJson = async (filePath) => {
  const obj = getXlsxData(filePath)
  for (const key in obj) {
    // create a folder for each sheets
    const folderPath = await createFolder(key)
    // create files for each translations
    if (folderPath) createFiles(folderPath, obj[key])
  }
  console.log(obj)
  return obj
}

// Printing data
transformToJson('./test.xlsx')