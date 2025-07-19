class JWTConfig {
  static getInstance() {
    if (!JWTConfig.instance) {
      JWTConfig.instance = new JWTConfig();
    }
    return JWTConfig.instance;
  }

  constructor() {
    this.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    this.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    this.ACCESS_TOKEN_EXPIRY = "15m";
    this.REFRESH_TOKEN_EXPIRY = "1d";
  }
}

export default JWTConfig.getInstance();