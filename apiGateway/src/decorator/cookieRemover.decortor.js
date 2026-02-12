export const removeCookie = (proxyRes, req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false
  }); 
  console.log("cookie removed");
};
