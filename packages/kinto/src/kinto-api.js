const configs = require("./config");
const btoa = require("btoa");

const kintoURL = configs.kintoURL;
const _account = name => `${kintoURL}/accounts/${name}`;
const _buckets = () => `${kintoURL}/buckets`;
const _bucket = bucketName => _buckets() + `/${bucketName}`;
const _collections = bucketName => _bucket(bucketName) + `/collections`;
const _requestOptions = (method, authorization, body) => {
  return {
    method: method,
    headers: header(authorization),
    body: JSON.stringify(body)
  };
};

const header = auth => {
  const header = new Headers();
  header.set("Content-Type", "application/json");
  if (auth) {
    header.set("Authorization", "Basic " + btoa(`${auth}`));
  }
  return header;
};

const api = async (url, options) => {
  const response = await fetch(url, options);
  return response.json();
};

module.exports.createAdmin = async function(login, password) {
  const body = { data: { password: password } };
  return api(_account(login), _requestOptions("PUT", undefined, body));
};

module.exports.createUser = async function(login, password) {
  const body = { data: { password: password } };
  return api(
    _account(login),
    _requestOptions(
      "PUT",
      `${configs.adminLogin}:${configs.adminPassword}`,
      body
    )
  );
};

module.exports.createBucket = async function(name) {
  const body = { data: { id: name } };
  return api(
    _buckets(),
    _requestOptions(
      "POST",
      `${configs.adminLogin}:${configs.adminPassword}`,
      body
    )
  );
};

module.exports.createCollection = async function(bucket, collection) {
  const body = { data: { id: collection } };
  return api(
    _collections(bucket),
    _requestOptions(
      "POST",
      `${configs.adminLogin}:${configs.adminPassword}`,
      body
    )
  );
};
