export const removeCookie = (proxyRes, req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true
  }); 
};
