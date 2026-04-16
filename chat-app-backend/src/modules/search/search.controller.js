const searchService = require('./search.service')

async function search(_req, _res, next) {
  try {
    await searchService.notImplemented()
  } catch (error) {
    next(error)
  }
}

module.exports = { search }
