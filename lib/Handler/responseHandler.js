/* eslint-disable max-len */
// const { ResponseLogger } = require('../Logger/logger');

const ResponseHandler = async (rawdata, req, res, next) => {
  const data = await rawdata;
  if (data instanceof Error) return next(data);
  const json = JSON.parse(JSON.stringify(data)) ?? undefined;
  if (json === undefined) return res.send(rawdata);
  // ResponseLogger(json);
  // console.log(data, typeof(data));
  const message = data.message ?? 'success';
  delete data.message;
  if (Array.isArray(data)) return res.status(data.statusCode ?? 200).json({ message, items: data });
  if (typeof(data) === 'object') return res.status(data.statusCode ?? 200).json({ message, data });
};

module.exports = ResponseHandler;
