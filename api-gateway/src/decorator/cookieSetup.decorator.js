export const interceptResponse = (proxyRes, req, res) => {
  const accessToken = proxyRes.headers['x-access-token'];
  const refreshToken = proxyRes.headers['x-refresh-token'];
  const options = {
    httpOnly: true,
    secure: true
  }

  if (accessToken) {
    res.cookie("accessToken", accessToken, options);
    res.removeHeader?.("x-access-token");
  }

  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, options);
    res.removeHeader?.("x-refresh-token");
  }
  if (proxyRes.headers['set-cookie']) {
    delete proxyRes.headers['set-cookie'];
  }
  if (proxyRes.headers['Set-Cookie']) {
    delete proxyRes.headers['Set-Cookie'];
  }
};