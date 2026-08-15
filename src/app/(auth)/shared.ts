export const INPUT_CLASSES =
  "w-full border border-black/10 bg-cream px-4 py-3 font-sans text-sm text-ink placeholder:text-muted focus:border-forest focus:outline-none";

const AUTH_ERROR_LABELS: Record<string, string> = {
  UsernameExistsException:
    "An account with this email already exists. Please sign in instead.",
  NotAuthorizedException: "Incorrect email or password.",
  UserNotFoundException: "Incorrect email or password.",
  UserNotConfirmedException:
    "This account has not been verified yet. Check your inbox for the confirmation code.",
  CodeMismatchException: "The code you entered is incorrect.",
  ExpiredCodeException: "That code has expired. Please request a new one.",
  InvalidPasswordException:
    "That password does not meet the requirements shown below.",
  LimitExceededException: "Too many attempts — please wait a moment and try again.",
  InvalidParameterException: "Please check the details and try again.",
  InvalidOAuthFlowException:
    "The sign-in link has expired. Please start again from the beginning.",
};

export const formatAuthError = (error: unknown, fallback?: string): string => {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code && AUTH_ERROR_LABELS[code]) return AUTH_ERROR_LABELS[code];
    return error.message;
  }
  return fallback ?? "Something went wrong. Please try again.";
};