const arg = require('./utils/arg')
const transform = require('./utils/transform')

// initialize xlsx to json transformation
const args = arg.getArgs()
if (args) transform(args.filePath, args.nested)