const fs = require('fs').promises
const path = require('path')

const setNestedValue = (obj, keys, value) => {
  // console.log('keys', keys)
  const key = keys.shift()
  console.log('key', key)
  if (!keys.length) {
    obj[key] = value
    // console.log('exit obj[key]', obj[key])
  } else {
    obj[key] = obj[key] || {}
    // console.log('obj[key]', obj[key])
    setNestedValue(obj[key], keys, value)
  }
}

const transformObj = (obj) => {
  const result = {}
  // console.log('obj', obj)
  for (const key in obj) {
    // console.log('key', key)
    const keys = key.split('.')
    setNestedValue(result, keys, obj[key])
  }
  // console.log('result', result)
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
      translations[keyEntry] = transformObj(translations[keyEntry])
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
      console.log(`Existing ${name} folder deleted successfully!`)
    }
    // create the folder
    await fs.mkdir(folderPath, { recursive: true })
    console.log(`${name} folder created successfully!`)
    return folderPath
  } catch (err) {
    console.error(`Error: ${err.message}`)
  }
}

const createFiles = async (folderPath, translations) => {
  for (const lang in translations) {
    const filename = `${lang}.json`
    try {
      const filePath = path.join(folderPath, filename)
      // write to the file
      await fs.writeFile(filePath, JSON.stringify(translations[lang]), 'utf8')
      console.log(`${filename} created successfully!`)
    } catch (err) {
      console.error(`Error creating ${filename}: ${err.message}`)
    }
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