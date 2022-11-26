const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('../model');
const { Op } = require('sequelize');
const bodyVerification = require('../middleware/bodyVerification');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

/**
 * TODO: Optimize functions
 */

/**
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range
 */
 app.get('/admin/best-clients', bodyVerification, async (req, res) => {
  const { start, end, limit } = req.query
  const { Profile, Contract, Job } = req.app.get('models')
  const professions = await Profile.findAll({
    raw:true,
    group: "profession",
    attributes: ["firstName", "lastName", "profession"],
    where: {
      type: "client"
    },
    limit,
    subQuery: false,
    order: [
      sequelize.literal("`Client.ammountPaid` DESC")
    ],
    include: {
      model: Contract,
      as: "Client",
      attributes: [[sequelize.fn("sum", sequelize.col("price")), "ammountPaid"]],
      include: [{
        model: Job,
        attributes: ["paid"],
        where: {
          paid: 1,
          paymentDate: {
            [Op.between]: [start, end]
          }
        }
      }],
    },
  }).then(profiles => {
    return profiles = profiles.reduce((prev, profile) => {
      console.log(prev);
      console.log(profile);
      if (profile['Client.ammountPaid']) {
        prev.push(profile)
        return prev
      }
    }, [])
  })
  res.json({ professions })
})

/**
 * @returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range
 */
app.get('/admin/best-profession', bodyVerification, async (req, res) => {
  const { start, end } = req.query
  const { Profile, Contract, Job } = req.app.get('models')
  const profession = await Profile.findOne({
    group: "profession",
    attributes: ["profession"],
    where: {
      type: "contractor"
    },
    order: [
      sequelize.literal("`Contractor.jobsPaid` DESC")
    ],
    subQuery: false,
    include: {
      model: Contract,
      as: "Contractor",
      attributes: [[sequelize.fn("sum", sequelize.col("paid")), "jobsPaid"]],
      include: [{
        model: Job,
        attributes: ["paid"],
        where: {
          [Op.and]: {
            paid: 1,
            paymentDate: {
              [Op.between]: [start, end]
            }
          }
        }
      }],
    },
  }).then(profile => {
    if (profile.getDataValue("Contractor").length) {
      return profile.profession
    }
    return null
  })
  res.json({ profession })
})

module.exports = app;
