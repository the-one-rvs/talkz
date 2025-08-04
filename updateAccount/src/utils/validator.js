export const checkPass = (password) => {
  const isLongEnough = password.length >= 6;

  const hasCapitalLetter = /[A-Z]/.test(password);

  const hasNumber = /\d/.test(password);

  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  return isLongEnough && hasCapitalLetter && hasNumber && hasSpecialChar
}