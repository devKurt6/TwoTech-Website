export class AdminSetupError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function validateAdminEmail(email) {
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    throw new AdminSetupError("INVALID_EMAIL", "Enter a valid admin email.");
  }
}

export function validateAdminPassword(password, confirmation) {
  if (password !== confirmation) {
    throw new AdminSetupError(
      "PASSWORD_MISMATCH",
      "The passwords did not match. Run the command again and enter the same password twice.",
    );
  }
  if (password.length < 12) {
    throw new AdminSetupError(
      "PASSWORD_TOO_SHORT",
      "The password must contain at least 12 characters. Run the command again with a longer password.",
    );
  }
  if (Buffer.byteLength(password) > 72) {
    throw new AdminSetupError(
      "PASSWORD_TOO_LONG",
      "The password exceeds 72 UTF-8 bytes. Use a shorter password (some symbols use multiple bytes).",
    );
  }
}

export function adminFailureMessage(error) {
  if (error instanceof AdminSetupError) return error.message;
  const messages = {
    DB_CONFIG_MISSING:
      "No database URL is configured. Add DATABASE_URL to the local .env in this project folder. Netlify variables alone are not available to this local command.",
    23505:
      "An admin with that email already exists. Sign in with that account, or use a different email.",
    "42P01":
      "The admin table is missing from the selected database. Run the database setup on the branch used by your local connection URL.",
    42501:
      "The configured database role cannot create admins. Put the Neon owner connection in MIGRATION_DATABASE_URL in your local .env.",
    "28P01":
      "Neon rejected the database username/password. Copy a fresh owner connection string from Neon into your local .env.",
    28000:
      "Neon rejected database authentication. Check the owner connection string in your local .env.",
    "3D000":
      "The database in the connection URL does not exist. Copy the connection string for the intended Neon database.",
  };
  return (
    messages[error?.code] ||
    "Could not reach or update the database. Check your network and the Neon owner connection in the local .env, then retry. No credentials were logged."
  );
}
