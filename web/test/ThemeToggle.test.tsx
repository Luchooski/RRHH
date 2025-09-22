import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../src/app/ThemeProvider';
import ThemeToggle from '../src/components/ThemeToggle';

test('cambia entre claro/oscuro', () => {
  render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
  const btn = screen.getByRole('button', { name: /cambiar tema/i });
  fireEvent.click(btn);
  expect(document.documentElement.classList.contains('dark')).toBe(true);
});
