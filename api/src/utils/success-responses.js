const { SUCCESS } = require("../constants/http-status-codes");
class SuccessResponse {
  constructor({
    message,
    statusCode = SUCCESS.OK.code,
    reasonStatusCode = SUCCESS.OK.reasonPhrase,
    metadata = {},
  }) {
    this.message = message ? message : reasonStatusCode;
    this.code = statusCode;
    this.metadata = metadata;
  }
  send(res, headers = {}) {
    return res.status(this.code).set(headers).json(this);
  }
}

class OKResponse extends SuccessResponse {
  constructor({ message, metadata }) {
    super({
      message,
      statusCode: SUCCESS.OK.code,
      reasonStatusCode: SUCCESS.OK.reasonPhrase,
      metadata,
    });
  }
}

class CreatedResponse extends SuccessResponse {
  constructor({ message, metadata }) {
    super({
      message,
      statusCode: SUCCESS.CREATED.code,
      reasonStatusCode: SUCCESS.CREATED.reasonPhrase,
      metadata,
    });
  }
}
class DeletedResponse extends SuccessResponse {
  constructor({ message, metadata }) {
    super({
      message,
      statusCode: SUCCESS.NO_CONTENT.code,
      reasonStatusCode: SUCCESS.NO_CONTENT.reasonPhrase,
      metadata,
    });
  }
}
module.exports = {
  OKResponse,
  CreatedResponse,
  DeletedResponse,
};
