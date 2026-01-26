let tokenProvider = null;

export const setAuthTokenProvider = (provider) => {
  tokenProvider = provider;
};

export const getAuthToken = async () => {
  if (!tokenProvider) {
    return null;
  }

  try {
    return await tokenProvider();
  } catch (error) {
    console.error("Failed to fetch auth token:", error);
    return null;
  }
};
