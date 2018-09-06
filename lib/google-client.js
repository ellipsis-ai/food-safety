/*
@exportId JtPY0AKqRTmJ6eCT01GLHA
*/
module.exports = (function() {
return (ellipsis) => {
  const { JWT } = ellipsis.require('google-auth-library@2.0.0');
  return new JWT({
    email: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive'],
    subject: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  });
  
};
})()
     