
var HOST = "mighty-sierra-30253.herokuapp.com"
var PORT = 9000
if (process.env.HOST != null) {
  HOST = process.env.HOST;
}
if (process.env.PORT != null) {
  PORT = process.env.PORT;
}

module.exports = {
  HOST: HOST,
  PORT: PORT
}
