const Joi = require("joi")

const range = Joi.object({
  start: Joi.date().required(),
  end: Joi.date().required(),
  limit: Joi.number().min(0).default(2).optional()
})

const bodyVerification = async (req, res, next) => {
  try {
    req.query = await range.validateAsync(req.query, {abortEarly: false})
  } catch (error) {
    console.error(error);
    return res.status(403).json({message: error.message}).end()
  }
  next()
}
module.exports = bodyVerification
