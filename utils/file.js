const fs = require('fs').promises

/**
 * Checks if file exists
 * @param {*} filePath
 * @returns boolean
 */
const checkFileExists = async (filePath) => {
  try {
    await fs.access(filePath)
    return true
  } catch {
    console.log('File does not exist.')
    return false
  }
}

/**
 * Creates a file with data as content
 * @param {*} filePath
 * @param {*} data
 */
const createFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, data, 'utf8')
    console.log(`"${filePath}" created successfully!`)
  } catch (err) {
    console.error(`Error creating "${filePath}": ${err.message}`)
  }
}

/**
 * Creates translation folder
 * @param {*} folderPath
 * @returns folderPath
 */
const createFolder = async (folderPath) => {
  try {
    // check if the folder exists
    const folderExists = await fs.access(folderPath).then(() => true).catch(() => false)
    if (folderExists) {
      // delete the folder and its contents
      await fs.rm(folderPath, { recursive: true })
      console.log(`Existing "${folderPath}" deleted successfully!`)
    }
    // create the folder
    await fs.mkdir(folderPath, { recursive: true })
    console.log(`"${folderPath}" created successfully!`)
    return folderPath
  } catch (err) {
    console.error(`Error creating "${folderPath}": ${err.message}`)
  }
}

module.exports = {
  checkFileExists,
  createFile,
  createFolder,
}