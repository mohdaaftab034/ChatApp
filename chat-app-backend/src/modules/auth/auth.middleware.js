const { authenticate } = require('../../middleware/authenticate')
const { authorize } = require('../../middleware/authorize')

module.exports = {
  verifyJwt: authenticate,
  roleGuard: authorize,
}
