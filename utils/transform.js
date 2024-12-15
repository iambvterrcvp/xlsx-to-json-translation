const file = require('./file')
const xlsxReader = require('xlsx')
const path = require('path')

/**
 * Transforms nested array object
 * @param {*} target
 * @param {*} keys
 * @param {*} value
 * @param {*} arrayIndexMatch
 */
const transformArray = (target, keys, value, arrayIndexMatch) => {
  const [_, arrayKey, idx] = arrayIndexMatch
  target[arrayKey] = target[arrayKey] || []
  if (keys.length === 0) target[arrayKey][idx] = value
  else {
    target[arrayKey][idx] = target[arrayKey][idx] || {}
    setNestedValue(target[arrayKey][idx], keys, value)
  }
}

/**
 * Transforms nested object
 * @param {*} target
 * @param {*} keys
 * @param {*} value
 * @param {*} key
 */
const transformObject = (target, keys, value, key) => {
  if (keys.length === 0) target[key] = value
  else {
    target[key] = target[key] || {}
    setNestedValue(target[key], keys, value)
  }
}

/**
 * Transforms nested json object (example: a.b.c or a.b.list[0])
 * @param {*} target
 * @param {*} keys
 * @param {*} value
 */
const setNestedValue = (target, keys, value) => {
  const key = keys.shift()
  const arrayIndexMatch = key.match(/^(.+)\[(\d+)\]$/)
  if (arrayIndexMatch) transformArray(target, keys, value, arrayIndexMatch)
  else transformObject(target, keys, value, key)
}

/**
 * Transforms json object
 * @param {*} key 
 * @param {*} value 
 * @returns taget
 */
const transformToObject = (key, value) => {
  const target = {}
  const keys = key.split('.')
  setNestedValue(target, keys, value)
  return target
}

/**
 * Adds value to target
 * @param {*} target
 * @param {*} source
 */
const addValueToTarget = (target, source) => {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key]) target[key] = Array.isArray(source[key]) ? [] : {}
      addValueToTarget(target[key], source[key])
    } else target[key] = source[key]
  }
}

/**
 * Returns nested translation data
 * @param {*} arr
 * @returns translations
 */
const getNestedTranslationData = (arr) => {
  const translations = {}
  // get keys based on first arr value
  const keys = Object.keys(arr[0])
  const translationKey = keys[0]
  const langs = keys.slice(1)
  // traverse arr values
  for (const value of arr) {
    for (const lang of langs) {
      if (!translations[lang]) translations[lang] = {}
      const translation = transformToObject(value[translationKey], value[lang])
      addValueToTarget(translations[lang], translation)
    }
  }
  return translations
}

/**
 * Returns translation data
 * @param {*} arr
 * @returns translations
 */
const getTranslationData = (arr) => {
  const translations = {}
  // get keys based on first arr value
  const keys = Object.keys(arr[0])
  const translationKey = keys[0]
  const langs = keys.slice(1)
  // traverse arr values
  for (const value of arr) {
    for (const lang of langs) {
      if (!translations[lang]) translations[lang] = {}
      translations[lang][value[translationKey]] = value[lang]
    }
  }
  return translations
}

/**
 * Reads xlsx data and transforms json object
 * @param {*} filePath
 * @returns sheetsObj
 */
const getXlsxData = (file) => {
  const sheetsObj = {}
  const sheets = file.SheetNames
  for (let idx = 0; idx < sheets.length; idx++) {
    if (file.Workbook.Sheets[idx].Hidden) continue
    sheetsObj[sheets[idx]] = getTranslationData(xlsxReader.utils.sheet_to_json(file.Sheets[file.SheetNames[idx]]))
  }
  return sheetsObj
}

/**
 * Reads xlsx data and transforms json object
 * @param {*} file
 * @returns sheetsObj
 */
const getXlsxNestedData = (file) => {
  const sheetsObj = {}
  const sheets = file.SheetNames
  for (let idx = 0; idx < sheets.length; idx++) {
    if (file.Workbook.Sheets[idx].Hidden) continue
    sheetsObj[sheets[idx]] = getNestedTranslationData(xlsxReader.utils.sheet_to_json(file.Sheets[file.SheetNames[idx]]))
  }
  return sheetsObj
}


/**
 * Removes all redundant backlash on newline and tab
 * @param {*} _
 * @param {*} value
 * @returns \n or \t
 */
const replacer = (_, value) => {
  if (typeof value !== 'string') return value
  return value.replace(/\\n/g, '\n').replace(/\\t/g, '\t')
}

/**
 * Creates each translation files
 * @param {*} folderPath
 * @param {*} translations
 */
const createFiles = async (folderPath, translations) => {
  for (const lang in translations) {
    const filePath = path.join(folderPath, `${lang}.json`)
    const data = JSON.stringify(translations[lang], replacer, 2)
    await file.createFile(filePath, data)
  }
}

/**
 * Transforms xlsx data to json files
 * @param {*} filePath
 */
module.exports = async (filePath, nested) => {
  const xlsxFile = xlsxReader.readFile(filePath)
  if (!file) throw Error('Cannot read xlsx file!')
  const data = nested ? getXlsxNestedData(xlsxFile) : getXlsxData(xlsxFile)
  for (const key in data) {
    // create a folder for each sheets
    const folderPath = await file.createFolder(path.join('./output', key))
    // create files for each translations
    if (folderPath) createFiles(folderPath, data[key])
  }
}