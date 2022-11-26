const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('../model');
const { Op } = require('sequelize');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

/**
 * @returns Pay for a job, a client can only pay if his balance >= the amount to pay
 */
 app.post('/balances/deposit/:userId', async (req, res) => {
  const { userId: clientId } = req.params
  const { funds } = req.body
  const { Job, Profile, Contract } = req.app.get('models')
  let user = await Profile.findOne({
    attributes: ["id"],
    where: {
      type: "client",
      id: clientId
    },
    include: {
      model: Contract,
      as: "Client",
      attributes: [[sequelize.fn("sum", sequelize.col("price")), "totalPrices"]],
      where: {
        clientId
      },
      include: {
        model: Job,
        attributes: [],
        where: {
          paid: { [Op.not]: true },
        }
      }
    }
  })
  if (!user) {
    return res.status(404).json({ message: "user not found" }).end()
  }
  const totalPrices = user.get("Client", { plain: true })[0].totalPrices;
  if (totalPrices * 0.25 < funds) {
    return res.status(404).json({ message: "a client can't deposit more than 25% of his total of jobs to pay" }).end()
  }
  user.increment({ balance: funds })
  user = await user.reload()

  res.json({ message: "added funds", balance: user.balance })
})

module.exports = app;
