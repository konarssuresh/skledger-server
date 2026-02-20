const { OAuth2Client } = require("google-auth-library");

const getGoogleClient = () => {
  const googleClientId = process.env.OAUTH_CLIENT || process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) return null;
  return new OAuth2Client(googleClientId);
};

module.exports = getGoogleClient;
