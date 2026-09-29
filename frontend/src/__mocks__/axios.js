const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  defaults: {
    withCredentials: true,
  },
  interceptors: {
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
}

export default mockAxios
