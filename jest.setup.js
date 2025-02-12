// jest.setup.js

// Adds custom DOM matchers from @testing-library/jest-dom
import "@testing-library/jest-dom";

// (Optional) If you need to mock Next.js' router for "useRouter" usage:
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(null),
      isFallback: false,
    };
  },
}));
