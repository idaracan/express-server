const { sequelize } = require('../model');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const { getProfile } = require('../middleware/getProfile');
const express = require('express');
const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

/**
 * 
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { id } = req.params
  const profileId = req.profile.id
  const { Contract } = req.app.get('models')
  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [
        { ClientId: profileId },
        { ContractorId: profileId }
      ],
    }
  })
  if (!contract) return res.status(404).json({mesage: "no profile matches"}).end()
  return res.json(contract)
})

/**
 * @returns non terminated contracts by requesting user id
 */
app.get('/contracts', getProfile, async (req, res) => {
  const id = req.profile.get("id")
  const { Contract } = req.app.get('models')
  const contract = await Contract.findAll({
    where: {
      [Op.and]: {
        [Op.or]: [
          { ClientId: id },
          { ContractorId: id }
        ],
        status: { [Op.not]: 'terminated' }
      }
    }
  })
  if (!contract) return res.status(404).end()
  res.json(contract)
})

module.exports = app;
