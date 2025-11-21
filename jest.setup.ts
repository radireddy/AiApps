// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Ensure tests run with a clean localStorage and no leaked mocks
beforeEach(() => {
	try {
		localStorage.clear();
	} catch (e) {
		// Some environments may not have localStorage; ignore
	}
	jest.clearAllMocks();
});
