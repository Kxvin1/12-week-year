// jest.setup.js

// Adds custom DOM matchers from @testing-library/jest-dom
import "@testing-library/jest-dom";

// Example: ignore the JSDOM navigation not-implemented errors
beforeAll(() => {
  const originalError = console.error;
  jest.spyOn(console, "error").mockImplementation((msg, ...args) => {
    if (
      typeof msg === "string" &&
      msg.includes("Not implemented: navigation")
    ) {
      // skip that error
      return;
    }
    // otherwise show it
    originalError(msg, ...args);
  });
});

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
