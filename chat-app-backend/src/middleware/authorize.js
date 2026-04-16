function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error('Forbidden')
      error.statusCode = 403
      return next(error)
    }
    return next()
  }
}

module.exports = { authorize }
