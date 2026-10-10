const progressService = require('../services/progressService');

exports.summary = async (req, res, next) => {
  try {
    res.json({ summary: await progressService.getSummary(req.user.id) });
  } catch (error) {
    next(error);
  }
};
