const contactService = require('./contact.service')
const { formatResponse } = require('../../utils/formatResponse')

async function list(req, res, next) {
  try {
    const data = await contactService.listContacts({
      userId: req.user.sub,
      q: req.validated.query?.q,
      limit: req.validated.query?.limit,
    })

    return res.status(200).json(formatResponse({ data }))
  } catch (error) {
    return next(error)
  }
}

module.exports = { list }
