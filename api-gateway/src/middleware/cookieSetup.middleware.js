export const interceptResponse = (proxyRes, req, res) => {
  const accessToken = proxyRes.headers['x-access-token'];
  const refreshToken = proxyRes.headers['x-refresh-token'];
  const options = {
    httpOnly: true,
    secure: true
  }

  if (accessToken) {
    res.cookie("accessToken", accessToken, options);
  }

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, options);
  }
};