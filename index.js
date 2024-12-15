const fs = require('fs').promises
const path = require('path')

const transformArray = (target, keys, value, arrayIndexMatch) => {
  const [_, arrayKey, index] = arrayIndexMatch
  target[arrayKey] = target[arrayKey] || []
  if (keys.length === 0) target[arrayKey][index] = value
  else {
    target[arrayKey][index] = target[arrayKey][index] || {}
    setNestedValue(target[arrayKey][index], keys, value)
  }
}

const transformObject = (target, keys, value, key) => {
  if (keys.length === 0) target[key] = value
  else {
    target[key] = target[key] || {}
    setNestedValue(target[key], keys, value)
  }
}

const setNestedValue = (target, keys, value) => {
  const key = keys.shift()
  const arrayIndexMatch = key.match(/^(.+)\[(\d+)\]$/)
  if (arrayIndexMatch) transformArray(target, keys, value, arrayIndexMatch)
  else transformObject(target, keys, value, key)
}

const transformToObject = (key, value) => {
  const target = {}
  const keys = key.split('.')
  setNestedValue(target, keys, value)
  return target
}

const addValueToTarget = (target, source) => {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = Array.isArray(source[key]) ? [] : {}
      addValueToTarget(target[key], source[key])
    } else target[key] = source[key]
  }
}

const getTranslationData = (arr) => {
  const translations = {}
  for (const value of arr) {
    for (const keyEntry in value) {
      if (keyEntry === 'key') continue
      if (!translations[keyEntry]) translations[keyEntry] = {}
      const translation = transformToObject(value.key, value[keyEntry])
      addValueToTarget(translations[keyEntry], translation)
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
  const data = getXlsxData(filePath)
  for (const key in data) {
    // create a folder for each sheets
    const folderPath = await createFolder(key)
    // create files for each translations
    if (folderPath) createFiles(folderPath, data[key])
  }
}

// Printing data
transformToJson('./test.xlsx')