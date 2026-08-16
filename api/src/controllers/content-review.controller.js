const { OKResponse } = require("../utils/success-responses");
const ContentVersionService = require("../services/content-version.service");
const asyncHandler = require("../utils/async-handler");

const listForVersion = asyncHandler(async (req, res) => {
  const reviews = await ContentVersionService.listReviews(req.params.id);
  return new OKResponse({ metadata: { reviews } }).send(res);
});

module.exports = { listForVersion };
