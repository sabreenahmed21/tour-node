class AppError extends Error {
  constructor(){
    super();
  }
  create(message, statusCode, status){
    this.message = message;
    this.statusCode = statusCode;
    this.status = status;
    return this;
  }
}
module.exports =new AppError();