export type RequestLoginCodeState = {
  status: "idle" | "error" | "code-sent";
  message: string;
  email: string;
  displayName: string;
  nextPath: string;
  debugCode: string | null;
};

export type VerifyLoginCodeState = {
  status: "idle" | "error";
  message: string;
};

export const initialRequestLoginCodeState: RequestLoginCodeState = {
  status: "idle",
  message: "",
  email: "",
  displayName: "",
  nextPath: "/",
  debugCode: null,
};

export const initialVerifyLoginCodeState: VerifyLoginCodeState = {
  status: "idle",
  message: "",
};
