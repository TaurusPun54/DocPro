const { ResponseLogger } = require('../Logger/logger');

const ResponseHandler = async (rawdata, req, res, next) => {
  const data = await rawdata;
  if (data instanceof Error) return next(data);
  const json = JSON.parse(JSON.stringify(data)) ?? undefined;
  if (json === undefined) return res.send(rawdata);
  // ResponseLogger(json);
  // console.log(json);
  return res.status(200).json(json);
};

module.exports = ResponseHandler;
