/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const mongoose = require('mongoose');
const { MONGODB } = process.env;

const dbconn = async () => {
  let connected = false;
  try {
    if (!connected) {
      await mongoose.connect(`${MONGODB}`);
      console.log('DB connected');
      connected = true;
    }
  } catch (error) {
    console.log('db connection fail');
    return process.exit(1);
  }
};

dbconn();
