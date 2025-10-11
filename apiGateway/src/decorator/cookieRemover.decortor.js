export const removeCookie = (proxyRes, req, res) => {
  console.log("cookie removed");
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true
  }); 
};
