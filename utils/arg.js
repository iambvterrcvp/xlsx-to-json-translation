const { checkFileExists } = require('./file')

/**
 * Returns args value based on script execution
 * @returns args
 */
const getArgs = () => {
  const args = process.argv.slice(2)
  const parsedArgs = {}
  args.forEach(arg => {
    const [key, value] = arg.split('=')
    parsedArgs[key] = value
  })
  const filePath = parsedArgs['filepath'] || './test.xlsx'
  if (!checkFileExists(filePath)) return
  const nested = parsedArgs['nested'] === 'true'
  return { filePath, nested }
}

module.exports = {
  getArgs,
}