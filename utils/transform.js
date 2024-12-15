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
 * Inserts  nested translation data
 * @param {*} target
 * @param {*} value
 * @param {*} lang
 * @param {*} translationKey
 */
const insertNestedTranslation = (target, value, lang, translationKey) => {
  const translation = transformToObject(value[translationKey], value[lang])
  addValueToTarget(target[lang], translation)
}

/**
 * Inserts translation data with key as it is
 * @param {*} target
 * @param {*} value
 * @param {*} lang
 * @param {*} translationKey
 */
const insertNonNestedTranslation = (target, value, lang, translationKey) => {
  target[lang][value[translationKey]] = value[lang]
}

/**
 * Returns translation data
 * @param {*} data
 * @returns translations
 */
const getTranslationData = (data, insertTranslation) => {
  const translations = {}
  // get keys based on first data value
  const keys = Object.keys(data[0])
  const translationKey = keys[0]
  const langs = keys.slice(1)
  // traverse data values
  for (const value of data) {
    for (const lang of langs) {
      if (!translations[lang]) translations[lang] = {}
      insertTranslation(translations, value, lang, translationKey)
    }
  }
  return translations
}

/**
 * Reads xlsx data and transforms json object
 * @param {*} filePath
 * @returns sheetsObj
 */
const getXlsxData = (file, insertTranslation) => {
  const sheetsObj = {}
  const sheets = file.SheetNames
  for (let idx = 0; idx < sheets.length; idx++) {
    if (file.Workbook.Sheets[idx].Hidden) continue
    const data = xlsxReader.utils.sheet_to_json(file.Sheets[file.SheetNames[idx]])
    sheetsObj[sheets[idx]] = getTranslationData(data, insertTranslation)
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
  const data = getXlsxData(xlsxFile, nested ? insertNestedTranslation : insertNonNestedTranslation)
  for (const key in data) {
    // create a folder for each sheets
    const folderPath = await file.createFolder(path.join('./output', key))
    // create files for each translations
    if (folderPath) createFiles(folderPath, data[key])
  }
}