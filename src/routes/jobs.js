const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('../model');
const { Op } = require('sequelize');
const { getProfile } = require('../middleware/getProfile');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

/**
 * @returns all unpaid jobs by user id
 */
 app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const id = req.profile.get("id")
  const { Job, Contract } = req.app.get('models')
  const jobs = await Job.findAll({
    include: [{
      model: Contract,
      required: true,
      where: {
        [Op.or]: [
          { ClientId: id },
          { ContractorId: id }
        ],
        status: {
          [Op.not]: "terminated"
        }
      }
    }],
    where: {
      paid: { [Op.not]: true }
    }
  })
  if (!jobs) return res.status(404).end()
  res.json(jobs)
})

/**
 * @returns Pay for a job, a client can only pay if his balance >= the amount to pay
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  const { job_id: jobId } = req.params
  const client = req.profile;
  if (client.get("type") !== "client") {
    return res.status(401).json({ message: "The paying profile must be client" }).end()
  }
  const id = client.get("id")
  const amount = parseInt(req.get('amount'))

  const { Job, Profile, Contract } = req.app.get('models')
  const { ContractId: contractId } = await Job.findByPk(jobId, { attributes: ["contractId"], raw: true })
  const {
    ContractorId: contractorId,
    ClientId: clientId
  } = await Contract.findByPk(contractId, { attributes: ["contractorId", "clientId"], raw: true })

  if (clientId != id) {
    return res.status(401).json({ message: "This profile does not have this job" }).end()
  }

  const transaction = await sequelize.transaction()
  try {
    if (amount > client.get("balance")) {
      return res.status(401).json({ message: "The balance for this operation is insufficient" }).end()
    }
    await client.decrement({
      balance: amount
    })
    await Profile.increment({
      balance: amount
    }, {
      where: {
        id: contractorId
      },
    })
    await Job.update({
      paid: true
    }, {
      where: {
        id: jobId,
        paid: { [Op.not]: true }
      },
    })
    await transaction.commit()
  } catch (error) {
    console.error(error)
    await transaction.rollback()
  }
  res.json({ message: `paid job ${id}` })
})

module.exports = app;
