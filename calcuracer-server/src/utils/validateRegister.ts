import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

const specialCharacters = [
  "'",
  ",",
  "`",
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "(",
  ")",
  "*",
  "+",
  "-",
  ".",
  "/",
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  "[",
  "]",
  "^",
  "_",
  "\\",
  "{",
  "|",
  "}",
  "~",
];

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "invalid email",
      },
    ];
  }

  if (options.username.length < 6 || options.username.length > 15) {
    return [
      {
        field: "username",
        message: "Username must be between 6-15 characters long.",
      },
    ];
  }

  if (specialCharacters.some((value) => options.username.includes(value))) {
    return [
      {
        field: "username",
        message: "Username cannot contain any special characters.",
      },
    ];
  }

  if (options.password.length < 8) {
    return [
      {
        field: "password",
        message: "Password must be at least 8 characters long.",
      },
    ];
  }

  return null;
};
